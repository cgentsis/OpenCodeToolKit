# Task 08 — Final verification and evidence

## Goal and acceptance criteria

Run the full verification bar, record truthful evidence in every task file, and
confirm the architecture and plan still match the delivered work.

Acceptance criteria:

- Baseline checks pass: `npm test`, `node --check` on tracked `.js` files, and
  `git diff --check`.
- `node skills/skill-authoring/validate-skill-set.js` reports 0 errors and 0
  warnings.
- `node skills/skill-evals/run-evals.js --offline` reports 0 errors and 0
  warnings.
- A manual smoke test runs the validator against one valid and one invalid
  sample task file and records the observed outcomes.
- Every earlier task file has a `## Status` section with `complete`, the date,
  and verification evidence.
- `ARCHITECTURE.md` still accurately describes the delivered TDD skill,
  validator, and integration points.

## Files/areas to change

- All task files in `docs/plans/2026-11-21-test-driven-development/`
  (`## Status` sections).
- Possibly small consistency edits in `ARCHITECTURE.md` or the plan index if
  verification reveals drift.

## Architecture impact

Final consistency check only; no new architectural change expected.

## Dependencies and order

Depends on tasks 02, 03, 05, 06, and 07. Final task.

## Verification/tests

- Run and cite all four mandatory checks listed above.
- Read back every task status section.
- Confirm the plan index links resolve and all mandatory task fields remain
  present.

## Risks and rollback

- Risk: a check passes locally but evidence is not recorded. Mitigation: write
  observed output into each task status before claiming completion.
- Rollback: fix the failing artifact and re-run the affected checks; do not
  mark this task complete on unverified output.

## Estimate/size

S

## Milestone mapping

Integration and verification

## Status

complete — 2026-11-21

Verification evidence:

- `npm test` — `Test Suites: 7 passed, 7 total`, `Tests: 73 passed, 73 total`.
- `node --check` over all 21 project `.js` files outside `node_modules` — all passed.
- `git diff --check` — no output.
- `node skills/skill-authoring/validate-skill-set.js` — `Skills discovered: 12`, `Eval suites: 12`, `Errors: 0`, no warnings reported.
- `node skills/skill-evals/run-evals.js --offline` — `Summary: 12 suites, 0 errors, 0 warnings`.
- Manual smoke test from task 04 — `PASS valid.md`, `PASS exempt.md`, `FAIL invalid.md: missing Green entry`, `Summary: 3 files, 2 passed, 1 failed`.
- Task status audit — grep found `## Status` in all seven earlier task files.
- Architecture audit — grep confirmed the new skill, validator, and `## TDD conventions` section are present in `ARCHITECTURE.md`.

### TDD Evidence

Exempt: docs/config-only
Reason: Final verification task file is documentation only.
