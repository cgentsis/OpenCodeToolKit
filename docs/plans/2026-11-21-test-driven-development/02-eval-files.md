# Task 02 — Add eval files for the new skill

## Goal and acceptance criteria

Add eval files for `test-driven-development` using the repository's existing
schema so the skill can be validated offline.

Acceptance criteria:

- `skills/test-driven-development/evals/evals.json` has `skill_name:
  test-driven-development` and 4–6 realistic evals.
- Evals cover: code written before a failing test, missing red/green evidence,
  shallow implementation-detail tests, the docs/config-only exemption, and the
  framework-agnostic boundary.
- `skills/test-driven-development/evals/trigger-evals.json` has both
  `should_trigger: true` and `should_trigger: false` queries.
- `node skills/skill-evals/run-evals.js --offline` reports 0 errors and 0
  warnings for this skill.

## Files/areas to change

- `skills/test-driven-development/evals/evals.json` (new).
- `skills/test-driven-development/evals/trigger-evals.json` (new).

## Architecture impact

Follows the existing Eval runner conventions. No new architecture section.

## Dependencies and order

Depends on task 01. Feeds task 04's awareness of the evidence contract and is a
final verification input for task 08.

## Verification/tests

- Read both files back and confirm JSON validity.
- Run the offline eval runner scoped to `test-driven-development`.
- Run the full offline eval runner later in task 08.

## Risks and rollback

- Risk: eval descriptions drift from the SKILL.md contract. Mitigation: derive
  expected outputs directly from task 01.
- Rollback: delete the two eval files.

## Estimate/size

S

## Milestone mapping

Foundation

## Status

complete — 2026-11-21

Verification evidence: `evals/evals.json` contains 5 evals with
`skill_name: test-driven-development`, covering tests-last code, missing
command/output evidence, implementation-detail tests, docs/config exemption,
and framework neutrality. `evals/trigger-evals.json` contains 12 queries with
both trigger and no-trigger cases. Observed command output:
`Eval suites found: 1 - test-driven-development` and
`Summary: 1 suites, 0 errors, 0 warnings`.

### TDD Evidence

Exempt: docs/config-only
Reason: Eval JSON files contain no executable behavior.
