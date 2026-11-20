# Task 02 — Optional baseline-check helper

## Goal and acceptance criteria

Create `verify-completion.js`, an optional helper that runs the baseline checks
and prints their output.

Acceptance criteria:

- Uses only Node built-ins (`child_process`, `fs`, `path`).
- Runs, in order: `npm test`, `node --check` on every tracked `.js` file, and
  `git diff --check`.
- The baseline command list is a single constant in the script.
- Prints each command, its exit code, and its captured stdout/stderr.
- Exits non-zero if any check fails; exits 0 only when all pass.
- Detects a missing Jest installation (no `node_modules/.bin/jest`) and prints a
  clear error rather than treating the run as a pass.
- `--help` prints usage and exits 0.
- Unit tests mock subprocess execution and cover success, a failing check, and
  the missing-dependency path; they do not invoke real git or npm.
- Tracked `.js` files are discovered with `git ls-files '*.js'` and the script
  handles the empty-list case.

## Files/areas to change

- `skills/verification-before-completion/verify-completion.js` (new)
- `test/verification-before-completion.test.js` (new)

## Architecture impact

Adds a helper to the skill directory; it is an accelerator, not a gate.
Matches the verification conventions already recorded in `ARCHITECTURE.md`.
No architecture section changes in this task.

## Dependencies and order

Depends on task 01 (the skill defines the evidence bar the helper serves).

## Verification/tests

- `npm test` passes with the new suite.
- `node --check skills/verification-before-completion/verify-completion.js`.
- `node skills/verification-before-completion/verify-completion.js --help`
  prints usage and exits 0.
- Manual real run from the repository root exits 0 and prints all three check
  results.

## Risks and rollback

- Risk: helper output is huge. Mitigation: print captured output but keep it
  bounded to a configurable number of characters per check with a clear
  truncation marker.
- Risk: helper becomes a de facto gate. Mitigation: `SKILL.md` states it is
  optional and manual evidence is accepted.
- Rollback: delete the script and its tests; the skill remains functional.

## Estimate/size

M

## Milestone mapping

M2 — Helper and documentation

## Status

complete — 2026-11-20

Verification evidence:

- `npm test` — 5 suites, 50 tests passed (9 new helper tests).
- `node --check skills/verification-before-completion/verify-completion.js` —
  exit 0.
- `--help` — usage printed, exit 0.
- Real run of the helper from the repository root — exit 0, 17 checks passed,
  0 failed (npm test, 15 tracked `.js` files, git diff check).
- Tests cover success, failing `git diff --check`, missing Jest, empty tracked
  file list, output truncation, and help output.
- Fixed a Windows issue discovered in the real run: npm is a `.cmd` shim and is
  now invoked through `cmd.exe` with a fixed command string; node and git run
  without a shell so paths with spaces work.
