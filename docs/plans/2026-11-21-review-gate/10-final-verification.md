# Task 10 — Final verification and evidence

## Goal and acceptance criteria

Run the full verification set and record observed evidence before claiming the
plan is complete.

Acceptance criteria:

- `npm test` passes with all suites, including the three new review-gate suites.
- `node --check` passes on every tracked `.js` file.
- `git diff --check` passes.
- `node skills/skill-authoring/validate-skill-set.js` reports 0 errors and the
  expected skill/eval suite counts.
- `node skills/skill-evals/run-evals.js --offline` reports 0 errors and 0
  warnings.
- Evidence from task 09 confirms a sample report and enforcement behavior.
- All plan task files are marked complete with verification evidence.

## Files/areas to change

- Plan task files under `docs/plans/2026-11-21-review-gate/` (status updates).

## Architecture impact

No new architecture change. Confirms all documented conventions are satisfied.

## Dependencies and order

Depends on tasks 06, 08, and 09. Final task.

## Verification/tests

- Capture the exact summary lines from each command in the task status sections.
- If any check fails or is unavailable, stop and report it as unverified; do not
  claim completion.

## Risks and rollback

- Risk: offline eval count changes after adding aliases. Mitigation: validator
  must report alias exemptions and 0 errors; investigate any warning.
- Risk: Jest unavailable in a fresh worktree. Mitigation: run `npm ci` first as
  in prior plans and record it as a prerequisite, not a passing check.
- Rollback: fix failing checks before completion; do not skip verification.

## Estimate/size

S

## Milestone mapping

Enforcement and verification

## Status

pending
