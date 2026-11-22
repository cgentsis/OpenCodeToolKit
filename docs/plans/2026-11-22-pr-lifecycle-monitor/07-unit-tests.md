# Task 07 — Add unit tests for watcher behavior

## Goal and acceptance criteria

Add Jest coverage for the deterministic helpers and mocked integrations of the
PR monitor.

Acceptance criteria:

- Tests cover comment deduplication by `id` plus `updated_at`, including edited
  comments and event/poll overlap.
- Tests cover event-to-PR mapping for review comments, issue comments, and pull
  request events.
- Tests prove default mode performs no reply, edit, push, or report refresh
  without approval.
- Tests prove full autonomy allows only replies, fixes/pushes, and gate/report
  refresh, and never merges or deletes remote branches.
- Tests cover merged, closed, unverified, and already-cleaned states, proving
  `finish-worktree` is called at most once.
- Tests prove abort signal and stop hook clear listeners and timers.
- All `gh` and `git` calls are mocked; no test makes network calls or changes a
  real worktree.
- `npm test` passes with the new suite added.

## Files/areas to change

- `test/pr-lifecycle-monitor.test.js` (new).

## Architecture impact

Follows the `test/` convention in `ARCHITECTURE.md`: pure helpers exposed by
scripts and `child_process` mocked instead of touching real git or `gh`.

## Dependencies and order

Depends on tasks 04, 05, and 06.

## Verification/tests

- Run `npm test` and confirm all suites pass.
- Run `node --check` on the new test file.

## Risks and rollback

- Risk: tests rely on real CLI behavior. Mitigation: inject all process calls
  and assert exact argument arrays.
- Risk: timing-dependent poll tests. Mitigation: fake timers and explicit tick
  control instead of real waits.
- Rollback: delete the test file and fix or revert the corresponding code.

## Estimate/size

M

## Milestone mapping

Verification and handoff

## Status

complete — 2026-11-22

Verification evidence: `test/pr-lifecycle-monitor.test.js` now contains 18 tests
covering dedupe, CloudEvent mapping, merged/closed detection, listen arguments,
poll behavior, abort-signal shutdown, event/poll overlap, watcher delegation,
approval card formatting, propose/default blocking, approved actions, bounded
full autonomy, forbidden merge/delete actions, and idempotent cleanup.
`npm test -- pr-lifecycle-monitor` → PASS: 1 suite, 18 tests. Full `npm test` →
PASS: 12 suites, 115 tests. `node --check test/pr-lifecycle-monitor.test.js`
passed. All `gh`/`git` interactions are mocked; no test makes network calls or
changes a real worktree beyond the existing worktree skill's own temp repos.

### TDD Evidence

Exempt: docs/config-only
Reason: Test-only task; no production behavior changed. Earlier production tasks 04–06 carry the required Red/Green/Refactor evidence.
