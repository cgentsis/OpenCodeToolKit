# Task 03 — Add core eval files

## Goal and acceptance criteria

Add eval files for `review-gate` only. Alias wrappers are exempt and get no eval
files.

Acceptance criteria:

- `skills/review-gate/evals/evals.json` has `skill_name: "review-gate"` and a
  non-empty `evals` array covering code, design, and specs review prompts.
- Each eval has a unique `id`, a non-empty `prompt`, and a non-empty
  `expected_output` that mentions the report and the advisory council appendix.
- `skills/review-gate/evals/trigger-evals.json` is a non-empty array with at
  least one `should_trigger: true` and one `should_trigger: false` query.
- Trigger examples cover all three wrappers and distinguish review from
  implementation and from general PR creation.

## Files/areas to change

- `skills/review-gate/evals/evals.json` (new).
- `skills/review-gate/evals/trigger-evals.json` (new).

## Architecture impact

Follows the existing eval-file convention. No new architecture section.

## Dependencies and order

Depends on task 01. Validated by tasks 05 and 10.

## Verification/tests

- Parse both files with `node -e "JSON.parse(require('fs').readFileSync(...))"`.
- Run `node skills/skill-evals/run-evals.js --offline` and confirm no new
  errors or warnings attributable to `review-gate`.

## Risks and rollback

- Risk: trigger overlap with `review-and-pr`. Mitigation: include explicit
  should-not-trigger examples for "commit and push" and "open a PR".
- Rollback: delete the two files; the validator will then report missing eval
  coverage.

## Estimate/size

S

## Milestone mapping

Core runner

## Status

pending
