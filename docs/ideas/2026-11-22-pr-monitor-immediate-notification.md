# Idea: immediate PR comment notification

- Date: 2026-11-22
- Status: Validated

## Problem

The session-only PR lifecycle monitor currently runs as a long-lived background
process and writes proposals to a log. The harness notifies the session only
when a background command exits, so a new PR comment does not proactively
surface in the conversation. The user must ask for the log to be checked.

## What

Make new PR activity cause a harness notification without a manual check, so the
monitor can propose a response as soon as a comment arrives.

## Why

A monitor that requires the user to ask whether anything happened does not meet
the core expectation of active lifecycle watching.

## Success criteria

- A new top-level or inline review comment produces a harness notification
  within roughly 10 seconds.
- A verified merge or close produces a harness notification.
- Existing comments do not retrigger notification after the watcher starts.
- Edited comments are treated as new activity.
- No duplicate proposals are emitted for the same comment revision.
- Propose mode still requires explicit user approval before any reply, fix,
  push, or gate/report refresh.
- No comment or state is acted on outside a PR tracked by `review-and-pr`.

## Boundaries

- No autonomous merge.
- No untracked PRs.
- No new dependencies.
- No remote branch deletion.
- No external daemon or persisted repo state.
- Session-only operation remains in force.

## Assumptions

- A short-lived background command that exits on first activity is the
  notification channel available in this harness.
- A cursor may live in the approved temp directory, not in the repository.
- A bounded poll interval of about 10 seconds is an acceptable interpretation
  of “as soon as” when no comment event stream is available.
- The current long-running monitor process should be stopped when the waiter
  takes over.

## Council summary

- Brainstormer: captured the gap between a written log and a proactive session
  notification.
- Devil's Advocate: challenged the temp cursor against the “no persistent
  state” boundary. Decision: temp cursor is ephemeral session state, not repo
  state, and must be removed on stop or session end.
- Devil's Advocate: challenged “as soon as” as unbounded. Decision: target
  notification within roughly 10 seconds and document the latency.

## Decision log

| Question | Decision | Alternatives | Rationale |
| --- | --- | --- | --- |
| How should the session be notified? | Use a short-lived background waiter whose exit triggers the harness notification. | Long-running log writer; external webhook; manual checks. | Uses an existing harness signal without new infrastructure. |
| Where does dedupe state live? | Approved temp directory, per PR. | Repo file; no state; memory only. | Avoids repo changes; survives waiter restarts within the session. |
| What latency is acceptable? | Roughly 10 seconds. | Instant event-only; 1 minute poll. | Balances responsiveness with API cost and event coverage. |
| What happens to the current monitor? | Stop it before starting the waiter. | Run both concurrently. | Prevents duplicate proposals. |

## Deferred to solution design

- Whether `gh event listen` is combined with polling for review events.
- Exact waiter CLI shape and test seams.
- Cleanup of temp cursor files.

## Confirmation

User confirmed this definition on 2026-11-22.

## Solution

### Chosen approach

Replace the long-running log writer with a short-lived activity waiter. The
waiter monitors one tracked PR, exits on the first new activity, and prints a
JSON activity record. The harness notification caused by the command's exit
wakes the session; the session refreshes PR details with `gh api`, emits a
proposal card, waits for approval, acts, updates the cursor, and restarts the
waiter.

Activity detection uses two sources:

- `gh event listen` for review submissions and PR state changes, giving fast
  notification when the preview command is available.
- A roughly 10-second `gh api` poll for top-level conversation comments and as a
  fallback when event listening fails.

A temp cursor keyed by PR stores comment `id + updated_at` pairs so existing
comments do not retrigger and edited comments do. The cursor is removed on
clean stop, verified merge/close, or session cleanup.

### Alternatives considered

- **Event-only `gh event listen`:** rejected because it misses top-level
  conversation comments required by the idea.
- **Long-running monitor plus notification bridge:** rejected because the
  harness has no notification hook and an external bridge would break the
  session-only/no-dependency boundary.
- **GitHub Actions webhook/dispatch:** rejected because it requires external
  infrastructure, secrets, and persisted trust.
- **On-demand check command:** rejected because it still requires the user to
  ask whether anything happened.
- **Poll-only waiter:** retained as the fallback path; slower than event
  listening but complete and dependency-free.

### Trade-offs

- Notification latency is up to about 10 seconds when polling is the active
  source.
- The waiter must be restarted after each notification.
- A temp cursor is necessary for dedupe across restarts.
- `gh event listen` is preview and may be unavailable; failure must not stop
  monitoring.
- Event payloads are thin, so full details must be refreshed through `gh api`.

### Risks and mitigations

- **Missed top-level comments:** mitigated by the 10-second comment poll.
- **Duplicate notifications from event and poll races:** mitigated by a
  single-exit waiter and cursor update before restart.
- **Event-listener failure:** mitigated by automatic fallback to polling.
- **Stale or edited comments:** mitigated by `id + updated_at` comparison and a
  full `gh api` refresh after notification.
- **Unauthorized action:** mitigated by propose-mode approval cards and the
  existing bounded action allow-list.
- **Session-only violation:** mitigated by keeping cursor state in the approved
  temp directory and cleaning it on stop, merge/close, or session end.

### High-level steps or components

- Add a waiter CLI to `skills/pr-lifecycle-monitor/` with injectable fetch,
  spawn, timer, and filesystem seams.
- Add cursor initialization, load/save, and cleanup helpers.
- Add event-listener management with graceful fallback to polling.
- Add unit tests for new comments, edited comments, state changes, duplicate
  suppression, event failure, and cursor cleanup.
- Update `SKILL.md` and `skills/README.md` to describe the notification loop.
- Add a plan task with TDD evidence and rerun verification and review gate.

### Assumptions

- Background-command exit is the available harness notification signal.
- Temp directory state is ephemeral session state, not persisted repo state.
- Propose mode remains the default; full autonomy remains explicit opt-in.
- A ~10-second poll interval is acceptable.
- Only PRs tracked by `review-and-pr` are monitored.

### Decision log

| Challenge | Decision | Rationale |
| --- | --- | --- |
| Event-only misses top-level comments. | Add minimal top-level poll. | Satisfies the validated comment criteria without a full poll-only design. |
| `gh event listen` may be unavailable. | Fall back to polling. | Preserves monitoring with no new dependencies. |
| Event and poll may detect the same activity. | Use one exit path and update cursor before restart. | Prevents duplicate notifications. |
| Cursor could violate no-persistent-state. | Keep it in approved temp state and clean on stop/merge/session end. | No repository changes and no cross-session state. |
| Long-running monitor cannot notify. | Use a short-lived waiter. | Matches the harness notification mechanism. |

### Open questions / next steps

- Pass the confirmed solution to `implementation-planning`.
- Define exact CLI arguments and test seams during planning.
- Stop the current long-running monitor before starting the waiter.

### Council sign-off

Brainstormer and Devil's Advocate accept this solution. The comment gap, event
unavailability, duplicate risk, and temp-state boundary are resolved. User
confirmed the solution on 2026-11-22.
