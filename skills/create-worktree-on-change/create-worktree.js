const { execSync } = require('child_process');
const path = require('path');

function getBaseRef() {
  // Use the current commit SHA so we never conflict with an existing branch worktree
  try {
    return execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
  } catch {
    // Fallback to main branch name if rev-parse fails (unlikely)
    return 'main';
  }
}


function ensureWorktree() {
  const repoRoot = execSync('git rev-parse --show-toplevel', { encoding: 'utf8' }).trim();
  const worktreeDir = path.join(repoRoot, 'worktrees', 'auto');

  // If the worktree directory does not exist, or is not yet a git worktree, create it using the current commit SHA as a detached HEAD
  try {
    // Does the directory exist and contain a git worktree?
    execSync(`git -C "${worktreeDir}" rev-parse --is-inside-work-tree`, { stdio: 'ignore' });
    // It's already a valid worktree – nothing to do
  } catch {
    // Either the directory is missing or not a worktree; create it
    const baseRef = getBaseRef();
    execSync(`git worktree add --force "${worktreeDir}" "${baseRef}"`, { stdio: 'ignore' });
  }


  process.chdir(worktreeDir);
}

module.exports = { ensureWorktree };
