# Plan: PR Lifecycle Monitor

## Summary

Deliver a session-only `pr-lifecycle-monitor` skill that starts after a
successful `review-and-pr` handoff, tracks only the PRs opened or reused by that
workflow, watches review comments and conversation comments plus merge state,
and reacts with explicit user control by default. Full autonomy is an auditable
start-time choice limited to replies, code fixes/pushes, and gate/report
refresh. A verified merge triggers `finish-worktree` automatically.

The monitor uses per-PR `gh event listen` subscriptions with a fixed one-minute
`gh api` poll fallback, deduplicates by comment `id` plus `updated_at`, and keeps
all state in memory. It never merges a PR, never deletes remote branches, and
does not persist across sessions.

## Inputs

- Idea and solution: [docs/ideas/2026-11-22-pr-lifecycle-monitor.md](../../ideas/2026-11-22-pr-lifecycle-monitor.md)
- Architecture: [ARCHITECTURE.md](../../../ARCHITECTURE.md)

## Milestones

| Milestone | Goal |
| --- | --- |
| Foundation | Define the skill contract, eval coverage, and registry entries so the monitor is discoverable and validated. |
| Detection and reaction | Implement the watcher, deduplication, approval flow, full-autonomy actions, and merge cleanup. |
| Verification and handoff | Prove behavior with unit tests, offline evals, a manual smoke test, and final documentation consistency. |

## Task list

| # | Task | Milestone | Size | Dependencies |
| --- | --- | --- | --- | --- |
| 01 | [Author the PR monitor SKILL.md](./01-skill-md.md) | Foundation | M | — |
| 02 | [Add eval files for the new skill](./02-eval-files.md) | Foundation | S | 01 |
| 03 | [Register the skill in AGENTS.md and skills/README.md](./03-registry.md) | Foundation | S | 01 |
| 04 | [Implement the watcher core](./04-watcher-core.md) | Detection and reaction | L | 01 |
| 05 | [Implement the reaction and autonomy layer](./05-reaction-layer.md) | Detection and reaction | L | 04 |
| 06 | [Wire merge detection to finish-worktree](./06-merge-cleanup.md) | Detection and reaction | M | 04, 05 |
| 07 | [Add unit tests for watcher behavior](./07-unit-tests.md) | Verification and handoff | M | 04, 05, 06 |
| 08 | [Final verification and smoke test](./08-final-verification.md) | Verification and handoff | M | 02, 03, 07 |

## Dependency order

Tasks 01–03 form the foundation and can be completed in order. Task 04 builds
the watcher core; task 05 depends on it for reaction handling; task 06 depends
on both for merge cleanup. Task 07 tests the implemented behavior after tasks
04–06. Task 08 waits for eval coverage, registry updates, and unit tests, then
runs the full verification bar and a manual smoke test.

## Decision log

| Challenge / question | Decision | Alternatives considered | Rationale |
| --- | --- | --- | --- |
| What is the first shippable scope? | Full local monitor: detection, propose, full autonomy, gate refresh, automatic cleanup. | Detection/proposal only; detection/cleanup only; include Actions bridge. | The user wants the complete local lifecycle in one plan. |
| What is the poll interval? | Fixed one minute with no env var, repo config, or setup. | 5 or 10 minutes, configurable, or fixed. | Predictable detection with zero user setup. |
| How is full autonomy enabled? | Prompt once at monitor start and print the chosen mode. | Per-comment prompt; skill argument; chat instruction. | Explicit, auditable, and no pre-use configuration. |
| How are comments deduplicated? | `id` plus `updated_at`; edits become new activity. | ID only; body hash; all three. | Catches edits without adding content hashing. |
| How are proposals presented? | Structured approval card with Approve, Edit, and Skip. | Plain text; single approve/reject; draft GitHub reply. | Gives the user clear, bounded choices. |
| How are events subscribed? | Per-PR `gh event listen` for comment and PR events. | Repository-wide listen; poll only; Actions dispatch. | Maps events directly to tracked PRs and keeps the receiver local. |
| How is the watcher stopped? | Explicit stop hook plus abort signal. | Process teardown assumption; bounded cycles; PID file. | Prevents orphaned watcher work without a daemon. |
| What architecture sections change? | Layout, pipeline, script-backed conventions, verification, and non-goals. | Layout only; new section only; no change. | The new skill adds runtime behavior and verification requirements. |
| How granular is the plan? | Three milestones and eight independently verifiable tasks. | 2/5, 4/12, or one milestone. | Balances verification isolation with execution overhead. |
| What is the verification bar? | Unit tests, offline skill evals, and a manual smoke test. | Unit only; evals only; manual only. | Matches the repository's accepted bar for new skills and script behavior. |
| What is the rollback path? | Stop the watcher and revert the commits. | Feature flag; process kill only; no plan. | No persistent state exists, so stop plus revert is sufficient. |

## Risks and assumptions

- Risk: event and poll both detect the same activity. Mitigation: deduplicate
  by comment `id` plus `updated_at` and guard cleanup per PR.
- Risk: a session ends while the watcher is active. Mitigation: explicit stop
  hook plus abort signal; no persisted state to resume.
- Risk: full autonomy performs an unintended action. Mitigation: start-time
  opt-in, printed audit line, bounded action set, and no merge.
- Risk: `gh event listen` event fields do not map cleanly to PR numbers.
  Mitigation: per-PR subscriptions plus poll fallback; unit tests mock payloads.
- Risk: cleanup runs twice. Mitigation: per-PR cleanup guard and reuse of
  `finish-worktree` preflight.
- Assumption: `gh` is installed and authenticated.
- Assumption: review and issue comments expose stable IDs and update times.
- Assumption: `review-and-pr` can pass the tracked PR identity to the monitor
  after a successful handoff.

## Open questions / next steps

- Confirm the exact `gh event listen` command shape against the installed CLI
  during implementation, with mocked unit tests covering payload mapping.
- Define the approval-card text in the skill and keep it testable.
- Decide whether code fixes in full-autonomy mode create a new commit or amend
  an existing one; the default should be a new commit unless the user says
  otherwise.
- After implementation, run `review-gate`, then `review-and-pr`, and hand off
  to `finish-worktree` only after merge.
