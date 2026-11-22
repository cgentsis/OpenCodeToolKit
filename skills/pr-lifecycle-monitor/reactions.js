'use strict';

const { execFileSync } = require('child_process');

const ALLOWED_AUTONOMOUS_ACTIONS = new Set(['reply', 'fix', 'refreshGates']);
const FORBIDDEN_ACTIONS = new Set(['merge', 'deleteRemoteBranch']);

function normalizeMode(mode) {
  const value = String(mode || 'propose').toLowerCase();
  return ['full', 'autonomous', 'autonomy', 'full-autonomy'].includes(value)
    ? 'full'
    : 'propose';
}

function formatApprovalCard(activity) {
  const pr = activity.pr || {};
  const comment = activity.comment || {};
  const lines = [
    `### Comment on PR #${pr.number || 'unknown'}`,
    `- Author: ${(comment.user && comment.user.login) || 'unknown'}`,
    `- Comment: ${comment.body || '(no body)'}`,
    `- Proposed reply: ${activity.proposedReply || '(none)'}`,
  ];
  if (activity.codeChangePlan) {
    lines.push(`- Code-change plan: ${activity.codeChangePlan}`);
  }
  lines.push('', 'Choices: Approve, Edit, Skip');
  return lines.join('\n');
}

function repoInfo(pr) {
  if (pr && pr.owner && pr.repo) return { owner: pr.owner, repo: pr.repo };
  const url = (pr && pr.url) || '';
  const match = /github\.com\/([^/]+)\/([^/]+)\/pull\//i.exec(url);
  return match ? { owner: match[1], repo: match[2] } : null;
}

function defaultRunGates() {
  throw new Error('Gate refresh requires an injected runGates callback');
}

function defaultRunAction(action, activity) {
  if (!action || !action.type) throw new Error('Action type is required');
  if (action.type === 'refreshGates') return { refreshed: 'deferred' };
  if (action.type !== 'reply') {
    throw new Error(`${action.type} actions require an injected runAction callback`);
  }

  const info = repoInfo(activity.pr || {});
  if (!info) throw new Error('Cannot determine repository for reply action');
  const body = action.body || activity.proposedReply || '';
  const endpoint = activity.comment && activity.comment.pull_request_review_id
    ? `repos/${info.owner}/${info.repo}/pulls/${activity.pr.number}/comments/${activity.comment.id}/replies`
    : `repos/${info.owner}/${info.repo}/issues/${activity.pr.number}/comments`;

  execFileSync('gh', ['api', endpoint, '-f', `body=${body}`], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  return { posted: true };
}

function createReactionLayer(options = {}) {
  const {
    mode = 'propose',
    emit = () => {},
    runAction = defaultRunAction,
    runGates = defaultRunGates,
    audit = emit,
  } = options;

  const normalizedMode = normalizeMode(mode);
  const state = { actions: [] };

  function auditLine(line) {
    audit(`[pr-monitor] ${line}`);
  }

  auditLine(`mode ${normalizedMode}`);

  async function executeAction(action, activity, source) {
    if (!action || !action.type) throw new Error('Action type is required');
    if (FORBIDDEN_ACTIONS.has(action.type)) {
      throw new Error(`action type ${action.type} is not permitted`);
    }
    if (normalizedMode !== 'full' && source !== 'approved') {
      throw new Error(`action source ${source} is not permitted in propose mode`);
    }
    if (normalizedMode === 'full' && !ALLOWED_AUTONOMOUS_ACTIONS.has(action.type)) {
      throw new Error(`action type ${action.type} is not permitted`);
    }

    const result = action.type === 'refreshGates'
      ? { refreshed: true }
      : await runAction(action, activity);
    if (action.type === 'fix' || action.type === 'refreshGates') {
      await runGates(action, activity);
    }
    state.actions.push({ type: action.type, source, pr: activity.pr && activity.pr.number });
    auditLine(`${source} ${action.type} PR ${activity.pr && activity.pr.number}`);
    return result;
  }

  async function handle(activity, decision = {}) {
    if (decision.skip) {
      auditLine(`skipped PR ${activity.pr && activity.pr.number}`);
      return { status: 'skipped' };
    }

    if (normalizedMode === 'propose' && !decision.approved) {
      emit(formatApprovalCard(activity));
      return { status: 'awaiting-approval' };
    }

    const source = normalizedMode === 'full' ? 'autonomous' : 'approved';
    const actions = decision.actions || activity.proposedActions || [];
    for (const action of actions) {
      await executeAction(action, activity, source);
    }
    return { status: normalizedMode === 'full' ? 'autonomous' : 'approved' };
  }

  return {
    mode: normalizedMode,
    handle,
    state,
  };
}

module.exports = {
  ALLOWED_AUTONOMOUS_ACTIONS,
  FORBIDDEN_ACTIONS,
  normalizeMode,
  formatApprovalCard,
  createReactionLayer,
};
