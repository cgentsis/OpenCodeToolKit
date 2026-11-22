# Task 02 — Implement event and poll activity detection

## Goal and acceptance criteria

Make the waiter detect the first new comment or PR state change and exit with a
single activity record.

Acceptance criteria:

- Starts `gh event listen --count 1` for review submissions, PR state changes,
  and head changes for the tracked PR.
- Polls `gh api` for top-level comments and PR state roughly every 10 seconds.
- If event listening fails or is unavailable, polling continues and still
  produces notification.
- Comment deduplication uses `id + updated_at`; edited comments count as new.
- Existing comments present at first poll do not trigger notification.
- On first activity, prints one JSON record describing the activity and exits 0.
- On stop, closes the event listener, clears timers, and removes the cursor.
- Performs no reply, fix, push, merge, or remote deletion.

## Files/areas to change

- `skills/pr-lifecycle-monitor/wait-for-activity.js`.

## Architecture impact

Implements the notification-waiter convention in `ARCHITECTURE.md`: event plus
poll detection, polling fallback, single-exit notification, and temp cursor
cleanup.

## Dependencies and order

Depends on task 01. Task 03 tests the behavior.

## Verification/tests

- `node --check` on the waiter script.
- Task 03 unit tests with mocked `gh`, timers, filesystem, and stdout.
- Mocked smoke test confirms the waiter exits after synthetic activity and does
  not mutate the PR.

## Risks and rollback

- Risk: event and poll both detect the same activity. Mitigation: single-exit
  guard and cursor update before exit.
- Risk: event listener exits with an error. Mitigation: treat as fallback, not
  fatal.
- Risk: stale cursor suppresses new activity. Mitigation: compare `updated_at`
  and refresh full details after notification.
- Rollback: remove the detection loop and restore the long-running monitor docs.

## Estimate/size

L

## Milestone mapping

Notification waiter

## Status

complete — 2026-11-22

Verification evidence: `npm test -- pr-monitor-waiter` → PASS: 1 suite, 11
tests. `node --check skills/pr-lifecycle-monitor/wait-for-activity.js` passed.
The waiter seeds cursors, starts one `gh event listen --count 1` child per PR,
polls every 10 seconds, falls back to polling on event errors, exits on the
first fresh comment or merged/closed state, emits one JSON activity record, and
clears cursors on state transitions or stop.

### TDD Evidence

Red: `npm test -- pr-monitor-waiter` → FAIL: 5 detection tests failed with `TypeError: createWaiter is not a function`
Green: `npm test -- pr-monitor-waiter` → PASS: 1 suite, 11 tests after adding `createWaiter` detection and notification output
Refactor: extracted `saveAllCursors` and `clearAllCursors` helpers; `npm test -- pr-monitor-waiter` stayed green with 11 tests passed
