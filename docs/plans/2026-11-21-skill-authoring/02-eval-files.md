# Task 02 — Add eval files for the new skill

## Goal and acceptance criteria

Add `evals/evals.json` and `evals/trigger-evals.json` for `skill-authoring`,
establishing the format that later retrofit tasks copy.

Acceptance criteria:

- `evals.json` has `skill_name: "skill-authoring"` and a non-empty `evals` array
  whose items each have `id`, `prompt`, and `expected_output`.
- `trigger-evals.json` is a non-empty array with at least one
  `should_trigger: true` and one `should_trigger: false` query.
- `node skills/skill-evals/run-evals.js --offline skill-authoring` reports 1
  suite, 0 errors, 0 warnings.

## Files/areas to change

- `skills/skill-authoring/evals/evals.json` (new).
- `skills/skill-authoring/evals/trigger-evals.json` (new).

## Architecture impact

No architecture change. Follows the existing eval-file conventions.

## Dependencies and order

Depends on Task 01 so the eval prompts match the skill description. Tasks 04, 06,
and 07 reuse this format.

## Verification/tests

- `node skills/skill-evals/run-evals.js --offline skill-authoring`
- Read both JSON files back to confirm schema fields.

## Risks and rollback

- Risk: weak trigger queries cause false positives. Mitigation: include realistic
  should-not-trigger queries for generic code changes.
- Rollback: delete both eval files.

## Estimate/size

S

## Milestone mapping

Delivery

## Status

complete — 2026-11-21

Verification evidence: `node skills/skill-evals/run-evals.js --offline
skill-authoring` printed `Eval suites found: 1 - skill-authoring` and
`Summary: 1 suites, 0 errors, 0 warnings`. Both JSON files were read back and
match the required schema.
