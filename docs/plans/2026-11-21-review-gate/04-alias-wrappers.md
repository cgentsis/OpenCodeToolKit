# Task 04 — Add alias wrapper skills

## Goal and acceptance criteria

Create three thin wrapper skills that delegate to `review-gate` without
duplicating logic or eval files.

Acceptance criteria:

- `skills/code-review-gate/SKILL.md`, `skills/design-review-gate/SKILL.md`, and
  `skills/specs-review-gate/SKILL.md` exist.
- Each wrapper frontmatter includes `name`, a triggering `description`,
  `alias_of: review-gate`, and `type: code|design|specs`.
- Wrapper bodies contain only the delegated command, a link/reference to the
  core skill, and the fixed type; no check logic or report schema.
- No `evals/` directory is created for wrappers.
- Wrapper names match the `aliases:` list declared in task 01.

## Files/areas to change

- `skills/code-review-gate/SKILL.md` (new).
- `skills/design-review-gate/SKILL.md` (new).
- `skills/specs-review-gate/SKILL.md` (new).

## Architecture impact

Adds the alias wrappers described in Repository layout and Script-backed skill
convention. The alias exemption is validated in task 05.

## Dependencies and order

Depends on task 01. Tasks 05 and 06 depend on it.

## Verification/tests

- Read each file back and confirm `alias_of`, `type`, and delegated command.
- Confirm no wrapper has an `evals/` directory.

## Risks and rollback

- Risk: wrappers accidentally grow independent behavior. Mitigation: keep bodies
  under 40 lines and reference only the core skill.
- Rollback: delete the three directories and remove names from the core alias
  registry.

## Estimate/size

S

## Milestone mapping

Aliases and docs

## Status

complete — `a813fd7` (three thin wrappers with `alias_of: review-gate` and fixed types, no `evals/` directories). Evidence: names match the core `aliases:` registry; final validator reports `Skills discovered: 15`, `Eval suites: 12`, `Errors: 0` with declared aliases exempt.
