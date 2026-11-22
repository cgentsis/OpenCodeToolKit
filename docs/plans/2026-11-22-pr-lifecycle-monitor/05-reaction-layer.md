# Task 05 — Implement the reaction and autonomy layer

## Goal and acceptance criteria

Turn detected activity into either an approval proposal or a bounded autonomous
action.

Acceptance criteria:

- Default mode emits a structured approval card containing the comment summary,
  proposed reply, optional code-change plan, and Approve, Edit, and Skip choices.
- Default mode performs no reply, edit, push, or report refresh until the user
  approves.
- Full autonomy is selected by a prompt at monitor start and the chosen mode is
  printed in the handoff summary; it is never inferred silently.
- Full autonomy permits only these actions: post a reply, implement and push a
  fix, and re-run verification gates plus refresh the approved review report.
- Full autonomy never merges the PR and never deletes a remote branch.
- Code fixes are applied in the correct linked worktree via the worktree-first
  rule; new commits are used rather than amending existing commits.
- After a code fix, the skill invokes the existing `review-gate` and
  `review-and-pr` enforcement paths before pushing.
- Approval decisions and autonomy mode are emitted as auditable stdout lines.

## Files/areas to change

- `skills/pr-lifecycle-monitor/reactions.js` (new).
- `skills/pr-lifecycle-monitor/monitor.js` (integrate reaction calls).
- `skills/pr-lifecycle-monitor/SKILL.md` (approval card and audit text).

## Architecture impact

Implements the watcher convention's bounded action set and audit behavior in
`ARCHITECTURE.md`, and reuses the existing review gate/report enforcement path.

## Dependencies and order

Depends on task 04. Task 06 uses the same action plumbing for merge cleanup.

## Verification/tests

- Task 07 unit tests prove default mode blocks all mutations, full autonomy
  permits only the allowed actions, and merge is never called.
- Manual smoke test with mocked `gh` and `git` confirms the approval card text
  and audit lines.

## Risks and rollback

- Risk: an action slips outside the bounded set. Mitigation: centralize action
  dispatch behind one allow-list and test it exhaustively.
- Risk: gate refresh produces a stale report. Mitigation: reuse the existing
  review-and-pr check rather than editing report frontmatter directly.
- Rollback: disable reaction dispatch and revert the affected files.

## Estimate/size

L

## Milestone mapping

Detection and reaction

## Status

complete — 2026-11-22

Verification evidence: implemented `reactions.js` with `formatApprovalCard`,
`normalizeMode`, `ALLOWED_AUTONOMOUS_ACTIONS`, and `createReactionLayer`.
`npm test -- pr-lifecycle-monitor` → PASS: 1 suite, 11 tests. Full `npm test` →
PASS: 12 suites, 108 tests. `node --check` passed on both `monitor.js` and
`reactions.js`. The watcher now delegates detected comments to the reaction
layer unless an explicit `onActivity` callback is injected. Default mode emits
the approval card and blocks actions; approved and full-autonomy modes use an
allow-list that excludes merge and remote deletion. Full autonomy routes `fix`
and `refreshGates` through the injected gate runner so report freshness is
rechecked before push.

### TDD Evidence

Red: `npm test -- pr-lifecycle-monitor` → FAIL: test suite failed to run, `Cannot find module '../skills/pr-lifecycle-monitor/reactions'`
Green: `npm test -- pr-lifecycle-monitor` → PASS: 1 suite, 11 tests after adding `reactions.js` and watcher delegation
Refactor: separated `refreshGates` from generic action execution so only allowed action types call the gate runner; full test suite stayed green at 108 tests
