#!/usr/bin/env node
const { execSync } = require('child_process');
const path = require('path');

// Ensure we are at the repository root, then invoke the review‑and‑PR skill
const repoRoot = execSync('git rev-parse --show-toplevel', { encoding: 'utf8' }).trim();
process.chdir(repoRoot);
require(path.join(repoRoot, 'skills', 'review-and-pr', 'review-pr.js')).run();
