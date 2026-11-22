# PR Lifecycle Monitor

## Description

Add a session-only PR monitor to the repository's `review-and-pr` handoff. Once
a PR is opened or reused by that workflow, the monitor tracks it until it is
merged, closed, or the session ends.

The monitor watches two categories of activity:

- inline review-thread comments and top-level PR conversation comments;
- PR state changes, especially transition to merged.

It combines GitHub event notifications with a periodic poll so that state is
detected promptly and still checked if an event is missed.

The default mode is **notify and propose**: when a new comment is detected, the
agent summarizes it, proposes a response or code change, and waits for user
approval before acting. The user may explicitly enable **full autonomy**, in
which the monitor may reply to comments, implement and push fixes, and re-run
verification gates plus refresh the approved review report. Full autonomy does
not include merging the PR.

When the monitor verifies that a tracked PR has been merged, it runs the
existing `finish-worktree` cleanup automatically, without another confirmation.

## Goals and success metrics

Goals:

- Detect review feedback without the user manually re-checking the PR.
- Close the loop from PR creation to local cleanup after merge.
- Keep control explicit by default and allow a clearly opted-in autonomous
  mode.
- Avoid duplicate replies, duplicate cleanup, and actions on PRs outside the
  workflow's scope.

Success metrics:

1. **No missed comments or merges** — every new inline review comment,
   top-level PR comment, and merge transition on a tracked PR is detected and
   handled.
2. **No duplicate actions** — the same comment is never replied to twice, and
   cleanup never runs twice for the same merged PR.
3. **No unauthorized actions** — default mode never replies, edits, pushes, or
   refreshes the review report without approval; full autonomy is explicitly
   enabled and auditable.
4. **Clean automatic handoff** — a verified merge leads to `finish-worktree`
   cleanup without another user confirmation.

## Audience

- The user running an OpenCode session in this repository.
- Future sessions that use `review-and-pr` and want PR feedback handled without
  manual polling.
- Repository maintainers who need the local worktree lifecycle to stay in sync
  with GitHub PR state.

## Constraints and non-goals

Hard constraints:

- The monitor is **session-only**. It stops when the OpenCode session ends and
  does not persist state for later resumption.
- Use existing capabilities only: Node.js, `git`, and the authenticated `gh`
  CLI. No new runtime dependencies or external services.
- Monitor only PRs opened or refreshed by `review-and-pr` in the current
  session. Do not discover or track unrelated PRs.
- Never delete remote branches or perform destructive remote operations.
- Never merge a PR, even under full autonomy.
- Worktree-first still applies to every file change made in response to a
  comment.

Non-goals:

- A general-purpose GitHub bot.
- A persistent daemon or external scheduler.
- Monitoring other people's PRs or every open PR in the repository.
- Automatic PR merge.
- Cross-session monitoring state or replay.

## Assumptions

- `gh` is installed and authenticated for the repository.
- `review-and-pr` can register the PR it creates or reuses as a tracked PR for
  the current session.
- Inline review comments and top-level PR comments expose stable identifiers or
  timestamps that can be used for deduplication.
- GitHub events plus periodic polling can be observed while the session is
  active.
- Full autonomy will be enabled explicitly by the user for a session or a
  tracked PR; the exact mechanism is a solution-level decision.
- If a session ends before a PR merges, cleanup remains a manual `finish-worktree`
  operation in a later session.

## Decision log

| Challenge / question | Decision | Alternatives considered | Rationale |
| --- | --- | --- | --- |
| What does "react to comments" mean? | Default to notify-and-propose, with opt-in full autonomy. | Reply automatically; fix and push automatically; notify only. | Keeps the user in control by default while allowing a stronger mode when explicitly requested. |
| Which PRs are in scope? | Only PRs opened or refreshed by `review-and-pr` in the current session. | All user PRs; explicit PR list; all repository PRs. | Avoids noise, permission ambiguity, and interference with unrelated work. |
| How should state changes be detected? | Use GitHub events with a periodic poll as a safety net. | Poll only; events only; on-demand; continuous blocking wait. | Gives fast reaction to comments and merges while tolerating missed events. |
| Should cleanup require another confirmation? | No. Run `finish-worktree` automatically once merge is verified. | Ask before cleanup; only under full autonomy; report only. | The user explicitly wants automatic cleanup on merge, and the existing script already verifies merge safety before mutating. |
| What may full autonomy do? | Reply to comments, implement and push fixes, and refresh gates/report. | Also merge the PR; only reply; only notify. | Grants practical autonomy for review feedback while keeping the irreversible merge decision with the user. |
| Should monitoring survive session end? | No. Session-only. | Persist and resume; external scheduler; both session and persisted. | Matches the existing session-oriented workflow and avoids a new daemon or state store. |
| Which comment types count? | Both inline review-thread comments and top-level PR conversation comments. | Review only; conversation only; change requests only. | Satisfies the no-missed-comments criterion without silently ignoring a common feedback channel. |
| Is autonomous merge allowed? | No. | Allow merge when checks pass. | The user selected this as a hard boundary; merge remains an explicit user action. |
| Are new dependencies allowed? | No. | Add GitHub client library or scheduler package. | Existing `gh`, `git`, and Node capabilities are sufficient and keep the footprint small. |
| Which success criteria matter? | No missed comments/merges, no duplicate actions, no unauthorized actions, clean automatic handoff. | Subsets of these. | Together they cover detection, idempotency, safety, and the end-to-end lifecycle. |

## Open questions / next steps

- Choose the default polling interval and event subscription scope.
- Define the explicit full-autonomy opt-in mechanism (environment variable,
  command flag, or per-PR marker) and how it is recorded in session output.
- Choose the deduplication key for comments (comment ID, updated timestamp, or
  both) and decide how edited or deleted comments are handled.
- Define the proposal format for notify-and-propose mode, including how the user
  approves a proposed reply or code fix.
- Decide how the monitor is started and stopped from `review-and-pr` without
  leaving orphaned background work when the session ends.
- Preserve event/poll double-detection and full-autonomy opt-in as explicit
  solution-level risks to resolve before implementation.

## Council sign-off

Brainstormer: sign-off. The consolidated description covers what is tracked,
what happens on comment and merge, and where user control remains.

Devil's Advocate: sign-off with two risks carried forward into solution
brainstorming — event-plus-poll can double-detect the same activity, and full
autonomy needs an explicit, auditable opt-in. Both are open questions, not
blocking contradictions, because the success criteria and hard boundaries already
require them to be solved before implementation.

User confirmation: the consolidated idea was confirmed on 2026-11-22.

## Solution

### Chosen approach

Add a dedicated `pr-lifecycle-monitor` skill that is invoked after a successful
`review-and-pr` handoff. The skill owns an in-memory registry of PRs opened or
reused by this workflow in the current session. It watches those PRs with
`gh event listen` for immediate signals and a periodic `gh api` poll as a safety
net.

Default behavior is notify-and-propose: new comments are summarized and a reply
or code-change proposal is presented for user approval. The user may opt into
full autonomy, which permits the monitor to reply to comments, implement and
push fixes, and re-run verification gates plus refresh the approved review
report. Full autonomy still excludes merging the PR.

On verified merge, the monitor calls `finish-worktree` once for the tracked
branch and then stops watching that PR. It also stops watching on PR close or
session end. No state is persisted across sessions.

### Alternatives considered

| Alternative | Why it was not chosen |
| --- | --- |
| Watcher embedded directly in `review-and-pr` | Couples PR creation with a long-running concern and is less discoverable; the user chose a separate skill. Even in this form, `review-and-pr` must return immediately and delegate to a watcher module. |
| Standalone CLI process | Excluded during deepening because a background Node process could outlive the session and undermine the session-only constraint. |
| GitHub Actions / webhook monitor | The user relaxed the external-services boundary and allowed full monitoring, but Actions cannot act on the live worktree. Its fix path requires dispatch to the local session via `gh event listen`, adding workflow configuration and token/permission concerns without being necessary for this session-scoped need. |
| On-demand poll as primary | Rejected as primary because it can miss comments or merges between checks; accepted only as a manual fallback alongside automatic detection. |
| Automatic merge under full autonomy | Explicit non-goal; the merge decision remains with the user. |

### Trade-offs

- Monitoring is available only while the session that created the PR remains
  active. A later session must use manual checks and cleanup.
- Event listening and polling can observe the same activity, so deduplication
  is mandatory rather than optional.
- Full autonomy reduces interruptions but increases the need for an explicit,
  auditable opt-in and clear action boundaries.
- `gh event listen` is the lightweight local receiver, but its availability and
  event types must be verified against the installed CLI; polling compensates
  for gaps.
- The solution adds a new skill and eval coverage, but no runtime dependencies
  and no persistent state store.

### Risks and mitigations

| Risk | Mitigation |
| --- | --- |
| Event and poll both detect the same comment or merge | Deduplicate by stable comment ID plus updated timestamp, and guard cleanup per PR and branch. |
| A comment or merge is missed | Poll on an interval as a fallback even when event listening is active. |
| Unauthorized replies, code changes, pushes, or report refreshes | Default to notify-and-propose; require explicit full-autonomy opt-in; never merge. |
| Watcher outlives useful work or the session | Stop on merge, close, or session end; no persisted state and no standalone daemon. |
| Cleanup runs on an unverified or already-cleaned branch | Reuse `finish-worktree`, which verifies merge state, worktree cleanliness, and full branch merge before mutating. |
| Edited or deleted comments create duplicate or stale proposals | Track IDs and `updated_at`; treat edits as new activity only when content changes; ignore deletions after recording them. |
| Actions dispatch path is later adopted | Keep the local receiver as `gh event listen`; document action permissions separately. |

### High-level steps or components

1. **PR registration** — `review-and-pr` records the opened or reused PR number,
   head branch, and initial comment cursor in the session-local monitor state
   after a successful handoff.
2. **New skill** — `skills/pr-lifecycle-monitor/SKILL.md` defines when to start,
   the default approval mode, full-autonomy opt-in, stop conditions, and the
   no-merge/no-remote-deletion boundaries.
3. **Watcher core** — a Node CLI starts `gh event listen` for review comments,
   issue comments, and PR events, plus an interval poll of `gh api` endpoints
   for the tracked PRs.
4. **Deduplication state** — in-memory map keyed by PR number and comment ID,
   with `updated_at` for edits and a per-PR cleanup guard.
5. **Decision and action layer** — default mode emits a proposal to the user;
   full-autonomy mode dispatches approved action types only: reply, implement
   and push fixes, and refresh gates/report.
6. **Gate refresh path** — after code changes, re-run `review-gate` and
   `review-and-pr` enforcement before pushing, so the report remains valid for
   the new HEAD.
7. **Merge cleanup** — on verified merged state, invoke `finish-worktree` once
   for the branch, then remove the PR from the watch list.
8. **Lifecycle control** — stop the watcher on merged, closed, or session end;
   report a concise handoff summary when monitoring starts and stops.
9. **Evals and tests** — add skill eval files and unit tests for dedupe,
   authorization mode, event/poll overlap, merge detection, and idempotent
   cleanup.

### Assumptions

- `gh` is installed, authenticated, and supports the event and API commands
  needed for review comments, issue comments, PR state, and event listening.
- Review and issue comments expose stable IDs and update timestamps.
- `review-and-pr` can emit or pass the tracked PR identity to the monitor
  without writing persistent state.
- The session that opened the PR remains active while monitoring is needed.
- Full autonomy is enabled by an explicit, auditable user action; the exact
  mechanism is an implementation-planning decision.
- The default poll interval is chosen during planning and kept configurable.

### Decision log

| Challenge / question | Decision | Alternatives considered | Rationale |
| --- | --- | --- | --- |
| How should the in-session skill start and stop? | Start after PR handoff; stop on merge, close, or session end. | Manual start; start before PR; always-on. | Matches the existing handoff and avoids stale watchers. |
| Should embedded `review-and-pr` block until resolution? | No. Return immediately and watch separately. | Block until merge/close; single check cycle; prompt each time. | Keeps the existing PR workflow fast and makes the watcher a separate concern. |
| Is GitHub Actions allowed despite the no-external-services constraint? | Allowed for full monitoring in principle, but not chosen for this solution. | Forbidden; notifications only; reconsider later. | The user relaxed the boundary, but the session-local approach remains simpler. |
| How should Actions handle code fixes? | Dispatch to the local agent. | Workflow commits directly; proposal only; no fixes. | Keeps changes in the live worktree under the same workflow controls. |
| How should the local agent receive dispatches? | `gh event listen` in the active session. | Repo marker polling; local daemon; persisted resume. | Preserves session-only scope and avoids a separate process or state store. |
| Is on-demand polling acceptable? | Yes, as a fallback only. | Primary approach; reject entirely; cleanup only. | Retains simplicity for manual checks without weakening automatic detection. |
| Which solution is chosen? | Dedicated in-session monitor skill. | Embedded module; Actions; on-demand primary; standalone CLI. | Best balance of session-only scope, local worktree access, discoverability, and user control. |

### Open questions / next steps

- Choose the default poll interval and whether it is configurable by
  environment variable, skill argument, or repository config.
- Define the full-autonomy opt-in mechanism and the audit line printed when it
  is enabled.
- Choose the deduplication key (`id` alone versus `id` plus `updated_at`) and
  specify edited/deleted comment behavior.
- Define the proposal format and approval flow for notify-and-propose mode.
- Specify the exact `gh event listen` invocation and which event payload fields
  are needed to map events to tracked PRs.
- Design session-end cancellation so no watcher work is left running.
- Move to implementation planning with these acceptance criteria: no missed
  comments/merges, no duplicate actions, no unauthorized actions, clean
  automatic handoff.

### Council sign-off

Brainstormer: sign-off. The chosen approach answers how monitoring is started,
what it watches, how it reacts, how merge cleanup occurs, and how it stops.

Devil's Advocate: sign-off with carried conditions. The plan must make
deduplication and explicit autonomy opt-in testable acceptance criteria, and it
must design session-end cancellation instead of assuming it. The relaxed
GitHub Actions boundary is recorded but not used by the chosen solution.

User confirmation: the consolidated solution was confirmed on 2026-11-22.
