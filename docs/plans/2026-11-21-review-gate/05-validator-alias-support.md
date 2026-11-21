# Task 05 — Extend the skill-set validator for aliases

## Goal and acceptance criteria

Teach `validate-skill-set.js` to honor the fail-closed alias registry declared
by `review-gate/SKILL.md`.

Acceptance criteria:

- The validator parses the core skill's frontmatter `aliases:` array.
- It parses `alias_of:` from every skill `SKILL.md`.
- Declared aliases are exempt from `evals.json` / `trigger-evals.json`
  requirements.
- An undeclared wrapper (`alias_of` present but name not in the core registry)
  is reported as an error.
- A stale declaration (alias listed in the core registry but missing directory,
  missing `SKILL.md`, or wrong `alias_of`) is reported as an error.
- Alias wrappers still require marked registry entries in `AGENTS.md` and
  `skills/README.md`.
- Alias-related helpers are exported for unit tests.
- Existing validation behavior for non-alias skills is unchanged.

## Files/areas to change

- `skills/skill-authoring/validate-skill-set.js` (modify).
- `test/skill-authoring-validator.test.js` may be extended here or in task 08;
  canonical unit tests are added in task 08.

## Architecture impact

Implements the Eval runner conventions addition covering fail-closed alias
exemptions.

## Dependencies and order

Depends on task 04. Task 06 depends on it; task 08 tests it.

## Verification/tests

- Run the validator with the new wrappers present: eval-coverage warnings for
  wrappers must be gone; missing-registry errors are expected until task 06.
- Use a temporary copy of the skills directory with an undeclared wrapper to
  confirm the validator exits non-zero.
- Confirm existing 11-skill validation behavior still reports 0 errors once
  registries are updated in task 06.

## Risks and rollback

- Risk: parsing Markdown frontmatter incorrectly. Mitigation: reuse a small,
  tested frontmatter parser and export it.
- Risk: over-broad exemption hides a real skill without evals. Mitigation:
  require `alias_of` in the wrapper and a matching declaration in the core.
- Rollback: revert this file; wrappers will then be reported as missing evals.

## Estimate/size

M

## Milestone mapping

Aliases and docs

## Status

pending
