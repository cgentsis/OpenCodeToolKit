# Task 05 — Final verification

## Goal and acceptance criteria

Run the full verification suite and confirm the plan artifacts are consistent.

Acceptance criteria:

- `npm test` passes all suites.
- `node --check` passes for every JavaScript file, including all eval runner
  modules and the CLI.
- `git diff --check` reports no whitespace errors.
- `node skills/skill-evals/run-evals.js --offline` exits 0 on current eval files.
- `--help` prints usage; a path filter validates only the requested skill.
- The plan index, all five task files, the idea document, `ARCHITECTURE.md`, the
  skill, and its eval files all exist and are non-empty.
- Every link in the plan index resolves.
- Any defects found are fixed within the owning task's scope before completion.

## Files/areas to change

- Verification only; in-scope fixes may touch files owned by tasks 01–04.

## Architecture impact

None expected. If a fix changes the module layout, update `ARCHITECTURE.md`.

## Dependencies and order

Depends on tasks 01 through 04. Final task.

## Verification/tests

- Commands listed in the acceptance criteria, run fresh at the end.
- Report the exact test count and command output in the task status.

## Risks and rollback

- Risk: a late defect reopens an earlier task. Mitigation: fix within the
  owning task's scope and re-run all checks.
- Rollback: revert the offending commit and re-run verification.

## Estimate/size

S

## Milestone mapping

M3 — Verification

## Status

complete — 2026-11-20

Verification evidence:

- `npm test` — 4 suites, 41 tests passed.
- `node --check` — exit 0 for all 6 JavaScript files (`discover.js`,
  `validate.js`, `report.js`, `live.js`, `run-evals.js`, `skill-evals.test.js`).
- `git diff --check` — exit 0, no whitespace errors.
- `node skills/skill-evals/run-evals.js --offline` — exit 0, 6 suites, 0 errors,
  2 warnings for skills without eval files.
- `node skills/skill-evals/run-evals.js idea-discovery` — exit 0, 1 suite.
- `--help` — usage printed, exit 0.
- All 12 idea/plan/skill/doc artifacts exist and are non-empty; all 7 plan index
  links resolve.
- No defects found; no in-scope fixes were needed.
