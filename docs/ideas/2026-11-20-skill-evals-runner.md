# Skill evals runner

## Description

A `skill-evals` runner that makes the repository's existing eval files
executable. Offline by default, it discovers every skill with an `evals/`
directory and validates the structure and coverage of `evals.json` and
`trigger-evals.json`, exiting non-zero on defects. With an explicit `--live`
flag it runs advisory checks by spawning `opencode run` per eval, with clear
warnings and timeouts. Live mode never blocks CI and adds no new dependency.

## Goals and success metrics

- Offline mode validates every skill that has eval files and reports failures
  with the exact file, field, and reason.
- Offline mode is deterministic, fast, and CI-safe: no network, no LLM calls.
- `--live` is strictly opt-in, labeled advisory, and times out gracefully.
- A skill with malformed eval JSON or insufficient trigger coverage fails the
  offline check so drift is caught before merge.
- Unit tests cover discovery, validation failures, and the live adapter using
  mocked subprocess calls.

## Audience

- Contributors changing a skill's `SKILL.md` description or workflow.
- CI jobs that should catch eval-file drift without API cost.
- Maintainers tuning trigger queries who want an optional live signal.

## Constraints and non-goals

Constraints:

- Live mode uses a CLI subprocess (`opencode run`), no OpenCode SDK dependency.
- `--live` must be explicit, warned about, time-bounded, and advisory.
- Validate any skill with both `evals/evals.json` and
  `evals/trigger-evals.json`; report skills with partial/missing eval files as
  warnings, not errors.
- Windows/PowerShell compatibility; worktree-first for edits.

Non-goals:

- Full model-judged scoring or semantic grading in v1.
- Replacing Jest unit tests for JavaScript scripts.
- Adding an SDK dependency or wiring into CI in this idea's scope.
- Modifying eval files or skill descriptions.

## Assumptions

- The `opencode` CLI is available for live mode; offline mode does not require
  it.
- Eval JSON keeps the current shape (`skill_name` + `evals[]` for eval files;
  array of `{query, should_trigger}` for trigger files).
- v1 emits human-readable logs; a machine-readable report can come later.

## Decision log

1. **Scope of the runner.** Challenge: "eval runner" could mean JSON validation
   or live LLM evaluation. Decision: offline validation by default with opt-in
   `--live`. Alternatives: offline only; live only. Rationale: deterministic
   guardrails for CI, with an advisory live signal when wanted.
2. **Live engine.** Challenge: SDK gives structure but adds a dependency and
   cost. Decision: CLI subprocess `opencode run`. Alternatives: add OpenCode
   SDK dependency; pluggable adapter. Rationale: no new dependency, easy to
   mock in tests, sufficient for advisory checks.
3. **Coverage.** Challenge: strict requirement that every skill have evals
   versus validating only council skills. Decision: validate any skill with
   eval files; warn on missing. Alternatives: require all skills; only council
   skills. Rationale: gradual adoption without blocking script-only skills.
4. **Live reliability.** Challenge: live model checks are non-deterministic and
   costly. Decision: advisory only, never a CI gate, with timeouts and explicit
   warnings. Alternatives: live as required gate. Rationale: avoids flaky
   failures and surprise cost.

## Open questions / next steps

- Add a machine-readable JSON report in v1 or defer?
- Default timeout and concurrency for live mode (defer details to solution
  brainstorming / planning).
- Fix the bootstrap gap found while testing `finish-worktree` separately; not
  part of this idea.

## Council sign-off

- Brainstormer: accepts the offline-first, opt-in-live scope and the CLI
  subprocess decision.
- Devil's Advocate: signs off on the caveat that live mode is advisory only,
  time-bounded, and never used as a CI gate.

## Solution

### Chosen approach

Build `skills/skill-evals/` as a modular CLI tool with a thin `SKILL.md`:

- `discover.js` — find skills with eval directories.
- `validate.js` — check `evals.json` and `trigger-evals.json` structure and
  coverage.
- `live.js` — advisory `--live` adapter using `child_process.spawn` with an
  argument array and no shell.
- `report.js` — human-readable logging and exit codes.
- `run-evals.js` — thin CLI wiring the modules.

Unit tests in `test/skill-evals.test.js` mock subprocess calls and cover
discovery, validation failures, and live output formatting.

### Alternatives considered

- **Single CLI script + thin skill** — rejected: mixes discovery, validation,
  and live concerns in one large file; less testable.
- **Jest-based harness** — rejected: couples eval data to the test framework
  and makes advisory live checks awkward.
- **Shell/PowerShell script** — rejected: hard to unit-test and platform-specific.

### Trade-offs

- More files and module ceremony than a single script, in exchange for clear
  boundaries and easier testing.
- Live mode is advisory only: it prints each query, an output snippet, and
  timing, with no pass/fail verdict.
- v1 emits human-readable logs only; a `--json` report is deferred.

### Risks and mitigations

- **Live flakiness or cost:** never a CI gate; opt-in `--live`, explicit
  warnings, timeouts, and bounded output.
- **Missing `opencode` CLI:** clear error in live mode; offline unaffected.
- **Eval schema drift:** explicit validation rules with precise file/field
  messages and non-zero exit on defects.
- **Subprocess safety:** `spawn` with argument arrays, `shell: false`, and no
  interpolated user input in a command string.

### High-level steps or components

1. Discovery module (eval dirs, partial/missing eval files as warnings).
2. Validation module (schema, required fields, trigger coverage, `skill_name`
   matching directory name).
3. Live adapter (spawn `opencode run`, capture bounded output, timeout).
4. Reporting module (summary lines, errors, exit codes).
5. CLI wiring and flags (`--live`, `--offline`, `--help`, optional path filter).
6. `SKILL.md` and skill README updates.
7. Jest tests and eval files for the new skill.

### Assumptions

- `opencode` CLI exists for live mode; offline mode requires no external tool.
- Eval JSON shapes stay as currently used in the repository.
- Human-readable output is sufficient for v1.

### Decision log

1. **Modular versus single script.** Challenge: ceremony versus clarity.
   Decision: modular. Alternatives: single script. Rationale: distinct phases
   and future growth (JSON report) favor separation.
2. **Live verdict.** Challenge: non-deterministic model output. Decision:
   advisory summary only. Alternatives: exit-code or heuristic trigger
   detection. Rationale: avoids false confidence and flaky gates.
3. **JSON report.** Challenge: CI consumption later. Decision: defer.
   Alternatives: include `--json` in v1. Rationale: no concrete consumer yet.

### Open questions / next steps

- None blocking. Move to implementation planning for module boundaries,
  timeout defaults, and task decomposition.

### Council sign-off

- Brainstormer: accepts the modular approach and rejected alternatives as
  recorded.
- Devil's Advocate: signs off with the caveat that live mode remains advisory,
  time-bounded, and never a CI gate.
