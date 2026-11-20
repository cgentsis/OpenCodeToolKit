#!/usr/bin/env node
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..', '..');
const MAX_OUTPUT_CHARS = 2000;
// npm is a .cmd shim on Windows; invoke it through cmd.exe with a fixed
// command string rather than enabling shell for every check.
const npmCheck = process.platform === 'win32'
  ? { label: 'npm test', command: process.env.ComSpec || 'cmd.exe', args: ['/d', '/s', '/c', 'npm test'] }
  : { label: 'npm test', command: 'npm', args: ['test'] };

// Single source of truth for the baseline checks. `files: true` expands to
// one `node --check` invocation per tracked JavaScript file.
const BASELINE_CHECKS = [
  npmCheck,
  { label: 'node --check', command: process.execPath, args: ['--check'], files: true },
  { label: 'git diff --check', command: 'git', args: ['diff', '--check'] },
];

const USAGE = [
  'Usage: node skills/verification-before-completion/verify-completion.js [options]',
  '',
  'Runs the baseline checks and prints their output. Optional accelerator;',
  'manual evidence is equally valid. Never a CI gate.',
  '',
  'Options:',
  '  --help    Print this help.',
].join('\n');

function jestExists() {
  const binDir = path.join(repoRoot, 'node_modules', '.bin');
  return ['jest', 'jest.cmd', 'jest.ps1'].some((name) =>
    fs.existsSync(path.join(binDir, name))
  );
}

function collectTrackedFiles(spawnFn = spawnSync, cwd = repoRoot) {
  const result = spawnFn('git', ['ls-files', '*.js'], {
    cwd,
    encoding: 'utf8',
    windowsHide: true,
  });
  if (result.status !== 0 || result.error) return [];
  return (result.stdout || '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function buildChecks(files) {
  const checks = [];
  for (const check of BASELINE_CHECKS) {
    if (check.files) {
      for (const file of files) {
        checks.push({
          label: `${check.label} ${file}`,
          command: check.command,
          args: [...check.args, file],
        });
      }
    } else {
      checks.push({ label: check.label, command: check.command, args: [...check.args] });
    }
  }
  return checks;
}

function truncate(text, maxChars) {
  const value = text || '';
  return value.length > maxChars
    ? `${value.slice(0, maxChars)}\n... [truncated ${value.length - maxChars} chars]`
    : value;
}

function runVerification(options = {}) {
  const {
    spawnFn = spawnSync,
    cwd = repoRoot,
    log = console.log,
    maxChars = MAX_OUTPUT_CHARS,
    hasJest = jestExists,
  } = options;

  const checks = buildChecks(collectTrackedFiles(spawnFn, cwd));
  const results = [];

  if (!hasJest() && checks.length) {
    log('npm test: BLOCKED');
    log('  Jest is not installed in this worktree. Run npm install first.');
    log('  This is not a passing check.');
    results.push({ label: 'npm test', status: 1, output: 'Jest not installed' });
    checks.shift();
  }

  for (const check of checks) {
    const result = spawnFn(check.command, check.args, {
      cwd,
      encoding: 'utf8',
      windowsHide: true,
    });
    const status = result.error ? 1 : result.status;
    const output = truncate(
      [result.stdout, result.stderr, result.error && result.error.message]
        .filter(Boolean)
        .join('\n'),
      maxChars
    );
    log(`${check.label}: ${status === 0 ? 'PASS' : `FAIL (exit ${status})`}`);
    if (output.trim()) log(truncate(output.split('\n').map((l) => `  ${l}`).join('\n'), maxChars));
    results.push({ label: check.label, status, output });
  }

  const failed = results.filter((result) => result.status !== 0);
  log(`Summary: ${results.length - failed.length} passed, ${failed.length} failed.`);
  return { results, failed };
}

function main(argv) {
  if (argv.includes('--help')) {
    console.log(USAGE);
    return 0;
  }
  const { failed } = runVerification();
  return failed.length ? 1 : 0;
}

if (require.main === module) {
  process.exitCode = main(process.argv.slice(2));
}

module.exports = {
  BASELINE_CHECKS,
  USAGE,
  buildChecks,
  collectTrackedFiles,
  truncate,
  runVerification,
  main,
};
