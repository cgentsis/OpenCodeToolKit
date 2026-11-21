# Task 06 — Update registries and pipeline docs

## Goal and acceptance criteria

Register the new skills and document the review gate as a required pipeline
step between implementation and PR.

Acceptance criteria:

- `AGENTS.md` marked registry block adds `code-review-gate`, `design-review-gate`,
  `review-gate`, and `specs-review-gate` in sorted order.
- `AGENTS.md` skill pipeline section inserts the review gate before
  `review-and-pr` and states that `review-and-pr` enforces the code report.
- `skills/README.md` marked registry block adds the same four names.
- `skills/README.md` pipeline/description section explains the core skill, the
  three aliases, the report path, and the options table from `review-gate/SKILL.md`.
- No other registry entries are added or removed.
- `node skills/skill-authoring/validate-skill-set.js` reports 0 errors after
  this task.

## Files/areas to change

- `AGENTS.md` (modify).
- `skills/README.md` (modify).

## Architecture impact

`ARCHITECTURE.md` was already updated during planning; no further architecture
edit is needed.

## Dependencies and order

Depends on tasks 01, 04, and 05. Final verification (task 10) consumes this
state.

## Verification/tests

- Run the skill-set validator and capture `Errors: 0`.
- Grep both registry blocks for all four names.
- Confirm `git diff --check` passes for the changed docs.

## Risks and rollback

- Risk: stale names after a future rename. Mitigation: validator reports stale
  registry entries.
- Risk: duplicated options tables drift. Mitigation: keep the README table
  identical to the core SKILL.md table.
- Rollback: revert both files and re-run the validator to confirm the new
  skills are reported as unregistered.

## Estimate/size

M

## Milestone mapping

Aliases and docs

## Status

complete — `2131d0d` (four skills registered in both marked blocks; pipeline docs updated). Evidence: validator changed from 8 missing-registry errors to `Errors: 0`; final `git diff --check` exit 0.
