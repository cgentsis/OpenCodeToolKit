#!/usr/bin/env node
const { execFileSync } = require('child_process');
const path = require('path');

function log(message) {
  console.log(message);
}

function git(args, options = {}) {
  return execFileSync('git', args, { encoding: 'utf8', ...options }).trim();
}

function runGit(args, options = {}) {
  execFileSync('git', args, options);
}

function isLinkedWorktree() {
  const gitDir = path.resolve(git(['rev-parse', '--git-dir']));
  const commonDir = path.resolve(git(['rev-parse', '--git-common-dir']));
  return gitDir !== commonDir;
}

function getCurrentBranch() {
  const branch = git(['rev-parse', '--abbrev-ref', 'HEAD']);
  return branch === 'HEAD' ? null : branch;
}

function getWorktreePath() {
  return git(['rev-parse', '--show-toplevel']);
}

function getMainCheckout() {
  const output = git(['worktree', 'list', '--porcelain']);
  const line = output.split('\n').find((entry) => entry.startsWith('worktree '));
  return line ? line.slice('worktree '.length) : null;
}

function getMainBranch(mainCheckout) {
  return git(['rev-parse', '--abbrev-ref', 'HEAD'], { cwd: mainCheckout });
}

function findWorktreeForBranch(branch) {
  const output = git(['worktree', 'list', '--porcelain']);
  const worktrees = [];
  let current = {};

  for (const line of output.split('\n')) {
    if (line.startsWith('worktree ')) {
      current.path = line.slice('worktree '.length);
    } else if (line.startsWith('branch ')) {
      current.branch = line.slice('branch '.length).replace(/^refs\/heads\//, '');
    } else if (line === '') {
      if (current.path) worktrees.push(current);
      current = {};
    }
  }
  if (current.path) worktrees.push(current);

  return worktrees.find((worktree) => worktree.branch === branch) || null;
}

function getPendingChanges(worktreePath) {
  return worktreePath
    ? git(['-C', worktreePath, 'status', '--porcelain'])
    : git(['status', '--porcelain']);
}

function getPrState(branch) {
  return execFileSync(
    'gh',
    ['pr', 'view', branch, '--json', 'state', '--jq', '.state'],
    { encoding: 'utf8' }
  ).trim();
}

function checkPrMerged(branch) {
  let state;
  try {
    state = getPrState(branch);
  } catch (error) {
    throw new Error(`Unable to verify PR state for '${branch}': ${error.message}`);
  }
  if (state !== 'MERGED') {
    throw new Error(`PR for '${branch}' is '${state || 'unknown'}', not MERGED`);
  }
}

function preflight(baseBranch, branchArg = null) {
  const mainCheckout = getMainCheckout();
  if (!mainCheckout) {
    throw new Error('Cannot locate the main checkout');
  }
  const mainBranch = getMainBranch(mainCheckout);

  let branch;
  let worktreePath;

  if (branchArg) {
    branch = branchArg;
    if (branch === mainBranch) {
      throw new Error(`Cannot finish the main branch '${mainBranch}'`);
    }
    const worktree = findWorktreeForBranch(branch);
    if (!worktree) {
      throw new Error(`No registered worktree for branch '${branch}'`);
    }
    worktreePath = worktree.path;
  } else {
    if (!isLinkedWorktree()) {
      return null;
    }
    branch = getCurrentBranch();
    if (!branch) {
      throw new Error('Detached HEAD; cannot finish this worktree');
    }
    worktreePath = getWorktreePath();
  }

  if (mainBranch !== baseBranch) {
    throw new Error(
      `Main checkout is on '${mainBranch}', expected '${baseBranch}'`
    );
  }

  const pending = getPendingChanges(worktreePath);
  if (pending) {
    throw new Error(`Worktree '${branch}' has uncommitted changes:\n${pending}`);
  }

  checkPrMerged(branch);

  return { branch, worktreePath, mainCheckout, mainBranch };
}

async function run({
  dryRun = false,
  verbose = false,
  baseBranch = 'main',
  branchArg = null,
} = {}) {
  const info = preflight(baseBranch, branchArg);
  if (!info) {
    log('Not inside a linked worktree; nothing to do.');
    return;
  }

  const { branch, worktreePath, mainCheckout } = info;
  log(`Branch: ${branch}`);
  log(`Worktree: ${worktreePath}`);
  log(`Main checkout: ${mainCheckout}`);

  const commands = [
    {
      args: ['-C', mainCheckout, 'pull', '--ff-only'],
      label: `git -C ${mainCheckout} pull --ff-only`,
    },
    {
      args: ['-C', mainCheckout, 'worktree', 'remove', worktreePath],
      label: `git -C ${mainCheckout} worktree remove ${worktreePath}`,
    },
    {
      args: ['-C', mainCheckout, 'branch', '-d', branch],
      label: `git -C ${mainCheckout} branch -d ${branch}`,
    },
  ];

  for (const command of commands) {
    if (dryRun) {
      log(`[dry-run] ${command.label}`);
      continue;
    }
    if (verbose) log(command.label);
    runGit(command.args);
  }

  if (dryRun) {
    log('[dry-run] Workflow complete; no changes were made.');
    return;
  }

  log(`Main checkout is ready: ${mainCheckout}`);
  log(`✅ Worktree '${branch}' cleaned up`);
}

if (require.main === module) {
  run({
    dryRun: Boolean(process.env.DRY_RUN && process.env.DRY_RUN.toLowerCase() === 'yes'),
    verbose: Boolean(process.env.VERBOSE && process.env.VERBOSE.toLowerCase() === 'yes'),
    baseBranch: process.env.BASE_BRANCH || 'main',
    branchArg: process.argv[2] || process.env.FINISH_BRANCH || null,
  }).catch((error) => {
    log(`❌ ${error.message}`);
    process.exitCode = 1;
  });
}

module.exports = {
  run,
  preflight,
  isLinkedWorktree,
  getCurrentBranch,
  getWorktreePath,
  getMainCheckout,
  getMainBranch,
  findWorktreeForBranch,
  getPendingChanges,
  getPrState,
  checkPrMerged,
  git,
  runGit,
  log,
};
