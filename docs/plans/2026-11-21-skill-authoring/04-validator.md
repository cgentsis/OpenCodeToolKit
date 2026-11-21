# Task 04 — Implement the read-only validator

## Goal and acceptance criteria

Create `skills/skill-authoring/validate-skill-set.js`, a read-only validator that
reuses `discoverSkills` and `validateSkill` from `skills/skill-evals/`. It checks
that every skill has eval files, that marked registry entries in `README.md` and
`AGENTS.md` exist and contain each skill name, and that each skill's `SKILL.md`
is discoverable under `skills.paths`. It prints a report and changes no files.

Acceptance criteria:

- The script performs no writes; only `fs.readFileSync`/`readdirSync` equivalents.
- Missing eval files, missing markers, missing registry entries, and stale names
  after rename/remove each produce a clear failure line.
- Exit code is non-zero when any check fails, zero otherwise.
- Pure helpers are exported for unit testing.

## Files/areas to change

- `skills/skill-authoring/validate-skill-set.js` (new).

## Architecture impact

Implements the read-only validator and eval-helper reuse already recorded in the
Script-backed, Eval runner, and Verification sections of `ARCHITECTURE.md`.

## Dependencies and order

Depends on Tasks 02 (eval format) and 03 (markers). Task 05 tests it.

## Verification/tests

- `node --check skills/skill-authoring/validate-skill-set.js`
- `node skills/skill-authoring/validate-skill-set.js` — expect only the two known
  retrofit warnings until Tasks 06 and 07 complete.

## Risks and rollback

- Risk: brittle path assumptions. Mitigation: resolve paths from the repository
  root and expose pure helpers for mocked tests.
- Rollback: delete the script.

## Estimate/size

M

## Milestone mapping

Delivery

## Status

complete — 2026-11-21

Verification evidence: `node --check skills/skill-authoring/validate-skill-set.js`
passed. `node skills/skill-authoring/validate-skill-set.js` printed
`Skills discovered: 11`, `Eval suites: 9`, `Errors: 2`, with exactly the two
known gaps (`create-worktree-on-change: no eval files` and
`review-and-pr: no eval files`) and no registry or discovery errors; exit 1 is
correct because those checks fail until Tasks 06 and 07 complete. Baseline:
`npm ci` then `npm test` → 5 suites, 50 tests passed; `git diff --check` passed.
A syntax error in the discovery regex was diagnosed via systematic-debugging
(unescaped `/` terminated the regex literal) and fixed with plain string checks;
the same `node --check` command then passed.
