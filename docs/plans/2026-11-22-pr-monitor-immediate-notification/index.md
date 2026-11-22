# Plan: Immediate PR comment notification

## Summary

Replace the long-running PR monitor log writer with a short-lived activity
waiter. The waiter combines `gh event listen` for review/state events with a
roughly 10-second top-level comment poll, exits on the first new activity, and
lets the harness notify the session. The session then refreshes PR details,
proposes an action, waits for approval, and restarts the waiter with an updated
cursor.

## Inputs

- Idea and solution: [docs/ideas/2026-11-22-pr-monitor-immediate-notification.md](../../ideas/2026-11-22-pr-monitor-immediate-notification.md)
- Architecture: [ARCHITECTURE.md](../../../ARCHITECTURE.md)

## Milestones

| Milestone | Goal |
| --- | --- |
| Notification waiter | Build the short-lived waiter, cursor, event listener, and polling fallback. |
| Verification and handoff | Prove behavior with unit tests, documentation updates, and the full verification bar. |

## Task list

| # | Task | Milestone | Size | Dependencies |
| --- | --- | --- | --- | --- |
| 01 | [Add the waiter cursor and CLI skeleton](./01-waiter-skeleton.md) | Notification waiter | M | — |
| 02 | [Implement event and poll activity detection](./02-activity-detection.md) | Notification waiter | L | 01 |
| 03 | [Add unit tests for waiter behavior](./03-unit-tests.md) | Verification and handoff | M | 01, 02 |
| 04 | [Update docs and run final verification](./04-final-verification.md) | Verification and handoff | S | 03 |

## Dependency order

Task 01 establishes the injectable CLI and cursor helpers. Task 02 adds
detection and the single-exit notification record. Task 03 tests the behavior
with mocked `gh`, timers, and filesystem calls. Task 04 updates the skill docs
and runs the final verification bar before review.

## Decision log

| Challenge / question | Decision | Alternatives considered | Rationale |
| --- | --- | --- | --- |
| How does the session get notified? | Use a short-lived waiter whose exit triggers the harness notification. | Long-running log; external bridge; manual checks. | Uses an existing harness signal without new infrastructure. |
| How are top-level comments covered? | Add a roughly 10-second `gh api` comment poll. | Event-only; manual checks. | Satisfies the validated comment requirement. |
| What happens when event listening fails? | Fall back to polling. | Fail closed; stop monitoring. | Preserves notification with no new dependencies. |
| Where does dedupe state live? | Approved temp directory, per PR. | Repo file; memory only. | No repo state; survives waiter restarts in the session. |
| How are duplicate notifications avoided? | One exit path plus cursor update before restart. | Multiple waiters; no cursor. | Prevents event/poll races from emitting duplicates. |
| What architecture sections change? | Layout, watcher conventions, verification, and non-goals. | No change; layout only. | The waiter adds runtime and state-lifecycle conventions. |
| How granular is the plan? | Two milestones and four tasks. | One milestone; six tasks. | Each task is independently verifiable without excess overhead. |
| What is the rollback path? | Stop the waiter, delete its script/tests, and revert docs. | Feature flag; no rollback. | No persistent repo state exists. |

## Risks and assumptions

- Risk: event and poll detect the same activity. Mitigation: single-exit waiter
  and cursor update before restart.
- Risk: `gh event listen` is unavailable. Mitigation: polling fallback.
- Risk: cursor survives longer than intended. Mitigation: cleanup on stop,
  merge/close, and session cleanup.
- Risk: edited comments are treated as duplicates. Mitigation: dedupe by
  `id + updated_at`.
- Assumption: the harness notifies the session when a background command exits.
- Assumption: temp directory state is acceptable ephemeral session state.
- Assumption: `gh` is installed and authenticated.

## Open questions / next steps

- Confirm the exact `gh event listen` command shape against the installed CLI
  during implementation, with mocked tests covering payload handling.
- Stop the current long-running monitor before starting the waiter.
- After implementation, run `review-gate`, then `review-and-pr`, and push the
  update to PR #12.

### TDD Evidence

Exempt: docs/config-only
Reason: The plan index is documentation; executable task files carry their own Red/Green/Refactor evidence.
