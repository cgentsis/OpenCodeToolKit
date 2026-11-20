# Task 01 — Discovery and validation modules

## Goal and acceptance criteria

Create the core modules that find eval files and validate their structure.

Acceptance criteria:

- `discover.js` finds every skill directory containing `evals/evals.json` and
  returns its path and skill name.
- Skills with only one of the two eval files, or none, are reported as warnings
  and are not treated as errors.
- `validate.js` checks each eval file: `skill_name` matches the directory name,
  `evals` is a non-empty array, every eval has `id`, `prompt`, and
  `expected_output`.
- `validate.js` checks each trigger file: it is a non-empty array of objects
  with `query` and boolean `should_trigger`, with at least one `true` and one
  `false`.
- Both JSON files must parse; parse failures are errors with the file path and
  parse reason.
- Modules export pure functions suitable for unit testing.

## Files/areas to change

- `skills/skill-evals/discover.js` (new)
- `skills/skill-evals/validate.js` (new)

## Architecture impact

Adds the first two modules of the eval runner under `skills/skill-evals/`.
Matches the modular layout already recorded in `ARCHITECTURE.md`. No other
architecture sections change.

## Dependencies and order

Task 01 is first; no blockers.

## Verification/tests

- `node --check` on both modules.
- Unit tests in task 02 cover discovery and validation; task 01 may add its own
  focused tests early if needed.
- Manual: run discovery from the repository root and confirm it finds the
  council skills and `finish-worktree`.

## Risks and rollback

- Risk: over-strict validation rejects valid eval files. Mitigation: validate
  only the fields listed above; warn, don't fail, on extra fields.
- Rollback: delete the two new modules; no other files depend on them yet.

## Estimate/size

M

## Milestone mapping

M1 — Offline core

## Status

complete — 2026-11-20

Verification evidence:

- `node --check` exit 0 for `discover.js` and `validate.js`.
- Manual run: discovered 5 skills with eval suites (`finish-worktree`,
  `idea-discovery`, `implementation`, `implementation-planning`,
  `solution-brainstorming`), produced 3 warnings for skills without eval files,
  and reported 0 validation errors across all discovered files.
- Pure exports confirmed: `discoverSkills`, `validateSkill`,
  `validateEvalFile`, `validateTriggerFile`, `readJson`.
