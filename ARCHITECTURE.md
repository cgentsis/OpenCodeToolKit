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
- `skills/test-driven-development/` — a `SKILL.md` with eval files plus a
  minimal `check-tdd-evidence.js` validator. The skill owns the red/green/refactor
  gate; the validator checks the evidence recorded in plan task status.
- `skills/skill-authoring/` — a `SKILL.md` covering the full skill lifecycle
  (create, update, rename, remove), eval files, and a read-only validator
  (`validate-skill-set.js`) that checks eval coverage, marked registry entries,
  and `SKILL.md` discovery.
- `skills/review-gate/` — a `SKILL.md`, a read-only `run.js` CLI, `checks/<type>.json`
  checklists, eval files, and a machine-readable alias registry. Three thin alias
  wrappers (`code-review-gate`, `design-review-gate`, `specs-review-gate`) delegate
  to the core. Reports are written under `docs/reviews/`.
- `skills/pr-lifecycle-monitor/` — a `SKILL.md`, eval files, a script-backed
  watcher with in-memory PR state, and a short-lived `wait-for-activity.js`
  notification waiter. It starts after `review-and-pr`, watches review/issue
  comments and merge state via per-PR `gh event listen` plus a fixed one-minute
  poll, and calls `finish-worktree` on verified merge. The notification waiter
  exits on first activity so the harness can notify the session; its dedupe
  cursor lives only in the approved temp directory and is removed on stop,
  merge/close, or session cleanup. The skill never merges a PR.
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
`implementation` → `review-gate` → `review-and-pr` → `pr-lifecycle-monitor` →
`finish-worktree`, with `create-worktree-on-change` as the mandatory pre-change
gate. `review-and-pr` enforces the approved `docs/reviews/code.md` report
produced by `review-gate` and stops before committing, pushing, or opening a PR
when it is missing, stale, or not approved. `pr-lifecycle-monitor` starts only
after a successful PR handoff and invokes `finish-worktree` when the tracked PR
is verified merged. Each stage requires the previous stage's artifact on disk
and hands off only after an explicit decision.

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
- Read-only validators report findings without writing files. They reuse
  existing helpers instead of duplicating validation logic and fail closed on
  ambiguous input.
- `review-gate/run.js` is a read-only review runner: it executes the commands
  listed in `checks/<type>.json`, captures their output, and writes a Markdown
  report with YAML frontmatter under `docs/reviews/`. It never edits source
  files or calls `gh`. Frontmatter fields include `type`, `head`,
  `scripted_verdict`, `advisory_notes`, and `approved`; the scripted verdict is
  authoritative and the council appendix is advisory only.
- Alias wrappers are declared in `review-gate/SKILL.md` frontmatter under
  `aliases:`. The validator exempts declared aliases from per-skill eval files
  but fails closed on any undeclared wrapper directory whose `SKILL.md` marks it
  as an alias.
- Watchers are script-backed skills with bounded lifetimes. `pr-lifecycle-monitor`
  registers tracked PRs in memory only, subscribes per PR with `gh event listen`,
  falls back to a fixed one-minute `gh api` poll, deduplicates by comment `id`
  plus `updated_at`, and uses an abort signal plus explicit stop hook at session
  end. It defaults to notify-and-propose; full autonomy is an auditable
  start-time choice that permits replies, code fixes/pushes, and gate/report
  refresh but never PR merge or remote deletion.
- Session notification uses a short-lived waiter rather than a long-running log
  writer. `wait-for-activity.js` combines `gh event listen` for review/state
  events with a roughly 10-second top-level comment poll, prints one activity
  record, and exits so the harness notifies the session. If event listening is
  unavailable, polling remains active. The caller refreshes full details with
  `gh api`, proposes an action, and restarts the waiter with an updated cursor.

## Eval runner conventions

- Offline validation is the default and is CI-safe: no network or LLM calls.
- `--live` is strictly opt-in, advisory, time-bounded (`EVAL_TIMEOUT`, 30s
  default), and never a CI gate.
- Live checks spawn the `opencode` CLI with argument arrays and `shell: false`.
- v1 emits human-readable logs only; a machine-readable report is deferred.
- Skill-set validators reuse `discoverSkills` and `validateSkill` from
  `skills/skill-evals/`; the accepted bar for the skill set is 0 errors and 0
  warnings offline.
- Skill directories listed as aliases in `review-gate/SKILL.md` are exempt from
  the eval-file requirement. The exemption is fail-closed: the aliases must be
  declared by the core skill, and the validator reports unknown or stale
  aliases as errors.

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

## TDD conventions

- `test-driven-development` is a direct software-work skill; it does not replace
  `systematic-debugging`, choose a test runner, or write production code.
- Implementation tasks that change executable behavior must include a
  `### TDD Evidence` section in their task status with Red, Green, and Refactor
  entries. Red and Green each require the command and the observed result.
- Docs/config-only tasks are exempt when the same section contains an
  `Exempt: docs/config-only` line and a one-line reason.
- `check-tdd-evidence.js` is the single source of truth for evidence validity.
  `implementation` invokes it before marking a non-exempt task complete.
- PR-time checking is a backstop: it reuses the same validator over plan task
  files changed relative to the PR base, rather than introducing a second format.
- The local proxy for the lagging “fewer regressions” goal is evidence
  completeness: 100% of applicable tasks have valid red/green records.

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
- For skill changes, run `node skills/skill-authoring/validate-skill-set.js` as
  a task-specific check in addition to the baseline checks.
- For code delivered through `review-and-pr`, an approved review report is
  required. `review-and-pr` checks `docs/reviews/code.md` at the start of its
  workflow, requires `approved: true`, `scripted_verdict: pass`, and a `head`
  equal to the current `HEAD`, and stops before committing or pushing when the
  report is missing, stale, or not approved.
- A dry run must be side-effect free and must not call `gh`.
- For `pr-lifecycle-monitor`, unit tests cover dedupe, authorization mode,
  event/poll overlap, merge detection, idempotent cleanup, waiter cursor
  initialization, first-activity exit, event-failure fallback, and cursor
  cleanup. Offline skill evals must pass, and a manual smoke test verifies
  start/stop and notification-exit behavior without network access by using
  mocked `gh` and `git` calls.
- The eval runner's offline mode must not call `opencode` or any LLM.

## Non-goals

- No machine-readable JSON report in v1 (deferred).
- No release or changelog automation.
- No API layer or runtime service; this repository is skills, scripts, and docs.
- No repository-persistent or cross-session PR monitor state, external
  scheduler, or autonomous PR merge. A short-lived waiter cursor in the approved
  temp directory is allowed only to dedupe within the active session.
