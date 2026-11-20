# Architecture

This document is the source of truth for the repository's structure and the
architectural conventions that new work must respect. It was created as a
baseline for the `finish-worktree` plan; earlier work did not have an
architecture document.

## Repository layout

- `skills/<name>/SKILL.md` — one OpenCode skill per directory. `opencode.jsonc`
  registers `./skills` via `skills.paths`, so OpenCode discovers skills from
  these files only.
- `skills/_shared/` — reference material shared by council skills. Directories
  without `SKILL.md` are not registered as skills.
- `skills/<name>/evals/` — `evals.json` (task prompts) and `trigger-evals.json`
  (description-triggering queries) for each prompt-driven skill.
- `skills/skill-evals/` — the eval runner: modular CommonJS files
  (`discover.js`, `validate.js`, `live.js`, `report.js`) plus a thin
  `run-evals.js` CLI and a `SKILL.md`. The CLI discovers skills with eval files
  and validates them offline; `--live` is an advisory CLI-subprocess mode.
- `skills/verification-before-completion/` — a `SKILL.md` with the evidence bar
  and failure rule, plus an optional `verify-completion.js` helper that runs the
  baseline checks in one step. The helper is an accelerator, not a required gate.
- `skills/systematic-debugging/` — guidance-only `SKILL.md` and eval files. It
  enforces a hard-stop regression checkpoint before any fix; no helper script.
- Root-level `run-*.js` and `*-worktree.js` scripts — CLI entrypoints for
  script-backed skills. Skills invoke them from the repository root.
- `test/` — Jest unit tests. Scripts must expose pure helpers where practical
  and mock `child_process` rather than touching the real filesystem or git.
- `docs/ideas/` — validated what/why artifacts from `idea-discovery`.
- `docs/solutions/` — optional standalone solution artifacts; by default the
  solution is a `## Solution` section in the idea document.
- `docs/plans/YYYY-MM-DD-<slug>/` — plan index plus one `NN-<slug>.md` per task.
- `worktrees/<branch>` — linked git worktrees, ignored by git.
- `agents/` and `runbooks/` — reusable role prompts and operational checklists;
  neither is registered with OpenCode automatically.

## Skill pipeline

`idea-discovery` → `solution-brainstorming` → `implementation-planning` →
`implementation` → `review-and-pr` → `finish-worktree`, with
`create-worktree-on-change` as the mandatory pre-change gate. Each stage
requires the previous stage's artifact on disk and hands off only after an
explicit decision.

Council skills share `skills/_shared/council-protocol.md` for the question loop,
hard gate, and verification rules. `implementation` is not a council skill.

## Script-backed skill convention

- The `SKILL.md` owns triggering, authorization, and harness-level actions
  (such as moving the session working directory).
- The script owns deterministic preflight checks, `DRY_RUN` previews, and git or
  `gh` mutations. Destructive scripts must fail closed on any lookup failure.
- Environment variables configure scripts (`AUTO_PR`, `DRY_RUN`, `BASE_REF`,
  `COMMIT_PATHS`, etc.); options tables live in both `SKILL.md` and
  `skills/README.md`.
- `manifest.jsonc` files are illustrative metadata only. Nothing in this
  repository dispatches them.

## Eval runner conventions

- Offline validation is the default and is CI-safe: no network or LLM calls.
- `--live` is strictly opt-in, advisory, time-bounded (`EVAL_TIMEOUT`, 30s
  default), and never a CI gate.
- Live checks spawn the `opencode` CLI with argument arrays and `shell: false`.
- v1 emits human-readable logs only; a machine-readable report is deferred.

## Debugging conventions

- Bugs, test failures, and unexpected behavior follow
  `systematic-debugging`: reproduce → isolate → root cause → failing repeatable
  command → fix → verify.
- The failing command is a hard stop before any fix; it need not be a Jest test,
  but it must be explicit and repeatable.
- Evidence is cited inline; no new report file or format is introduced.
- If reproduction fails after reasonable effort, stop and report the attempts
  and evidence instead of proposing a speculative fix.
- Completion claims still depend on `verification-before-completion`.

## Verification conventions

- `npm test` runs all Jest suites with `--runInBand`.
- Scripts are also checked with `node --check` and `git diff --check`.
- Completion claims must cite observed command output, not just list commands.
  A failed or unavailable check blocks the claim until resolved or explicitly
  reported as unverified.
- `verify-completion.js` is an optional helper: it runs `npm test`, `node --check`
  on all tracked `.js` files, and `git diff --check`, prints their output, and
  exits non-zero on any failure. It uses only Node built-ins and is never a CI
  gate.
- Documentation-only changes get no exemption from the baseline checks.
- A dry run must be side-effect free and must not call `gh`.
- The eval runner's offline mode must not call `opencode` or any LLM.

## Non-goals

- No machine-readable JSON report in v1 (deferred).
- No release or changelog automation.
- No API layer or runtime service; this repository is skills, scripts, and docs.
