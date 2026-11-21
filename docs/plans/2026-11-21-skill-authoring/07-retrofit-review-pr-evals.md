# Task 07 — Retrofit review-and-pr evals

## Goal and acceptance criteria

Add `evals/evals.json` and `evals/trigger-evals.json` for `review-and-pr`,
closing the second known eval gap.

Acceptance criteria:

- Both files validate against `validateSkill`.
- Trigger queries include a should-trigger case for "commit and push" / "open a
  PR" and a should-not-trigger case for purely local edits.
- The offline eval run no longer warns about this skill.

## Files/areas to change

- `skills/review-and-pr/evals/evals.json` (new).
- `skills/review-and-pr/evals/trigger-evals.json` (new).

## Architecture impact

No architecture change; satisfies the zero-warning success metric.

## Dependencies and order

Depends on Task 02 for the eval format. Independent of Tasks 04 and 05.

## Verification/tests

- `node skills/skill-evals/run-evals.js --offline review-and-pr`

## Risks and rollback

- Risk: overlap with code-review triggers. Mitigation: keep should-not-trigger
  queries focused on review-only requests.
- Rollback: delete both eval files.

## Estimate/size

S

## Milestone mapping

Delivery

## Status

complete — 2026-11-21

Verification evidence: `node skills/skill-evals/run-evals.js --offline
review-and-pr` printed `Summary: 1 suites, 0 errors, 0 warnings` with exit 0.
Both JSON files were read back and match the required schema with trigger and
should-not-trigger queries.
