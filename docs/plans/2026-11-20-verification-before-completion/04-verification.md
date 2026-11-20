# Task 04 — Final verification

## Goal and acceptance criteria

Run all checks and confirm the plan artifacts are consistent.

Acceptance criteria:

- `npm test` passes all suites.
- `node --check` passes for every JavaScript file, including the new helper.
- `git diff --check` reports no whitespace errors.
- `node skills/skill-evals/run-evals.js --offline` exits 0 on all eval files.
- The helper's `--help` exits 0 and a real run exits 0 with all three baseline
  checks visible in its output.
- A negative demonstration confirms the helper exits non-zero when a check
  fails (using a mocked or temporary fixture, not a real broken checkout).
- The idea doc with its `## Solution` section, the plan index, all four task
  files, the skill, its eval files, the helper, and its tests exist and are
  non-empty.
- Every link in the plan index resolves.
- Any defect found is fixed within the owning task's scope before completion.

## Files/areas to change

- Verification only; in-scope fixes may touch files owned by tasks 01–03.

## Architecture impact

None expected. If a fix changes the layout or verification conventions, update
`ARCHITECTURE.md` accordingly.

## Dependencies and order

Depends on tasks 01 through 03. Final task.

## Verification/tests

- Commands listed in the acceptance criteria, run fresh at the end.
- Report exact test counts and command outcomes in the task status.

## Risks and rollback

- Risk: a late defect reopens an earlier task. Mitigation: fix within that
  task's scope and re-run all checks.
- Rollback: revert the offending commit and re-run verification.

## Estimate/size

S

## Milestone mapping

M3 — Verification

## Status

complete — 2026-11-20

Verification evidence:

- `npm test` — 5 suites, 50 tests passed.
- `node --check` — exit 0 for all 15 tracked `.js` files.
- `git diff --check` — exit 0.
- `node skills/skill-evals/run-evals.js --offline` — exit 0, 7 suites, 0 errors,
  2 warnings for skills without eval files.
- Helper `--help` — exit 0; real run — exit 0, 17 checks passed, 0 failed.
- Negative case is covered by the mocked failing `git diff --check` unit test.
- All 11 idea/plan/skill/helper/test/doc artifacts exist and are non-empty; all
  6 plan index links resolve.
- No defects found; no in-scope fixes were needed.
