'use strict';

const path = require('path');
const { execFileSync } = require('child_process');
const { isMerged, defaultFetchPr } = require('./monitor');

function defaultRunFinish(branch, pr) {
  const script = path.resolve(__dirname, '..', '..', 'finish-worktree.js');
  execFileSync(process.execPath, [script, branch], {
    stdio: 'inherit',
  });
  return { branch, pr: pr && pr.number };
}

function createCleanupHandler(options = {}) {
  const {
    verifyPr = defaultFetchPr,
    runFinish = defaultRunFinish,
    emit = () => {},
  } = options;

  const cleaned = new Set();

  async function handleMerged(prState, pr) {
    const key = pr.branch || pr.number;
    if (cleaned.has(key)) return { status: 'already-cleaned' };

    const verified = await verifyPr(pr);
    if (!isMerged(verified)) {
      emit(`pr ${pr.number} merge unverified`);
      return { status: 'unverified' };
    }

    cleaned.add(key);
    await runFinish(pr.branch, pr);
    emit(`pr ${pr.number} cleanup complete`);
    return { status: 'cleaned' };
  }

  async function handleClosed(prState, pr) {
    emit(`pr ${pr.number} closed without merge`);
    return { status: 'closed' };
  }

  return { handleMerged, handleClosed, cleaned };
}

module.exports = {
  createCleanupHandler,
  defaultRunFinish,
};
