# Task 05 — Unit-test validator helpers

## Goal and acceptance criteria

Add Jest tests for the validator helpers with a mocked filesystem. Cover eval
coverage, marker presence, registry entry presence, `SKILL.md` discovery, and
stale-name detection for rename/remove.

Acceptance criteria:

- `test/skill-authoring-validator.test.js` exists and passes.
- Tests mock filesystem reads; no real repository files are modified.
- Rename and remove cases are covered explicitly (per the planning decision).

## Files/areas to change

- `test/skill-authoring-validator.test.js` (new).

## Architecture impact

Uses the existing `test/` convention for pure helpers and mocked I/O.

## Dependencies and order

Depends on Task 04. Task 08 runs the full suite.

## Verification/tests

- `npm ci` if `node_modules` is absent in the worktree.
- `npm test`

## Risks and rollback

- Risk: fresh worktrees lack `node_modules`, so Jest is unavailable. Mitigation:
  run `npm ci` before `npm test`.
- Rollback: delete the test file.

## Estimate/size

M

## Milestone mapping

Delivery

## Status

complete — 2026-11-21

Verification evidence: `npm test` → 6 suites, 57 tests passed, 0 failed.
`node --check` passed for both `validate-skill-set.js` and
`skill-authoring-validator.test.js`; `git diff --check` passed. Tests use an
injected fake filesystem and an injected validator, so no repository files were
modified by the tests. Two initial failures were diagnosed and fixed: the
missing-marker error string was imprecise, and `checkDiscovery` matched the
`"skills"` config key rather than a value inside `paths`; a third failure came
from searching for the end marker only after the start marker, which hid
misordered markers. The same `npm test` command then passed.
