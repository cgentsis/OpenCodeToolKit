# Task 06 — Integrate with implementation handoff

## Goal and acceptance criteria

Make the TDD gate part of the `implementation` skill's task-completion step
without duplicating validator logic.

Acceptance criteria:

- `skills/implementation/SKILL.md` references `test-driven-development` as the
  required gate for executable-behavior tasks.
- Before a task can be marked complete, the skill instructs running
  `node skills/test-driven-development/check-tdd-evidence.js <task-file>`.
- A validator failure means the task is blocked or remains in progress; it must
  not be recorded as complete.
- The docs/config-only exemption is described by reference, not redefined.
- No validator logic is copied into `implementation`.

## Files/areas to change

- `skills/implementation/SKILL.md`.

## Architecture impact

Updates the Skill pipeline description to show implementation delegating TDD
evidence validation to the new skill; consistent with the TDD conventions
section.

## Dependencies and order

Depends on tasks 04 and 05. Can proceed in parallel with task 07 after task 05.

## Verification/tests

- Read the skill back and confirm the command, failure behavior, and reference
  are present.
- `git diff --check`.

## Risks and rollback

- Risk: the instruction is easy to skip. Mitigation: place it in the numbered
  task loop immediately before the status update.
- Rollback: revert the SKILL.md edit.

## Estimate/size

S

## Milestone mapping

Integration and verification

## Status

complete — 2026-11-21

Verification evidence: read-back found the `TDD gate` rule at lines 44–46 and
the numbered handoff step at lines 65–67 in `skills/implementation/SKILL.md`,
including the exact validator command and the instruction that a non-zero exit
does not allow `complete`. No evidence format was duplicated. `git diff --check`
passed with no output.

### TDD Evidence

Exempt: docs/config-only
Reason: SKILL.md documentation only; validator logic was unchanged.
