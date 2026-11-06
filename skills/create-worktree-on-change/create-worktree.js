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


function ensureWorktree(requestedName) {
  const repoRoot = execSync('git rev-parse --show-toplevel', { encoding: 'utf8' }).trim();

  // If we are already inside a worktree that is NOT the main repository, keep using it
  try {
    execSync('git rev-parse --is-inside-work-tree', { stdio: 'ignore' });
    const worktreeRoot = execSync('git rev-parse --show-toplevel', { encoding: 'utf8' }).trim();
    if (worktreeRoot !== repoRoot) {
      process.chdir(worktreeRoot);
      return;
    }
    // If worktreeRoot === repoRoot, we are in the main repo – fall through to create a new worktree
  } catch {
    // Not inside any worktree – proceed to create one
  }

  // Determine the name to use: task name (env TASK_NAME) > provided name > generic fallback
  let name = process.env.TASK_NAME || requestedName;
  if (!name) {
    name = 'wt-change';
  }
  // Sanitize to a valid Git ref (lowercase, alphanumerics, hyphens)
  const branchName = name.trim().toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '-');

  const worktreeDir = path.join(repoRoot, 'worktrees', branchName);

  // Create the worktree on the branch (Git creates or resets the branch)
  execSync(`git worktree add -B "${branchName}" "${worktreeDir}"`, { stdio: 'ignore' });

  process.chdir(worktreeDir);
  return branchName;
}

module.exports = { ensureWorktree };
