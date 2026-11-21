#!/usr/bin/env node
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { runVerification } = require('../verification-before-completion/verify-completion.js');

const REPO_ROOT = path.resolve(__dirname, '..', '..');
const CHECKS_DIR = path.join(__dirname, 'checks');
const DEFAULT_REPORT_DIR = path.join('docs', 'reviews');
const VALID_TYPES = ['code', 'design', 'specs'];
const BASELINE_RUNNER = 'verification-before-completion';

const USAGE = [
  'Usage: node skills/review-gate/run.js --type code|design|specs [--out <path>]',
  '',
  'Runs the configured scripted checks (the shared baseline runner) and writes a',
  'read-only Markdown review report with YAML frontmatter. It never edits source',
  'files and never calls gh.',
  '',
  'Options:',
  '  --type <code|design|specs>  Review type; selects the check config and default report path.',
  '  --out <path>                Report path (default: docs/reviews/<type>.md).',
  '  --help                      Print this help and exit.',
].join('\n');

// Accept either an argv array (CLI/tests) or a bare type string. Return null
// for a missing or unsupported type so callers fail closed before writing.
function parseType(value) {
  let candidate = value;
  if (Array.isArray(value)) {
    const index = value.indexOf('--type');
    if (index !== -1) {
      candidate = value[index + 1];
    } else {
      const inline = value.find((arg) => typeof arg === 'string' && arg.startsWith('--type='));
      candidate = inline ? inline.slice('--type='.length) : null;
    }
  }
  return typeof candidate === 'string' && VALID_TYPES.includes(candidate) ? candidate : null;
}

function parseArgs(argv = []) {
  const errors = [];
  let out = null;
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--out') {
      const next = argv[i + 1];
      if (!next || String(next).startsWith('--')) {
        errors.push('--out requires a path');
      } else {
        out = next;
        i += 1;
      }
    } else if (typeof arg === 'string' && arg.startsWith('--out=')) {
      out = arg.slice('--out='.length) || null;
      if (!out) errors.push('--out requires a path');
    }
  }
  return { help: argv.includes('--help'), type: parseType(argv), out, errors };
}

function resolveReportPath(type, out, options = {}) {
  if (!VALID_TYPES.includes(type)) return null;
  const cwd = options.cwd || process.cwd();
  const relative = out || path.join(DEFAULT_REPORT_DIR, `${type}.md`);
  return path.resolve(cwd, relative);
}

// Loads checks/<type>.json. Only the shared baseline runner is supported; an
// unknown runner is an error rather than a silently passing check.
function loadCheckConfig(type, fsLib = fs) {
  if (!VALID_TYPES.includes(type)) return null;
  const configPath = path.join(CHECKS_DIR, `${type}.json`);
  const config = JSON.parse(fsLib.readFileSync(configPath, 'utf8'));
  if (!config || config.runner !== BASELINE_RUNNER) {
    throw new Error(`unsupported runner in ${configPath}; expected ${BASELINE_RUNNER}`);
  }
  return config;
}

function readHead(options = {}) {
  const { spawnFn = spawnSync, cwd = REPO_ROOT } = options;
  const result = spawnFn('git', ['rev-parse', 'HEAD'], {
    cwd,
    encoding: 'utf8',
    windowsHide: true,
  });
  if (result.error || result.status !== 0) return 'unknown';
  return (result.stdout || '').trim() || 'unknown';
}

function formatScalar(value) {
  if (typeof value === 'boolean' || typeof value === 'number') return String(value);
  if (typeof value !== 'string') return JSON.stringify(value);
  const plain = /^[A-Za-z0-9_./:-]+$/;
  const looksTyped = value === 'true' || value === 'false' || /^-?\d+(\.\d+)?$/.test(value);
  return value && plain.test(value) && !looksTyped ? value : JSON.stringify(value);
}

function serializeFrontmatter(fields = {}) {
  const lines = ['---'];
  for (const [key, value] of Object.entries(fields)) {
    if (value === undefined) continue;
    lines.push(`${key}: ${Array.isArray(value) ? JSON.stringify(value) : formatScalar(value)}`);
  }
  lines.push('---');
  return `${lines.join('\n')}\n`;
}

function parseScalar(value) {
  const text = String(value).trim();
  if (text === '') return '';
  if (text.startsWith('"') && text.endsWith('"')) {
    try {
      return JSON.parse(text);
    } catch (error) {
      return text.slice(1, -1);
    }
  }
  if (text.startsWith("'") && text.endsWith("'")) {
    return text.slice(1, -1).replace(/''/g, "'");
  }
  if (text === 'true') return true;
  if (text === 'false') return false;
  if (/^-?\d+(\.\d+)?$/.test(text)) return Number(text);
  if (text.startsWith('[') && text.endsWith(']')) {
    const inner = text.slice(1, -1).trim();
    return inner ? inner.split(',').map((item) => parseScalar(item)) : [];
  }
  return text;
}

// Returns the parsed frontmatter fields plus the Markdown body as `body`.
// Handles the small YAML subset this repository uses: scalars, inline arrays,
// quoted strings, and | / > block scalars.
function parseFrontmatter(markdown = '') {
  const text = String(markdown).replace(/^\uFEFF/, '');
  const lines = text.split(/\r?\n/);
  if (lines[0].trim() !== '---') return { body: text };

  const fields = {};
  let end = -1;
  for (let i = 1; i < lines.length; i += 1) {
    if (lines[i].trim() === '---' || lines[i].trim() === '...') {
      end = i;
      break;
    }
    const match = /^([A-Za-z0-9_-]+):\s?(.*)$/.exec(lines[i]);
    if (!match) continue;
    const key = match[1];
    let value = match[2];
    const block = value.trim();
    if (/^[|>][+-]?$/.test(block)) {
      const parts = [];
      let j = i + 1;
      while (j < lines.length && (lines[j] === '' || /^\s/.test(lines[j]))) {
        parts.push(lines[j].replace(/^\s{1,2}/, ''));
        j += 1;
      }
      value = block.startsWith('>') ? parts.join(' ') : parts.join('\n');
      if (!block.endsWith('-')) value += '\n';
      i = j - 1;
    }
    fields[key] = parseScalar(value);
  }

  const body = end === -1 ? '' : lines.slice(end + 1).join('\n');
  return { ...fields, body };
}

function escapeCell(value) {
  const text = String(value == null ? '' : value)
    .replace(/\r?\n/g, ' ')
    .replace(/\|/g, '\\|')
    .trim();
  return text || '-';
}

// Accepts an options object (preferred) or positional (type, head, results).
function buildReport(options = {}, ...positional) {
  const input = typeof options === 'string'
    ? { type: options, head: positional[0], results: positional[1] }
    : options;
  const {
    type,
    head,
    config = {},
    results,
    checkResults,
    advisoryNotes,
    advisory_notes: advisoryNotesSnake,
  } = input;
  const checks = Array.isArray(results)
    ? results
    : (Array.isArray(checkResults) ? checkResults : []);
  const failed = checks.filter((result) => result && result.status !== 0);
  // Fail closed: no checks (or any non-zero status) means no pass verdict.
  const verdict = checks.length > 0 && failed.length === 0 ? 'pass' : 'fail';
  const notes = advisoryNotes !== undefined ? advisoryNotes : (advisoryNotesSnake || '');

  // Advisory notes are never consulted for the verdict or approval flag.
  const frontmatter = serializeFrontmatter({
    type,
    head,
    scripted_verdict: verdict,
    advisory_notes: notes,
    approved: false,
  });

  const rows = checks.length
    ? checks.map((result) => [
        '|',
        escapeCell(result.label || 'check'),
        '|',
        result.status === 0 ? 'PASS' : `FAIL (exit ${result.status})`,
        '|',
        escapeCell(result.output),
        '|',
      ].join(' ')).join('\n')
    : '| (no checks ran) | FAIL | - |';

  const body = [
    `# Review gate report - ${type}`,
    '',
    `Scripted verdict: **${verdict}** (authoritative; advisory notes cannot change it).`,
    `Baseline runner: \`${config.runner || BASELINE_RUNNER}\`.`,
    `Head: \`${head || 'unknown'}\`.`,
    '',
    '## Check results',
    '',
    '| Check | Result | Output |',
    '| --- | --- | --- |',
    rows,
    '',
    '## Advisory council appendix',
    '',
    "_Placeholder for the Reviewer and Devil's Advocate advisory council questions and findings. Advisory only: these notes cannot change `scripted_verdict` or set `approved`._",
    '',
  ].join('\n');

  return `${frontmatter}${body}`;
}

function runReview(argv = process.argv.slice(2), options = {}) {
  const {
    fsLib = fs,
    spawnFn = spawnSync,
    log = console.log,
    cwd = process.cwd(),
    runChecks = runVerification,
    getHead = readHead,
  } = options;

  const args = parseArgs(argv);
  if (args.help) {
    log(USAGE);
    return 0;
  }
  for (const error of args.errors) log(`Error: ${error}`);
  if (args.errors.length) {
    log(USAGE);
    return 2;
  }
  if (!args.type) {
    log('Error: --type is required and must be one of code, design, specs.');
    log(USAGE);
    return 2;
  }

  let config;
  try {
    config = loadCheckConfig(args.type, fsLib);
  } catch (error) {
    log(`Error: cannot load check config for ${args.type}: ${error.message}`);
    return 2;
  }
  if (!config) {
    log(`Error: unsupported review type: ${args.type}`);
    return 2;
  }

  const outPath = resolveReportPath(args.type, args.out, { cwd });
  const head = getHead({ spawnFn, cwd });

  let verification;
  try {
    verification = runChecks({ cwd, log });
  } catch (error) {
    log(`Error: baseline checks could not run: ${error.message}`);
    return 2;
  }
  const results = Array.isArray(verification && verification.results) ? verification.results : [];
  const report = buildReport({ type: args.type, head, results, config });

  try {
    fsLib.mkdirSync(path.dirname(outPath), { recursive: true });
    fsLib.writeFileSync(outPath, report, 'utf8');
  } catch (error) {
    log(`Error: cannot write review report to ${outPath}: ${error.message}`);
    return 2;
  }
  log(`Wrote review report: ${outPath}`);

  return results.some((result) => result && result.status !== 0) ? 1 : 0;
}

function main(argv = process.argv.slice(2)) {
  return runReview(argv);
}

if (require.main === module) {
  process.exitCode = main(process.argv.slice(2));
}

module.exports = {
  parseType,
  parseArgs,
  loadCheckConfig,
  resolveReportPath,
  readHead,
  serializeFrontmatter,
  parseFrontmatter,
  buildReport,
  runReview,
  main,
  USAGE,
  VALID_TYPES,
  BASELINE_RUNNER,
  REPO_ROOT,
  CHECKS_DIR,
  DEFAULT_REPORT_DIR,
};
