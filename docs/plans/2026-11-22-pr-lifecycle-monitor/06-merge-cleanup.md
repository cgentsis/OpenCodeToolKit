# Task 06 — Wire merge detection to finish-worktree

## Goal and acceptance criteria

Close the local worktree lifecycle automatically when a tracked PR is verified
merged.

Acceptance criteria:

- Merge state is detected from PR events and from the one-minute poll.
- Before cleanup, the watcher re-reads the PR with `gh api` and confirms
  `state == MERGED` (or equivalent merged timestamp) and the expected head
  branch.
- `finish-worktree` is invoked exactly once per tracked PR and branch; a cleanup
  guard prevents repeat calls.
- On successful cleanup, the PR is removed from the watch list and the watcher
  emits a completion line.
- On PR close without merge, the watcher stops watching but does not clean up.
- No cleanup occurs from an event alone without verification.
- The watcher never deletes remote branches and never merges a PR.

## Files/areas to change

- `skills/pr-lifecycle-monitor/cleanup.js` (new).
- `skills/pr-lifecycle-monitor/monitor.js` (integrate merge/close handling).
- `skills/pr-lifecycle-monitor/SKILL.md` (document automatic cleanup and guard).

## Architecture impact

Completes the new pipeline link `pr-lifecycle-monitor` → `finish-worktree`
recorded in `ARCHITECTURE.md` and relies on the existing cleanup preflight.

## Dependencies and order

Depends on tasks 04 and 05.

## Verification/tests

- Task 07 unit tests cover merged, closed, already-cleaned, and unverified
  event cases with mocked `gh` and `finish-worktree` calls.
- Manual smoke test with a fake merged PR confirms one cleanup call and one
  completion line.

## Risks and rollback

- Risk: duplicate cleanup from event and poll. Mitigation: per-PR cleanup guard
  plus verification before invoking `finish-worktree`.
- Risk: cleanup fails after merge. Mitigation: report the failure and leave the
  worktree intact for manual `finish-worktree`.
- Rollback: disable the cleanup hook and revert the affected files.

## Estimate/size

M

## Milestone mapping

Detection and reaction

## Status

complete — 2026-11-22

Verification evidence: implemented `cleanup.js` with `createCleanupHandler` and
`defaultRunFinish`. `npm test -- pr-lifecycle-monitor` → PASS: 1 suite, 16
tests. Full `npm test` → PASS: 12 suites, 113 tests. `node --check` passed on
`monitor.js`, `reactions.js`, and `cleanup.js`. The handler re-verifies merged
state before calling `finish-worktree`, guards one cleanup per PR branch, skips
cleanup on close, and is used as the watcher's default merge/close handler unless
explicit callbacks are injected. No merge or remote-deletion path exists.

### TDD Evidence

Red: `npm test -- pr-lifecycle-monitor` → FAIL: test suite failed to run, `Cannot find module '../skills/pr-lifecycle-monitor/cleanup'`
Green: `npm test -- pr-lifecycle-monitor` → PASS: 1 suite, 16 tests after adding `cleanup.js` and watcher delegation
Refactor: lazy-loaded the cleanup handler in `monitor.js` to avoid a circular module dependency and exposed it on the watcher for inspection; full test suite stayed green at 113 tests
