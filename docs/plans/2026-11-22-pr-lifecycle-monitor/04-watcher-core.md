# Task 04 — Implement the watcher core

## Goal and acceptance criteria

Implement the deterministic watcher that detects comments and PR state changes
for tracked PRs without reacting to them yet.

Acceptance criteria:

- A script-backed entrypoint exists under `skills/pr-lifecycle-monitor/` and
  exposes pure helpers for tracked-PR registration, event-to-PR mapping,
  comment deduplication, and merge detection.
- Tracked PR state is in-memory only and keyed by PR number with branch,
  `lastSeen` comment map, and a cleanup guard.
- The watcher opens one `gh event listen` subscription per tracked PR for
  review comments, issue comments, and pull request events.
- The watcher also polls `gh api` every fixed 60 seconds with no configuration
  hook.
- Deduplication uses comment `id` plus `updated_at`; an unchanged comment is not
  emitted twice, and an edited comment is emitted as new activity.
- Start/stop is controlled by an abort signal and an explicit stop hook; stop
  closes listeners and timers without leaving background work.
- No state is written to disk, no remote mutation occurs, and no PR is merged.
- `gh` and `git` calls are injectable so unit tests can mock them.

## Files/areas to change

- `skills/pr-lifecycle-monitor/monitor.js` (new).
- `skills/pr-lifecycle-monitor/` helper modules as needed (new).
- `skills/pr-lifecycle-monitor/SKILL.md` (minor update to name the entrypoint).

## Architecture impact

Implements the watcher conventions added to the Script-backed skill convention
section of `ARCHITECTURE.md`: in-memory state, per-PR events, fixed poll, dedupe,
and abort-signal shutdown.

## Dependencies and order

Depends on task 01. Tasks 05 and 06 consume the emitted activity events.

## Verification/tests

- `node --check` on the new scripts.
- Task 07 unit tests prove dedupe, event mapping, poll overlap, and stop
  behavior with mocked `gh` calls.
- A dry run emits detected activity to stdout and performs no remote mutation.

## Risks and rollback

- Risk: event payload fields differ from assumptions. Mitigation: inject
  payload parsing helpers and cover representative payloads in unit tests.
- Risk: duplicate listeners on restart. Mitigation: registry tracks subscription
  handles and stops all before re-registering.
- Rollback: delete the watcher scripts and revert the SKILL.md entrypoint line.

## Estimate/size

L

## Milestone mapping

Detection and reaction

## Status

complete — 2026-11-22

Verification evidence: `npm test -- pr-lifecycle-monitor` → PASS: 1 suite, 5
tests. Full `npm test` → PASS: 12 suites, 102 tests. `node --check
skills/pr-lifecycle-monitor/monitor.js` passed. Implemented helpers:
`createCommentKey`, `dedupeComments`, `mapEventToPr`, `isMerged`, `isClosed`,
`buildListenArgs`, and `createWatcher`. The watcher uses in-memory state only,
one `gh event listen --follow` child per PR, a fixed 60-second poll (shortened
only by injected test options), and abort/stop cleanup.

CLI reality check: installed `gh event listen` emits thin CloudEvents for review
submission, PR state changes, and head changes; it does not stream issue
comments directly. The implementation therefore refreshes details with `gh api`
on each event and relies on the one-minute poll for conversation comments.
`SKILL.md` and `skills/README.md` were updated to describe this accurately.

### TDD Evidence

Red: `npm test -- pr-lifecycle-monitor` → FAIL: test suite failed to run, `Cannot find module '../skills/pr-lifecycle-monitor/monitor'`
Green: `npm test -- pr-lifecycle-monitor` → PASS: 1 suite, 5 tests after adding `monitor.js`
Refactor: changed the interval callback to return the poll promise and preserved PR object identity for callbacks; `npm test -- pr-lifecycle-monitor` and full `npm test` stayed green
