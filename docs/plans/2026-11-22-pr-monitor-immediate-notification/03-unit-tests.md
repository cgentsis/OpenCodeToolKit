# Task 03 — Add unit tests for waiter behavior

## Goal and acceptance criteria

Prove waiter detection, deduplication, fallback, and cleanup with deterministic
unit tests.

Acceptance criteria:

- New Jest suite covers: no notification for pre-existing comments, new comment
  notification, edited comment notification, PR state notification, event
  failure fallback, duplicate suppression, and cursor cleanup on stop.
- Tests inject fetch, spawn, timer, filesystem, stdout, and sleep functions; no
  real network or timer waits.
- Full `npm test` passes with no skipped tests.
- TDD evidence records Red, Green, and Refactor for this executable task.

## Files/areas to change

- `test/pr-monitor-waiter.test.js` (new).

## Architecture impact

Extends the verification conventions for `pr-lifecycle-monitor` with waiter
cursor and fallback coverage.

## Dependencies and order

Depends on tasks 01 and 02. Task 04 consumes the verified result.

## Verification/tests

- `npm test -- pr-monitor-waiter` → FAIL before implementation, PASS after.
- `npm test` → PASS.
- `node skills/test-driven-development/check-tdd-evidence.js` on this file → PASS.

## Risks and rollback

- Risk: timer-based flakiness. Mitigation: inject a fake clock/sleep function.
- Risk: stdout interleaving. Mitigation: inject a line sink and assert exact
  records.
- Rollback: delete the test suite.

## Estimate/size

M

## Milestone mapping

Verification and handoff

## Status

complete — 2026-11-22

Verification evidence: `npm test -- pr-monitor-waiter` → PASS: 1 suite, 11
tests. `npm test` → PASS: 13 suites, 126 tests. The suite covers cursor
initialization, save/load/clear, comment-key dedupe, edited comments, new
comments, merged state, event failure fallback, event/poll race suppression,
listener arguments, stop cleanup, and CLI validation. No real timers, network,
or git calls are used.

### TDD Evidence

Red: `npm test -- pr-monitor-waiter` → FAIL: test suite failed to run, `Cannot find module '../skills/pr-lifecycle-monitor/wait-for-activity'`; later detection tests failed with `createWaiter is not a function`
Green: `npm test -- pr-monitor-waiter` → PASS: 1 suite, 11 tests; `npm test` → PASS: 13 suites, 126 tests
Refactor: extracted cursor helper functions and waiter cursor-batch helpers; all 13 suites and 126 tests stayed green
