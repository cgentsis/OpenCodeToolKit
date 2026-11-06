const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function runGit(args, opts = {}) {
  return execFileSync('git', args, opts);
}

function git(args, opts = {}) {
  return runGit(args, { encoding: 'utf8', ...opts }).trim();
}

function isInsideGitRepo() {
  try {
    execFileSync('git', ['rev-parse', '--is-inside-work-tree'], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

function getRepoRoot() {
  return git(['rev-parse', '--show-toplevel']);
}

function isLinkedWorktree() {
  const gitDir = path.resolve(git(['rev-parse', '--git-dir']));
  const commonDir = path.resolve(git(['rev-parse', '--git-common-dir']));
  return gitDir !== commonDir;
}

function getCurrentBranchName() {
  const branch = git(['rev-parse', '--abbrev-ref', 'HEAD']);
  return branch === 'HEAD' ? null : branch;
}

function listWorktrees() {
  const output = git(['worktree', 'list', '--porcelain']);
  const worktrees = [];
  let current = {};

  for (const line of output.split('\n')) {
    if (line.startsWith('worktree ')) {
      current.path = line.slice('worktree '.length);
    } else if (line.startsWith('branch ')) {
      current.branch = line.slice('branch '.length).replace(/^refs\/heads\//, '');
    } else if (line.startsWith('HEAD ')) {
      current.head = line.slice('HEAD '.length);
    } else if (line === '') {
      if (current.path) worktrees.push(current);
      current = {};
    }
  }

  if (current.path) worktrees.push(current);
  return worktrees;
}

function branchExists(branchName) {
  try {
    execFileSync('git', ['show-ref', '--verify', '--quiet', `refs/heads/${branchName}`], {
      stdio: 'ignore',
    });
    return true;
  } catch {
    return false;
  }
}

function sanitizeBranchName(name) {
  const sanitized = (name || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[-\s]+/g, '-');
  return sanitized || 'wt-change';
}

function ensureWorktree(requestedName, options = {}) {
  if (!isInsideGitRepo()) {
    throw new Error('Not inside a git repository');
  }

  if (isLinkedWorktree()) {
    return getCurrentBranchName();
  }

  const repoRoot = getRepoRoot();
  const name = options.name || process.env.TASK_NAME || requestedName;
  const branchName = sanitizeBranchName(name);
  const existing = listWorktrees().find((worktree) => worktree.branch === branchName);

  if (existing) {
    process.chdir(existing.path);
    return branchName;
  }

  const worktreeDir = path.join(repoRoot, 'worktrees', branchName);
  if (fs.existsSync(worktreeDir)) {
    throw new Error(`Worktree directory already exists but is not registered: ${worktreeDir}`);
  }

  fs.mkdirSync(path.dirname(worktreeDir), { recursive: true });

  const baseRef = options.baseRef || process.env.BASE_REF || 'HEAD';
  if (branchExists(branchName)) {
    runGit(['worktree', 'add', worktreeDir, branchName], { cwd: repoRoot, stdio: 'inherit' });
  } else {
    runGit(['worktree', 'add', '-b', branchName, worktreeDir, baseRef], {
      cwd: repoRoot,
      stdio: 'inherit',
    });
  }

  process.chdir(worktreeDir);
  return branchName;
}

module.exports = { ensureWorktree, sanitizeBranchName, listWorktrees };
