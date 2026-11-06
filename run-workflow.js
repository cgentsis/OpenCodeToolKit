#!/usr/bin/env node
const path = require('path');
const { ensureWorktree } = require('./skills/create-worktree-on-change/create-worktree');
const { execSync } = require('child_process');

// Accept worktree name via CLI arg or env
const requestedName = process.argv[2] || process.env.WORKTREE_NAME || 'feature-x';
// Ensure we are at repo root first
const repoRoot = execSync('git rev-parse --show-toplevel', { encoding: 'utf8' }).trim();
process.chdir(repoRoot);

const branchName = ensureWorktree(requestedName);
if (!branchName) {
  console.error('Failed to create or locate worktree');
  process.exit(1);
}

// Now inside the worktree directory
require(path.join(repoRoot, 'skills', 'review-and-pr', 'review-pr.js')).run();
