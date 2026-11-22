'use strict';

const { execFileSync, spawn: nodeSpawn } = require('child_process');
const { createReactionLayer } = require('./reactions');

const POLL_INTERVAL_MS = 60 * 1000;
const EVENT_TYPES = [
  'com.github.pull_request.review.submitted.v1',
  'com.github.pull_request.state.changed.v1',
  'com.github.pull_request.head.changed.v1',
];

const PR_NUMBER_PATTERNS = [
  /repos\/[^/]+\/[^/]+\/pulls\/(\d+)/i,
  /github\.com\/[^/]+\/[^/]+\/pull\/(\d+)/i,
];

function createCommentKey(comment) {
  if (!comment || comment.id === undefined || comment.id === null) {
    return 'unknown::';
  }
  const updated = comment.updated_at || '';
  return `${comment.id}::${updated}`;
}

function dedupeComments(seen, prNumber, comments) {
  const key = String(prNumber);
  const current = new Set(seen[key] || []);
  const fresh = [];

  for (const comment of Array.isArray(comments) ? comments : []) {
    const commentKey = createCommentKey(comment);
    if (!current.has(commentKey)) {
      current.add(commentKey);
      fresh.push(comment);
    }
  }

  return {
    fresh,
    seen: { ...seen, [key]: [...current] },
  };
}

function extractPrNumber(value) {
  if (typeof value !== 'string' || !value) return null;
  for (const pattern of PR_NUMBER_PATTERNS) {
    const match = pattern.exec(value);
    if (match) return Number(match[1]);
  }
  return null;
}

function mapEventToPr(event, prs) {
  let payload = event;
  if (typeof event === 'string') {
    try {
      payload = JSON.parse(event);
    } catch {
      return null;
    }
  }
  if (!payload || typeof payload !== 'object') return null;

  const apiUrl = payload.data && (payload.data.api_url || payload.data.url)
    || payload.api_url
    || payload.resource
    || '';
  const resource = payload.resource || '';
  const prNumber = extractPrNumber(apiUrl) ?? extractPrNumber(resource);
  if (prNumber === null) return null;
  if (!prs.some((pr) => Number(pr.number) === prNumber)) return null;

  return {
    prNumber,
    type: payload.type || '',
    apiUrl,
  };
}

function isMerged(pr) {
  if (!pr) return false;
  return pr.merged === true
    || Boolean(pr.merged_at)
    || String(pr.state || '').toUpperCase() === 'MERGED';
}

function isClosed(pr) {
  if (!pr || isMerged(pr)) return false;
  return String(pr.state || '').toUpperCase() === 'CLOSED';
}

function prUrl(pr) {
  if (pr && pr.url) return pr.url;
  if (pr && pr.owner && pr.repo) {
    return `https://github.com/${pr.owner}/${pr.repo}/pull/${pr.number}`;
  }
  return '';
}

function buildListenArgs(pr, eventTypes = EVENT_TYPES) {
  return [
    'event', 'listen',
    '--resource', prUrl(pr),
    '--follow',
    '--event', eventTypes.join(','),
  ];
}

function repoInfo(pr) {
  if (pr && pr.owner && pr.repo) {
    return { owner: pr.owner, repo: pr.repo };
  }
  const url = prUrl(pr);
  const match = /github\.com\/([^/]+)\/([^/]+)\/pull\//i.exec(url);
  if (!match) return null;
  return { owner: match[1], repo: match[2] };
}

function runGh(args) {
  return execFileSync('gh', args, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

function parseGhJson(output) {
  const text = String(output || '').trim();
  if (!text) return [];
  return JSON.parse(text);
}

function defaultFetchPr(pr) {
  const info = repoInfo(pr);
  if (!info) throw new Error(`Cannot determine repository for PR ${pr.number}`);
  return parseGhJson(runGh([
    'api',
    `repos/${info.owner}/${info.repo}/pulls/${pr.number}`,
  ]));
}

function defaultFetchComments(pr) {
  const info = repoInfo(pr);
  if (!info) throw new Error(`Cannot determine repository for PR ${pr.number}`);
  const review = parseGhJson(runGh([
    'api',
    `repos/${info.owner}/${info.repo}/pulls/${pr.number}/comments`,
    '--paginate',
  ]));
  const conversation = parseGhJson(runGh([
    'api',
    `repos/${info.owner}/${info.repo}/issues/${pr.number}/comments`,
    '--paginate',
  ]));
  return [...review, ...conversation].sort((a, b) => {
    const left = String(a.created_at || a.id || '');
    const right = String(b.created_at || b.id || '');
    return left.localeCompare(right);
  });
}

function createWatcher(options = {}) {
  const {
    prs = [],
    spawn = nodeSpawn,
    fetchPr = defaultFetchPr,
    fetchComments = defaultFetchComments,
    onActivity,
    reactionLayer,
    onMerge,
    onClose,
    cleanupHandler,
    emit = () => {},
    intervalMs = POLL_INTERVAL_MS,
    setIntervalFn = setInterval,
    clearIntervalFn = clearInterval,
    signal,
    eventTypes = EVENT_TYPES,
  } = options;

  const tracked = prs.slice();
  const activeReactionLayer = reactionLayer || createReactionLayer({ emit });
  const handleActivity = onActivity || ((activity) => activeReactionLayer.handle(activity));
  const activeCleanupHandler = cleanupHandler || ((!onMerge || !onClose)
    ? (() => {
      const { createCleanupHandler } = require('./cleanup');
      return createCleanupHandler({ verifyPr: fetchPr, emit });
    })()
    : null);
  const mergeHandler = onMerge || ((prState, pr) => activeCleanupHandler.handleMerged(prState, pr));
  const closeHandler = onClose || ((prState, pr) => activeCleanupHandler.handleClosed(prState, pr));
  const state = {
    seen: {},
    cleaned: new Set(),
    stopped: false,
    timer: null,
    children: [],
  };
  let listening = false;

  function emitLine(line) {
    emit(line);
  }

  async function refreshPr(pr) {
    const prState = await fetchPr(pr);
    if (isMerged(prState) && !state.cleaned.has(pr.number)) {
      state.cleaned.add(pr.number);
      await mergeHandler(prState, pr);
      emitLine(`pr ${pr.number} merged`);
      return;
    }
    if (isClosed(prState) && !state.cleaned.has(pr.number)) {
      state.cleaned.add(pr.number);
      await closeHandler(prState, pr);
      emitLine(`pr ${pr.number} closed`);
    }
  }

  async function refreshComments(pr) {
    const comments = await fetchComments(pr);
    const result = dedupeComments(state.seen, pr.number, comments);
    state.seen = result.seen;
    for (const comment of result.fresh) {
      await handleActivity({ type: 'comment', pr, comment });
    }
  }

  async function refresh(pr) {
    if (state.stopped || state.cleaned.has(pr.number)) return;
    await Promise.all([refreshPr(pr), refreshComments(pr)]);
  }

  function poll() {
    if (state.stopped) return Promise.resolve();
    return Promise.all(tracked.map((pr) => refresh(pr)));
  }

  async function handleEventLine(line) {
    const mapped = mapEventToPr(line, tracked);
    if (!mapped) return;
    const pr = tracked.find((item) => Number(item.number) === mapped.prNumber);
    if (pr) await refresh(pr);
  }

  function listen() {
    for (const pr of tracked) {
      const child = spawn('gh', buildListenArgs(pr, eventTypes), {
        stdio: ['ignore', 'pipe', 'pipe'],
      });
      state.children.push(child);
      if (child.stdout && typeof child.stdout.on === 'function') {
        child.stdout.on('data', (chunk) => {
          String(chunk)
            .split(/\r?\n/)
            .filter(Boolean)
            .forEach((line) => {
              handleEventLine(line).catch((error) => {
                emitLine(`event error: ${error.message}`);
              });
            });
        });
      }
    }
  }

  function stop() {
    if (state.stopped) return;
    state.stopped = true;
    if (state.timer !== null && state.timer !== undefined) {
      clearIntervalFn(state.timer);
      state.timer = null;
    }
    for (const child of state.children) {
      if (child && typeof child.kill === 'function') child.kill();
    }
    state.children = [];
    emitLine('monitor stopped');
  }

  function start() {
    if (listening || state.stopped) return;
    listening = true;
    listen();
    state.timer = setIntervalFn(() => (
      poll().catch((error) => emitLine(`poll error: ${error.message}`))
    ), intervalMs);
    emitLine(`monitor started for ${tracked.length} PR(s)`);
    if (signal) {
      if (signal.aborted) {
        stop();
      } else if (typeof signal.addEventListener === 'function') {
        signal.addEventListener('abort', stop, { once: true });
      }
    }
  }

  return {
    start,
    stop,
    poll,
    handleEventLine,
    state,
    reactionLayer: activeReactionLayer,
    cleanupHandler: activeCleanupHandler,
    spawn,
    fetchPr,
    fetchComments,
    setIntervalFn,
    clearIntervalFn,
  };
}

function main(argv) {
  const prsArg = argv[0];
  if (!prsArg) {
    process.stderr.write('Usage: monitor.js \'<json array of tracked PRs>\'\n');
    return 1;
  }

  let prs;
  try {
    prs = JSON.parse(prsArg);
  } catch (error) {
    process.stderr.write(`Invalid PR JSON: ${error.message}\n`);
    return 1;
  }
  if (!Array.isArray(prs) || prs.length === 0) {
    process.stderr.write('At least one tracked PR is required.\n');
    return 1;
  }

  const watcher = createWatcher({
    prs,
    emit: (line) => process.stdout.write(`${line}\n`),
  });
  watcher.start();
  return 0;
}

if (require.main === module) {
  process.exitCode = main(process.argv.slice(2));
}

module.exports = {
  POLL_INTERVAL_MS,
  EVENT_TYPES,
  createCommentKey,
  dedupeComments,
  mapEventToPr,
  isMerged,
  isClosed,
  buildListenArgs,
  createWatcher,
  defaultFetchPr,
  defaultFetchComments,
  main,
};
