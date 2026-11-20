# Task 03 — Advisory live adapter

## Goal and acceptance criteria

Add the opt-in `--live` path that runs advisory checks via the `opencode` CLI.

Acceptance criteria:

- `live.js` exposes a function that, for each eval prompt, spawns
  `opencode run <prompt>` with an argument array and `shell: false`.
- `EVAL_TIMEOUT` (default 30000 ms) bounds each run; a timeout is reported and
  the next eval continues.
- Output is captured and truncated to a bounded snippet (for example, first
  500 characters) for an advisory summary: query, snippet, duration.
- No pass/fail verdict is produced; live mode never changes the process exit
  code based on model output.
- Missing `opencode` CLI produces a clear error without affecting offline mode.
- Unit tests mock `child_process.spawn` for success, timeout, and missing CLI.

## Files/areas to change

- `skills/skill-evals/live.js` (new)
- `skills/skill-evals/run-evals.js` (wire `--live` flag)
- `test/skill-evals.test.js` (extend)

## Architecture impact

Adds the live adapter module to the eval runner and wires it into the CLI.
Matches the recorded convention: advisory, time-bounded, CLI subprocess.
No other architecture sections change.

## Dependencies and order

Depends on task 02 (CLI contract). Independent of task 04.

## Verification/tests

- `npm test` passes with live adapter tests.
- Manual: with a fake `opencode` on PATH, `--live` prints advisory summaries.
- Offline mode still exits 0 without `opencode` present.

## Risks and rollback

- Risk: hanging or expensive subprocesses. Mitigation: default 30s timeout,
  truncation, explicit advisory warnings.
- Risk: shell injection from prompts. Mitigation: argument array, no shell.
- Rollback: remove `live.js` and the `--live` wiring; tests for it can be
  removed with the same commit.

## Estimate/size

M

## Milestone mapping

M2 — Live adapter and skill wrapper

## Status

complete — 2026-11-20

Verification evidence:

- `npm test` — 4 suites, 41 tests passed (6 new live-adapter tests).
- Tests confirm `spawn('opencode', ['run', prompt], { shell: false })`, bounded
  snippet truncation, timeout with `child.kill()`, missing-CLI error without
  throwing, advisory-only logging, and `--live` CLI exit code 0.
- Offline mode remains unchanged: `--offline` and the positional filter still
  exit 0 on current eval files.
- `EVAL_TIMEOUT` configurable with a 30000 ms default.
