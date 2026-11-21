# Task 01 — Author the TDD skill SKILL.md

## Goal and acceptance criteria

Create `skills/test-driven-development/SKILL.md` with triggering-focused
frontmatter and a lean body that defines the red → green → refactor hard gate.

Acceptance criteria:

- Frontmatter includes `name: test-driven-development` and a description with
  when-to-use and when-not-to-use statements.
- The body requires a failing test before production code for executable
  behavior changes.
- It defines the `### TDD Evidence` contract: Red, Green, and Refactor entries
  where Red and Green include the command and observed result.
- It defines the docs/config-only exemption line and required reason.
- It states non-goals: no replacement for `systematic-debugging`, no mandated
  test framework, no production code written by this skill.
- It says the evidence validator blocks task completion and that PR checking is
  a backstop.
- Worktree-first is stated; no new dependency is introduced.

## Files/areas to change

- `skills/test-driven-development/SKILL.md` (new).

## Architecture impact

Adds a new skill directory under `skills/`. Consistent with the Repository
layout and TDD conventions sections of `ARCHITECTURE.md`.

## Dependencies and order

First task; no dependencies. Tasks 02, 03, 04, and 06 follow it.

## Verification/tests

- Read the file back and confirm frontmatter, evidence contract, exemption,
  non-goals, and validator boundary are present.
- Confirm the file is non-empty and contains no new runtime dependency.

## Risks and rollback

- Risk: an over-long body that turns into a generic testing manual. Mitigation:
  keep only the gate, evidence contract, exemption, and boundaries.
- Rollback: delete the new directory.

## Estimate/size

M

## Milestone mapping

Foundation

## Status

complete — 2026-11-21

Verification evidence: `skills/test-driven-development/SKILL.md` is 3,374 bytes.
Read-back confirmed `name: test-driven-development`, triggering description,
the Red/Green/Refactor hard gate, the `### TDD Evidence` contract with both
forms, the `Exempt: docs/config-only` marker, the non-goals, worktree-first, and
the validator boundary. Grep found no `require(` calls, so no new runtime
dependency was introduced. OpenCode reported the new `test-driven-development`
skill as available immediately after the file was written, confirming discovery.

### TDD Evidence

Exempt: docs/config-only
Reason: SKILL.md is documentation; no executable behavior changed in this task.
