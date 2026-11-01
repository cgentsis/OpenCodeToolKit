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

  // If the worktree directory does not exist, create it using the current commit SHA as a detached HEAD
  try {
    execSync(`[ -d "${worktreeDir}" ]`, { stdio: 'ignore' });
    // Directory exists – nothing to do
  } catch {
    const baseRef = getBaseRef();
    execSync(`git worktree add "${worktreeDir}" "${baseRef}"`, { stdio: 'ignore' });
  }


  process.chdir(worktreeDir);
}

module.exports = { ensureWorktree };
