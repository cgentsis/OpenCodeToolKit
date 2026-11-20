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
`implementation` → `review-and-pr`, with `create-worktree-on-change` as the
mandatory pre-change gate. Each stage requires the previous stage's artifact on
disk and hands off only after an explicit decision.

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

## Verification conventions

- `npm test` runs all Jest suites with `--runInBand`.
- Scripts are also checked with `node --check` and `git diff --check`.
- A dry run must be side-effect free and must not call `gh`.

## Non-goals

- No automated eval runner yet; eval files are data for an external harness.
- No release or changelog automation.
- No API layer or runtime service; this repository is skills, scripts, and docs.
