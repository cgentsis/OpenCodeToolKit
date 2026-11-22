# Task 01 — Add the waiter cursor and CLI skeleton

## Goal and acceptance criteria

Create the short-lived waiter entrypoint with injectable dependencies and temp
cursor helpers.

Acceptance criteria:

- `skills/pr-lifecycle-monitor/wait-for-activity.js` exists and parses a JSON
  array of tracked PRs from argv.
- Missing or invalid input prints a usage/error message and returns non-zero.
- Exports pure helpers for cursor path construction, load, save, clear,
  comment-key creation, and cursor application.
- Cursor files are stored only under the approved temp directory and keyed by
  PR number.
- Fetch, spawn, timer, filesystem, and stdout dependencies are injectable for
  tests.
- No network or git mutation occurs on CLI startup beyond reading the PR list.
- `node --check` passes.

## Files/areas to change

- `skills/pr-lifecycle-monitor/wait-for-activity.js` (new).

## Architecture impact

Adds the short-lived notification waiter to the repository layout and follows
the script-backed skill conventions. No pipeline stage changes.

## Dependencies and order

No dependencies. Task 02 builds activity detection on this skeleton.

## Verification/tests

- `node --check skills/pr-lifecycle-monitor/wait-for-activity.js`.
- Unit tests in task 03 cover cursor helpers and CLI validation.
- Manual invocation with no argument prints usage and exits non-zero.

## Risks and rollback

- Risk: temp path differs by platform. Mitigation: use `os.tmpdir()` plus an
  `opencode` subdirectory and allow path injection in tests.
- Risk: cursor file collision. Mitigation: include PR number in the filename.
- Rollback: delete the waiter script.

## Estimate/size

M

## Milestone mapping

Notification waiter

## Status

complete — 2026-11-22

Verification evidence: `npm test -- pr-monitor-waiter` → PASS: 1 suite, 5
tests. `node --check skills/pr-lifecycle-monitor/wait-for-activity.js` passed.
The CLI exposes `buildWaitListenArgs`, `cursorPath`, `loadCursor`, `saveCursor`,
`clearCursor`, `applyCursor`, `createCommentKey`, and `main`; invalid input is
rejected without invoking `gh`.

### TDD Evidence

Red: `npm test -- pr-monitor-waiter` → FAIL: test suite failed to run, `Cannot find module '../skills/pr-lifecycle-monitor/wait-for-activity' from 'test/pr-monitor-waiter.test.js'`
Green: `npm test -- pr-monitor-waiter` → PASS: 1 suite, 5 tests after adding `wait-for-activity.js`
Refactor: extracted `tempDirFor` and `fsFor` helpers for cursor options; `npm test -- pr-monitor-waiter` stayed green with 5 tests passed
