# Task 08 — Final verification and evidence

## Goal and acceptance criteria

Run every required check and record the observed output as evidence before any
completion claim. Confirm the skill set has full eval coverage and the plan's
architecture edits are consistent.

Acceptance criteria:

- `npm test` passes (after `npm ci` if needed).
- `node --check` passes on all tracked `.js` files.
- `git diff --check` passes.
- `node skills/skill-authoring/validate-skill-set.js` reports no failures.
- `node skills/skill-evals/run-evals.js --offline` reports 0 errors and 0
  warnings.
- `ARCHITECTURE.md`, `README.md`, and `AGENTS.md` reflect the new skill and its
  markers.

## Files/areas to change

- No implementation files; update task status in the plan index if the
  implementation workflow requires it.

## Architecture impact

Verifies the Repository layout, Script-backed, Eval runner, and Verification
sections updated earlier in `ARCHITECTURE.md`.

## Dependencies and order

Depends on Tasks 05, 06, and 07. Final task in the single milestone.

## Verification/tests

- `npm ci` (if needed), `npm test`
- `node --check` on each tracked `.js` file
- `git diff --check`
- `node skills/skill-authoring/validate-skill-set.js`
- `node skills/skill-evals/run-evals.js --offline`

## Risks and rollback

- Risk: missing `node_modules` in a fresh worktree. Mitigation: `npm ci` first.
- Rollback: not applicable; this task is read-only verification.

## Estimate/size

S

## Milestone mapping

Delivery

## Status

complete — 2026-11-21

Verification evidence: `npm test` → 6 suites, 57 tests passed, 0 failed.
`node --check` passed for all 19 JavaScript files outside `node_modules` and
nested worktrees. `git diff --check` passed.
`node skills/skill-authoring/validate-skill-set.js` printed `Skills discovered:
11`, `Eval suites: 11`, `Errors: 0` with exit 0.
`node skills/skill-evals/run-evals.js --offline` printed `Summary: 11 suites, 0
errors, 0 warnings` with exit 0. `ARCHITECTURE.md` still contains the agreed
Repository layout, Script-backed, Eval runner, and Verification entries.
