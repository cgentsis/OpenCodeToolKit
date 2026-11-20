#!/usr/bin/env node
const path = require('path');
const { execSync } = require('child_process');
const {
  ensureWorktree,
} = require('./skills/create-worktree-on-change/create-worktree');

async function main() {
  const requestedName = process.argv[2] || process.env.WORKTREE_NAME || 'change';
  const repoRoot = execSync('git rev-parse --show-toplevel', { encoding: 'utf8' }).trim();
  process.chdir(repoRoot);

  const branchName = ensureWorktree(requestedName);
  if (!branchName) {
    throw new Error('Failed to create or locate worktree');
  }

  const { run, hasChanges } = require(path.join(repoRoot, 'skills', 'review-and-pr', 'review-pr.js'));

  // A fresh worktree has nothing to commit. Pushing it would create an empty
  // branch and a meaningless PR, so skip the PR workflow in that case.
  if (!hasChanges()) {
    console.log(`Worktree '${branchName}' is ready. No pending changes; skipping the PR workflow.`);
    return;
  }

  const autoApprove = Boolean(
    process.env.AUTO_PR && process.env.AUTO_PR.toLowerCase() === 'yes'
  );
  await run({ branch: branchName, autoApprove });
}

main().catch((error) => {
  console.error(`❌ ${error.message}`);
  process.exitCode = 1;
});
