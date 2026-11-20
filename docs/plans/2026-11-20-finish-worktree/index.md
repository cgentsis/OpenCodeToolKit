# Plan: finish-worktree

## Plan title and summary

Add a `finish-worktree` skill and script that safely clean up the local
worktree and branch after a PR is merged, plus a companion runbook and the
documentation updates needed to make the skill discoverable. Root
`ARCHITECTURE.md` is created as a baseline for this plan.

## Inputs

- Idea and solution artifact: [`docs/ideas/2026-11-20-finish-worktree.md`](../../ideas/2026-11-20-finish-worktree.md)
- Architecture source of truth: [`ARCHITECTURE.md`](../../../ARCHITECTURE.md)

## Milestones

- **M1 — Script core.** A tested CLI that fails closed on unsafe states and
  previews every action in dry-run mode.
- **M2 — Skill and documentation.** The skill, evals, runbook, and repository
  docs that expose the new workflow.
- **M3 — Verification.** Full checks and a dry-run demonstration before the
  plan is considered shippable.

"Shippable" means all tasks are complete, `npm test` passes, `node --check` and
`git diff --check` are clean, and `DRY_RUN=yes` produces a correct preview.

## Task list

| # | Task | Milestone | Size | Dependencies |
| --- | --- | --- | --- | --- |
| 01 | [Preflight helpers and dry-run CLI](01-preflight.md) | M1 | M | none |
| 02 | [Cleanup execution and CLI wiring](02-cleanup.md) | M1 | M | 01 |
| 03 | [Skill definition and evals](03-skill.md) | M2 | S | 01, 02 |
| 04 | [Runbook and documentation](04-docs.md) | M2 | S | 01, 02 |
| 05 | [Final verification and demo](05-verification.md) | M3 | S | 01–04 |

## Dependency order

01 → 02 → {03, 04} (parallel) → 05. Tasks 03 and 04 are independent of each
other but both depend on the script's final CLI contract from 02.

## Decision log

1. **Dedicated script instead of extending `create-worktree-on-change`.**
   Challenge: reusing the existing script versus a new entrypoint. Decision: new
   `finish-worktree.js`. Alternatives: add a `finish` mode to the worktree
   script; prompt-only skill. Rationale: keeps the stable script untouched and
   gives destructive operations unit-testable guardrails.
2. **Session moves before preflight.** Challenge: a failed preflight after the
   move leaves the session relocated. Decision: move first. Alternatives:
   two-phase preflight/execute; leave session handling to the user. Rationale:
   user preference; recoverable outcome and simpler flow.
3. **Never delete remote branches.** Challenge: tidiness versus irreversibility.
   Decision: no remote deletion. Alternatives: automatic or confirmed deletion.
   Rationale: user preference.
4. **Architecture baseline created.** Challenge: no root `ARCHITECTURE.md`
   existed. Decision: create it with the repository layout and conventions.
   Alternatives: record a no-change entry; leave untouched. Rationale: user
   preference and a useful source of truth for later plans.
5. **Runbook retained as companion, not solution.** Challenge: the user
   deepened both the script and runbook approaches. Decision: implement the
   script as the solution and add a short runbook as a manual fallback.
   Alternatives: runbook only. Rationale: runbook alone cannot meet the
   guardrail and dry-run criteria.

## Risks and assumptions

- `gh` must be installed and authenticated; the script fails closed otherwise.
- The current branch must have a discoverable PR; local ancestry is not trusted.
- The main checkout is derived from the git common directory; an unexpected
  layout must cause a stop, not a guess.
- PR #4 (`fix-review-findings`) also edits `AGENTS.md` and renames
  `run-workflow.js`. Task 04 must add only a new discovery bullet to
  `AGENTS.md` and must not undo those changes; if a conflict appears, the
  `AGENTS.md` edit is deferred until PR #4 merges.

## Open questions / next steps

- None blocking. Handoff to `implementation` after plan review approval.
