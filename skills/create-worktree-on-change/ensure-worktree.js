#!/usr/bin/env node
const { ensureWorktree } = require('./create-worktree');

const requestedName = process.argv[2] || process.env.WORKTREE_NAME || 'change';

try {
  const branch = ensureWorktree(requestedName);
  console.log(JSON.stringify({ branch, path: process.cwd() }, null, 2));
} catch (error) {
  console.error(`Error: ${error.message}`);
  process.exitCode = 1;
}
