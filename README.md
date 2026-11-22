# OpenCodeToolKit

Reusable **skills, scripts, and documentation for agentic development with [OpenCode](https://opencode.ai)**. The repository gives an OpenCode agent a disciplined, repeatable workflow — from idea capture and planning through implementation, review, PR handoff, and cleanup — plus the automation scripts and eval harnesses that enforce it.

## What this repository is for

OpenCode discovers skills from `SKILL.md` files. This repository registers `./skills` in `opencode.jsonc`, so a project that points its OpenCode config at this directory gets the whole toolkit. The repository's own `AGENTS.md` encodes the house rules: work in isolated worktrees, follow the skill pipeline, and provide observed evidence before claiming completion.

The toolkit is built around four ideas:

- **A defined pipeline** — `idea-discovery` → `solution-brainstorming` → `implementation-planning` → `implementation` → `review-gate` → `review-and-pr` → `pr-lifecycle-monitor` → `finish-worktree`. Each stage consumes the artifact produced by the previous stage and hands off only after an explicit decision.
- **Mandatory isolation** — `create-worktree-on-change` creates or reuses a git worktree before any file is changed.
- **Evidence gates** — review reports, TDD evidence, and completion verification must be observed and recorded before work is handed off.
- **Script-backed skills** — deterministic Node.js scripts own git/GitHub operations and validation; `SKILL.md` files own triggering, authorization, and conversation.

See [`ARCHITECTURE.md`](ARCHITECTURE.md) for the structural conventions and [`skills/README.md`](skills/README.md) for the full skill reference.

## Repository contents

| Path | What it contains |
| --- | --- |
| `skills/` | All registered OpenCode skills. Each skill lives in `skills/<name>/SKILL.md`; many also include `evals/` and helper scripts. |
| `skills/_shared/` | Shared council protocol used by the reasoning-heavy skills (question loop, hard gate, verification rules). |
| `agents/` | Reserved for reusable subagent role prompts. Adding a file here does not register an OpenCode agent. See [`agents/README.md`](agents/README.md). |
| `runbooks/` | Human- and agent-facing operational procedures, such as the manual `finish-worktree` fallback. See [`runbooks/README.md`](runbooks/README.md). |
| `docs/ideas/` | Validated *what/why* artifacts produced by `idea-discovery`. |
| `docs/plans/` | Plan indexes and per-task specs produced by `implementation-planning`, with task status and evidence recorded by `implementation`. |
| `docs/reviews/` | Read-only review reports produced by `review-gate`; `review-and-pr` requires an approved `code.md` report. |
| `test/` | Jest unit tests for the workflow scripts. Run them with `npm test`. |
| `ARCHITECTURE.md` | Source of truth for repository layout, conventions, and non-goals. |
| `AGENTS.md` | Agent instructions for working inside this repository. |
| `opencode.jsonc` | OpenCode config that registers `./skills` as a skills path. |
| `package.json` / `package-lock.json` | Node package metadata; `npm test` runs the Jest suite. |
| `create-and-review.js`, `run-review-pr.js`, `finish-worktree.js` | Root-level CLI entrypoints for worktree creation, PR handoff, and worktree cleanup. |
| `LICENSE` | MIT license. |

## Available skills

The registry is maintained in [`skills/README.md`](skills/README.md) and validated by `skills/skill-authoring/validate-skill-set.js`.

### Development pipeline

| Skill | Purpose |
| --- | --- |
| `idea-discovery` | Validate the *what* and *why* of an idea with a council; write `docs/ideas/…`. |
| `solution-brainstorming` | Explore alternatives, stress-test them, and record the chosen approach. |
| `implementation-planning` | Produce `ARCHITECTURE.md` updates plus a plan index and task files under `docs/plans/…`. |
| `implementation` | Execute an approved plan task by task, recording verification evidence in each task's status. |
| `review-gate` | Run scripted checks plus an advisory council and write a standardized review report. |
| `review-and-pr` | Commit, push, and open or reuse a PR after an approved code review report exists. |
| `pr-lifecycle-monitor` | Watch tracked PRs for comments and merge state, propose actions, and trigger cleanup on merge. |
| `finish-worktree` | After a verified merge, move back to the main checkout and remove the worktree and local branch. |

### Cross-cutting safety and quality

| Skill | Purpose |
| --- | --- |
| `create-worktree-on-change` | Mandatory pre-change gate: create or reuse an isolated worktree under `worktrees/<branch>`. |
| `systematic-debugging` | Reproduce → isolate → find root cause → capture a failing command → fix → verify. |
| `test-driven-development` | Enforce red/green/refactor evidence for executable behavior changes. |
| `verification-before-completion` | Require observed command output before any completion claim or handoff. |

### Skill authoring and evaluation

| Skill | Purpose |
| --- | --- |
| `skill-authoring` | Create, update, rename, or remove skills; validate evals, registries, and `SKILL.md` discovery. |
| `skill-evals` | Validate eval files offline by default, with an optional advisory `--live` CLI check. |

Three thin aliases — `code-review-gate`, `design-review-gate`, and `specs-review-gate` — fix the review type and delegate to `review-gate`.

## Getting started

Prerequisites:

- **Node.js** — for the bundled workflow scripts and tests.
- **Git** — for worktrees, commits, and branch cleanup.
- **GitHub CLI (`gh`)**, installed and authenticated — only for PR creation, monitoring, and merge verification.

Point OpenCode at this repository's skills by keeping (or copying) the following in your `opencode.jsonc`:

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "skills": {
    "paths": ["./skills"]
  }
}
```

Common commands, run from the repository root:

```bash
npm test                                                   # run the Jest suite
node skills/create-worktree-on-change/ensure-worktree.js my-task
node skills/review-gate/run.js --type code                 # write docs/reviews/code.md
node skills/skill-evals/run-evals.js --offline             # validate skill evals
node run-review-pr.js                                      # commit, push, open/reuse a PR
DRY_RUN=yes node finish-worktree.js my-task                # preview cleanup
```

Each script supports additional flags and environment variables; see [`skills/README.md`](skills/README.md) for the option tables.

## License

[MIT](LICENSE) © 2026 Christos Gentsis.
