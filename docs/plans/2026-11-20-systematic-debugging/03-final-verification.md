# Task 03 — Final verification

## Goal and acceptance criteria

Prove the plan artifacts and implementation are consistent and complete.

Acceptance criteria:

- `npm test` passes all suites.
- `node --check` passes for every tracked JavaScript file.
- `git diff --check` reports no whitespace errors.
- `node skills/skill-evals/run-evals.js --offline` exits 0 on all eval files.
- `node skills/verification-before-completion/verify-completion.js` exits 0 and
  its output is inspected.
- The idea document with its `## Solution` section, the plan index, all three
  task files, the skill, and both eval files exist and are non-empty.
- Every link in the plan index resolves.
- `ARCHITECTURE.md` contains the layout entry and debugging conventions section.
- Any defect found is fixed within the owning task's scope before completion.

## Files/areas to change

- Verification only; in-scope fixes may touch files owned by tasks 01–02.

## Architecture impact

None expected. If a fix changes the layout or conventions, update
`ARCHITECTURE.md` accordingly.

## Dependencies and order

Depends on tasks 01 and 02. Final task.

## Verification/tests

- Commands listed in the acceptance criteria, run fresh at the end.
- Report exact test counts and command outcomes in the task status.

## Risks and rollback

- Risk: a late defect reopens an earlier task. Mitigation: fix within that
  task's scope and re-run all checks.
- Rollback: revert the offending changes and re-run verification.

## Estimate/size

S

## Milestone mapping

M3 — Verification

## Status

complete — 2026-11-20

Verification evidence:

- `npm test` — 5 suites, 50 tests passed.
- `node --check` — exit 0 for all 17 tracked `.js` files.
- `node skills/skill-evals/run-evals.js --offline` — exit 0, 8 suites, 0 errors,
  2 warnings for skills without eval files.
- `node skills/verification-before-completion/verify-completion.js` — exit 0,
  19 checks passed, 0 failed.
- `git diff --check` — exit 0.
- All 9 idea/plan/skill/eval/doc artifacts exist and are non-empty; all 5 plan
  index links resolve; the idea retains `## Solution`; `ARCHITECTURE.md` retains
  `## Debugging conventions`.
- No helper script was added; no in-scope defects were found.
