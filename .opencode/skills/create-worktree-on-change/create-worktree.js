const { execSync } = require('child_process');
const path = require('path');

function getBaseBranch() {
  try {
    // try to get the default branch name from HEAD or fallback to 'main'
    const branch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();
    return branch || 'main';
  } catch {
    return 'main';
  }
}

function ensureWorktree() {
  const repoRoot = execSync('git rev-parse --show-toplevel', { encoding: 'utf8' }).trim();
  const worktreeDir = path.join(repoRoot, 'worktrees', 'auto');

  // If the worktree already exists, just cd there
  try {
    const stat = execSync(`[ -d "${worktreeDir}" ] && echo exists`, { encoding: 'utf8' }).trim();
    if (stat !== 'exists') {
      const base = getBaseBranch();
      execSync(`git worktree add "${worktreeDir}" "${base}"`, { stdio: 'ignore' });
    }
  } catch (e) {
    // In case of any error, fall back to creating the worktree forcibly
    const base = getBaseBranch();
    execSync(`git worktree add "${worktreeDir}" "${base}"`, { stdio: 'ignore' });
  }

  // Switch process cwd to the worktree so subsequent OpenCode actions happen there
  process.chdir(worktreeDir);
}

module.exports = { ensureWorktree };
