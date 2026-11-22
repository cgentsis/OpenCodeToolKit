'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn: nodeSpawn } = require('child_process');
const {
  EVENT_TYPES,
  createCommentKey,
  isMerged,
  isClosed,
  defaultFetchPr,
  defaultFetchComments,
} = require('./monitor');

const WAIT_POLL_INTERVAL_MS = 10 * 1000;
const DEFAULT_TEMP_DIR = path.join(os.tmpdir(), 'opencode');

function defaultSleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function prUrl(pr) {
  if (pr && pr.url) return pr.url;
  if (pr && pr.owner && pr.repo) {
    return `https://github.com/${pr.owner}/${pr.repo}/pull/${pr.number}`;
  }
  return '';
}

function buildWaitListenArgs(pr, eventTypes = EVENT_TYPES) {
  return [
    'event', 'listen',
    '--resource', prUrl(pr),
    '--count', '1',
    '--event', eventTypes.join(','),
  ];
}

function tempDirFor(options) {
  return options.tempDir || DEFAULT_TEMP_DIR;
}

function fsFor(options) {
  return options.fs || fs;
}

function cursorPath(pr, options = {}) {
  return path.join(tempDirFor(options), `pr-lifecycle-monitor-${pr.number}.cursor.json`);
}

function loadCursor(pr, options = {}) {
  const fsLib = fsFor(options);
  const filePath = cursorPath(pr, options);
  if (!fsLib.existsSync(filePath)) return { seen: [] };
  const parsed = JSON.parse(fsLib.readFileSync(filePath, 'utf8'));
  return parsed && Array.isArray(parsed.seen) ? parsed : { seen: [] };
}

function saveCursor(pr, cursor, options = {}) {
  const fsLib = fsFor(options);
  const tempDir = tempDirFor(options);
  const filePath = cursorPath(pr, options);
  fsLib.mkdirSync(tempDir, { recursive: true });
  fsLib.writeFileSync(filePath, JSON.stringify(cursor));
  return filePath;
}

function clearCursor(pr, options = {}) {
  const fsLib = fsFor(options);
  const filePath = cursorPath(pr, options);
  if (!fsLib.existsSync(filePath)) return false;
  fsLib.unlinkSync(filePath);
  return true;
}

function applyCursor(cursor, comments) {
  const seen = new Set(Array.isArray(cursor && cursor.seen) ? cursor.seen : []);
  const fresh = [];
  for (const comment of Array.isArray(comments) ? comments : []) {
    const key = createCommentKey(comment);
    if (!seen.has(key)) {
      seen.add(key);
      fresh.push(comment);
    }
  }
  return { fresh, cursor: { seen: [...seen] } };
}

function createWaiter(options = {}) {
  const {
    prs = [],
    spawn = nodeSpawn,
    fetchPr = defaultFetchPr,
    fetchComments = defaultFetchComments,
    fs: fsLib = fs,
    tempDir = DEFAULT_TEMP_DIR,
    pollIntervalMs = WAIT_POLL_INTERVAL_MS,
    sleep = defaultSleep,
    eventTypes = EVENT_TYPES,
    emit = () => {},
    onError = () => {},
  } = options;

  const state = {
    cursors: {},
    children: [],
    finished: false,
    stopped: false,
    activity: null,
  };
  const cursorOptions = { fs: fsLib, tempDir };
  for (const pr of prs) {
    state.cursors[pr.number] = loadCursor(pr, cursorOptions);
  }

  function cursorRecord(pr) {
    return state.cursors[pr.number] || { seen: [] };
  }

  function saveTrackedCursor(pr, cursor) {
    state.cursors[pr.number] = cursor;
    saveCursor(pr, cursor, cursorOptions);
  }

  function saveAllCursors() {
    for (const pr of prs) saveTrackedCursor(pr, cursorRecord(pr));
  }

  function clearAllCursors() {
    for (const pr of prs) clearCursor(pr, cursorOptions);
  }

  function stateActivity(pr, prState) {
    if (isMerged(prState)) return { type: 'state', status: 'merged', pr, prState };
    if (isClosed(prState)) return { type: 'state', status: 'closed', pr, prState };
    return null;
  }

  function commentActivity(pr, comments, prState) {
    return { type: 'comment', pr, comments, prState };
  }

  async function detect(pr) {
    if (state.finished || state.stopped) return null;
    const prState = await fetchPr(pr);
    const transition = stateActivity(pr, prState);
    if (transition) return transition;

    const comments = await fetchComments(pr);
    const applied = applyCursor(cursorRecord(pr), comments);
    saveTrackedCursor(pr, applied.cursor);
    return applied.fresh.length ? commentActivity(pr, applied.fresh, prState) : null;
  }

  async function detectAll() {
    if (state.finished || state.stopped) return null;
    for (const pr of prs) {
      const activity = await detect(pr);
      if (activity) return activity;
    }
    return null;
  }

  async function seed() {
    for (const pr of prs) {
      const prState = await fetchPr(pr);
      const transition = stateActivity(pr, prState);
      if (transition) return transition;

      const pathForPr = cursorPath(pr, cursorOptions);
      const cursorExisted = fsLib.existsSync(pathForPr);
      const comments = await fetchComments(pr);
      const applied = applyCursor(cursorRecord(pr), comments);
      saveTrackedCursor(pr, applied.cursor);
      if (cursorExisted && applied.fresh.length) {
        return commentActivity(pr, applied.fresh, prState);
      }
    }
    return null;
  }

  function killChildren() {
    for (const child of state.children) {
      if (child && typeof child.kill === 'function') child.kill();
    }
    state.children = [];
  }

  function finish(activity) {
    if (state.finished) return state.activity;
    state.finished = true;
    state.activity = activity;

    if (activity.type === 'state') {
      clearAllCursors();
    } else {
      saveAllCursors();
    }
    killChildren();
    emit(JSON.stringify(activity));
    return activity;
  }

  function handleEventLine(line) {
    if (state.finished || state.stopped) return Promise.resolve(null);
    const text = String(line || '').trim();
    if (!text) return Promise.resolve(null);
    try {
      JSON.parse(text);
    } catch {
      return Promise.resolve(null);
    }
    return detectAll()
      .then((activity) => (activity ? finish(activity) : null))
      .catch((error) => {
        onError(`event error: ${error.message}`);
        return null;
      });
  }

  function listen() {
    for (const pr of prs) {
      const child = spawn('gh', buildWaitListenArgs(pr, eventTypes), {
        stdio: ['ignore', 'pipe', 'pipe'],
      });
      state.children.push(child);
      if (child && child.on && typeof child.on === 'function') {
        child.on('error', (error) => onError(`event error: ${error.message}`));
      }
      if (child && child.stdout && typeof child.stdout.on === 'function') {
        child.stdout.on('data', (chunk) => {
          String(chunk)
            .split(/\r?\n/)
            .filter(Boolean)
            .forEach((line) => { handleEventLine(line); });
        });
      }
    }
  }

  function stop() {
    if (state.stopped || state.finished) return null;
    state.stopped = true;
    clearAllCursors();
    killChildren();
    return null;
  }

  async function start() {
    const seeded = await seed();
    if (seeded) return finish(seeded);

    listen();
    while (!state.finished && !state.stopped) {
      await sleep(pollIntervalMs);
      if (state.finished || state.stopped) break;
      const activity = await detectAll();
      if (activity) return finish(activity);
    }
    return state.activity;
  }

  return { start, stop, handleEventLine, state, fetchPr, fetchComments, spawn, sleep };
}

async function main(argv, options = {}) {
  const stderr = options.stderr || process.stderr;
  const stdout = options.stdout || process.stdout;
  const prsArg = argv[0];
  if (!prsArg) {
    stderr.write('Usage: wait-for-activity.js \'<json array of tracked PRs>\'\n');
    return 1;
  }

  let prs;
  try {
    prs = JSON.parse(prsArg);
  } catch (error) {
    stderr.write(`Invalid PR JSON: ${error.message}\n`);
    return 1;
  }
  if (!Array.isArray(prs) || prs.length === 0) {
    stderr.write('At least one tracked PR is required.\n');
    return 1;
  }

  const waiter = createWaiter({
    prs,
    emit: (line) => stdout.write(`${line}\n`),
    onError: (line) => stderr.write(`${line}\n`),
  });
  await waiter.start();
  return 0;
}

module.exports = {
  WAIT_POLL_INTERVAL_MS,
  DEFAULT_TEMP_DIR,
  EVENT_TYPES,
  createCommentKey,
  prUrl,
  buildWaitListenArgs,
  cursorPath,
  loadCursor,
  saveCursor,
  clearCursor,
  applyCursor,
  createWaiter,
  main,
};

if (require.main === module) {
  main(process.argv.slice(2))
    .then((code) => { process.exitCode = code; })
    .catch((error) => {
      process.stderr.write(`${error.message}\n`);
      process.exitCode = 1;
    });
}
