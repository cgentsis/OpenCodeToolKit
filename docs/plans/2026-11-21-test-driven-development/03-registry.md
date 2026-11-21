# Task 03 — Register the new skill

## Goal and acceptance criteria

Make `test-driven-development` discoverable in the repository documentation and
validator registry.

Acceptance criteria:

- The marked registry block in `AGENTS.md` includes `test-driven-development`.
- The marked registry block in `skills/README.md` includes the skill.
- `skills/README.md` has a section describing the skill, its evidence contract,
  the validator command, and its boundary against other skills.
- `node skills/skill-authoring/validate-skill-set.js` reports 0 errors and 0
  warnings.

## Files/areas to change

- `AGENTS.md` (marked registry block).
- `skills/README.md` (marked registry block and new skill section).

## Architecture impact

Updates the documented skill registry; consistent with the Repository layout
section of `ARCHITECTURE.md`.

## Dependencies and order

Depends on task 01. Required by task 08.

## Verification/tests

- Read back both marked registry blocks.
- Run the skill-set validator and cite its output.

## Risks and rollback

- Risk: stale registry markers cause validator failures. Mitigation: edit only
  inside the existing markers and re-run the validator.
- Rollback: remove the added registry entries and README section.

## Estimate/size

S

## Milestone mapping

Foundation

## Status

complete — 2026-11-21

Verification evidence: `AGENTS.md` line 48 contains
`- `test-driven-development`` inside the marked registry block. `skills/README.md`
line 26 contains the registry entry, line 192 has the new
`### test-driven-development` section, and line 203 documents the validator
command. Observed validator output: `Skills discovered: 12`, `Eval suites: 12`,
`Errors: 0`, with no warnings reported.

### TDD Evidence

Exempt: docs/config-only
Reason: Registry and README edits are documentation only.
