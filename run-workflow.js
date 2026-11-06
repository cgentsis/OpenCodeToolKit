#!/usr/bin/env node
const path = require('path');
const { execSync } = require('child_process');
const {
  ensureWorktree,
} = require('./skills/create-worktree-on-change/create-worktree');

async function main() {
  const requestedName = process.argv[2] || process.env.WORKTREE_NAME || 'feature-x';
  const repoRoot = execSync('git rev-parse --show-toplevel', { encoding: 'utf8' }).trim();
  process.chdir(repoRoot);

  const branchName = ensureWorktree(requestedName);
  if (!branchName) {
    throw new Error('Failed to create or locate worktree');
  }

  const { run } = require(path.join(repoRoot, 'skills', 'review-and-pr', 'review-pr.js'));
  await run({ branch: branchName });
}

main().catch((error) => {
  console.error(`❌ ${error.message}`);
  process.exitCode = 1;
});
