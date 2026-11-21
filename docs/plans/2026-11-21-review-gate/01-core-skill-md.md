# Task 01 — Author the core skill SKILL.md

## Goal and acceptance criteria

Create `skills/review-gate/SKILL.md` with triggering frontmatter, the machine-readable
alias registry, and a lean body that governs the complete review workflow.

Acceptance criteria:

- Frontmatter includes `name: review-gate`, a triggering-focused `description`,
  and `aliases: [code-review-gate, design-review-gate, specs-review-gate]`.
- Body states when to use and when not to use the skill.
- Body documents `--type`, `--out`, and the default report path
  `docs/reviews/<type>.md`.
- Body requires the scripted checks first, then a mandatory council loop
  (Reviewer + Devil's Advocate) whose notes are advisory only.
- Body forbids source edits and `gh` calls; only the report may be written.
- Body explains that the agent edits report frontmatter to set `approved: true`
  only after all scripted checks pass and the user explicitly approves.
- Options table matches the CLI options in task 02.

## Files/areas to change

- `skills/review-gate/SKILL.md` (new).

## Architecture impact

Adds the core skill directory described in the Repository layout and
Script-backed skill convention sections of `ARCHITECTURE.md`. No scripts or
tests in this task.

## Dependencies and order

First task. Tasks 02, 03, 04, and 06 depend on it.

## Verification/tests

- Read the file back and confirm frontmatter, `aliases:`, and all workflow
  sections are present.
- Confirm no source-edit or `gh` instruction is present.

## Risks and rollback

- Risk: over-long body duplicating council protocol. Mitigation: reference
  `skills/_shared/council-protocol.md` instead of restating it.
- Rollback: delete the new directory.

## Estimate/size

M

## Milestone mapping

Core runner

## Status

pending
