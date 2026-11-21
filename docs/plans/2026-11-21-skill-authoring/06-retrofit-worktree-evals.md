# Task 06 — Retrofit create-worktree-on-change evals

## Goal and acceptance criteria

Add `evals/evals.json` and `evals/trigger-evals.json` for
`create-worktree-on-change`, closing one of the two known eval gaps.

Acceptance criteria:

- Both files validate against `validateSkill`.
- Trigger queries include a should-trigger case for "before editing files" and a
  should-not-trigger case for unrelated changes.
- The offline eval run no longer warns about this skill.

## Files/areas to change

- `skills/create-worktree-on-change/evals/evals.json` (new).
- `skills/create-worktree-on-change/evals/trigger-evals.json` (new).

## Architecture impact

No architecture change; satisfies the zero-warning success metric.

## Dependencies and order

Depends on Task 02 for the eval format. Independent of Tasks 04 and 05.

## Verification/tests

- `node skills/skill-evals/run-evals.js --offline create-worktree-on-change`

## Risks and rollback

- Risk: script-backed triggers are ambiguous. Mitigation: explicit
  should-not-trigger queries for non-worktree tasks.
- Rollback: delete both eval files.

## Estimate/size

S

## Milestone mapping

Delivery

## Status

complete — 2026-11-21

Verification evidence: `node skills/skill-evals/run-evals.js --offline
create-worktree-on-change` printed `Summary: 1 suites, 0 errors, 0 warnings`
with exit 0. Both JSON files were read back and match the required schema with
trigger and should-not-trigger queries.
