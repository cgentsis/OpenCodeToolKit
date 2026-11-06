#!/usr/bin/env node
const { execSync } = require('child_process');
const path = require('path');

async function main() {
  const repoRoot = execSync('git rev-parse --show-toplevel', { encoding: 'utf8' }).trim();
  process.chdir(repoRoot);
  const { run } = require(path.join(repoRoot, 'skills', 'review-and-pr', 'review-pr.js'));
  await run();
}

main().catch((error) => {
  console.error(`❌ ${error.message}`);
  process.exitCode = 1;
});
