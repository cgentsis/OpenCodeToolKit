# Task 01 — Author the skill SKILL.md

## Goal and acceptance criteria

Create `skills/skill-authoring/SKILL.md` with `name` and triggering-focused
`description` frontmatter and a lean body covering the full skill lifecycle:
create, update, rename, and remove. The body must state the worktree-first gate,
the mandatory offline eval preflight, and the boundary against global
`skill-creator` / `writing-skills` (reference, do not reimplement).

Acceptance criteria:

- Frontmatter includes `name: skill-authoring` and a description with when-to-use
  and when-not-to-use statements.
- All four lifecycle operations are described with their required checks.
- Global skills are referenced, not copied or vendored.
- No new dependency or runtime service is introduced.

## Files/areas to change

- `skills/skill-authoring/SKILL.md` (new).

## Architecture impact

Adds a new skill directory under `skills/`, as recorded in the Repository layout
section of `ARCHITECTURE.md`. No script or test changes in this task.

## Dependencies and order

First task; no dependencies. Tasks 02 and 03 follow it.

## Verification/tests

- Read the file back and confirm frontmatter and all four operations are present.
- `git diff --check` after staging is not required; the implementation skill
  runs the baseline checks at completion.

## Risks and rollback

- Risk: an over-long body that restates global guidance. Mitigation: keep
  operational detail in references and link out.
- Rollback: delete the new directory.

## Estimate/size

M

## Milestone mapping

Delivery

## Status

complete — 2026-11-21

Verification evidence: `skills/skill-authoring/SKILL.md` is 3,506 bytes and
contains `name:`, `description:`, and the Create/Update/Rename/Remove sections.
OpenCode reported the new `skill-authoring` skill as available immediately after
the file was written, confirming discovery. `git diff --check` passed.
