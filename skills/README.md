# Skills

Shared OpenCode skills. OpenCode discovers each skill through its `SKILL.md`
file, and `opencode.jsonc` registers this directory via `skills.paths`.

## Pipeline

```
idea-discovery → solution-brainstorming → implementation-planning → implementation → review-and-pr → finish-worktree
   what / why        how / approach          plan + architecture       code         commit + PR      local cleanup
       │                    │                       │                   │               │               │
   docs/ideas/*      ## Solution section     docs/plans/*/*       task ## Status      PR URL      worktree removed
```

Each stage requires the previous stage's artifact on disk and hands off only
after an explicit decision. `create-worktree-on-change` is a mandatory
pre-change step used by every skill that writes files. `finish-worktree` runs
after the PR is merged and is the only stage that removes a worktree.

## Available skills

<!-- skill-registry:start -->
Registered skills: `create-worktree-on-change`, `finish-worktree`,
`idea-discovery`, `implementation`, `implementation-planning`, `review-and-pr`,
`skill-authoring`, `skill-evals`, `solution-brainstorming`,
`systematic-debugging`, `test-driven-development`,
`verification-before-completion`.
<!-- skill-registry:end -->

Details for each skill follow below; the marked list above is the registry
checked by `skills/skill-authoring/validate-skill-set.js`.

### idea-discovery

Captures the **what** and **why** of a new idea through a Brainstormer and
Devil's Advocate council. Produces a validated idea document under
`docs/ideas/`, then offers to continue with `solution-brainstorming`.

### solution-brainstorming

Captures the **how** for a validated idea. Generates alternatives, stress-tests
them, records the chosen approach, and appends the solution to the idea document
(or writes a separate file under `docs/solutions/`).

### implementation-planning

Turns a documented solution into an execution plan. Resolves planning unknowns
with a Planner and Devil's Advocate council, identifies required architectural
changes and updates the root `ARCHITECTURE.md`, then writes a plan index and one
Markdown file per task under `docs/plans/YYYY-MM-DD-<slug>/`.

Every task file records goal and acceptance criteria, files/areas to change,
architecture impact, dependencies and order, verification/tests, risks and
rollback, estimate/size, and milestone mapping. When the artifacts are ready,
the skill asks for review; only after approval does it ask about handing off to
`implementation`.

Requires a documented solution artifact (an idea document with a `## Solution`
section or a file under `docs/solutions/`). If it is missing, the skill stops
and offers `solution-brainstorming`.

### implementation

Executes an approved plan. Validates the plan index and task files, works
through tasks in dependency order, runs each task's verification before
recording a truthful `## Status` with evidence, and hands off to
`review-and-pr`. It does not design, plan, commit, push, or open a PR itself.

### review-and-pr

Commits pending changes, pushes the current branch, and opens or reuses a GitHub
pull request. It prompts for confirmation unless `AUTO_PR=yes` is set; set that
only with explicit user authorization.

```bash
node run-review-pr.js
```

| Option | Environment variable | Default | Description |
| --- | --- | --- | --- |
| `branch` | `BRANCH` | current branch | Branch to push and open a PR for. |
| `baseBranch` | `BASE_BRANCH` | `main` | Target branch for the PR. |
| `commitMsg` | `COMMIT_MSG` | generated | Commit message. |
| `paths` | `COMMIT_PATHS` | all changes | Comma-separated paths to stage. |
| `autoApprove` | `AUTO_PR=yes` | prompt | Skip the confirmation prompt (requires authorization). |
| `dryRun` | `DRY_RUN=yes` | `false` | Log commands without changing anything. |
| `verbose` | `VERBOSE=yes` | `false` | Print each git/gh command. |
| `prTitle` | `PR_TITLE` | commit subject | PR title. |
| `prBody` | `PR_BODY` | commit body | PR body. |

Requires `origin`, and the GitHub CLI (`gh`) installed and authenticated. A dry
run does not call `gh` or change anything. Use `DRY_RUN=yes node run-review-pr.js`
to preview.

### create-worktree-on-change

Creates or reuses a git worktree before changes are made. Existing worktrees for
the requested branch are reused, and `HEAD` (or `BASE_REF`) is used as the base
for new branches.

```bash
node skills/create-worktree-on-change/ensure-worktree.js <task-name>
```

| Option | Environment variable | Default | Description |
| --- | --- | --- | --- |
| `requestedName` | `WORKTREE_NAME` | `change` | Worktree/branch name. |
| `name` | `TASK_NAME` | requested name | Overrides the worktree name. |
| `baseRef` | `BASE_REF` | `HEAD` | Base ref for new branches. |

Worktrees are created under `worktrees/<branch>`, which is ignored by git.
`node create-and-review.js <name>` creates a worktree and runs `review-and-pr`
only when that worktree already has pending changes; a fresh worktree skips the
PR workflow.

### finish-worktree

Cleans up the local worktree and fully merged branch after a PR is merged. It
moves the session to the main checkout first, verifies the merge and a clean
worktree, fast-forwards `main`, then removes the worktree and deletes the local
branch with `git branch -d`. It never deletes a remote branch and never commits,
pushes, or merges.

```bash
DRY_RUN=yes node finish-worktree.js <branch>
node finish-worktree.js <branch>
```

| Option | Environment variable | Default | Description |
| --- | --- | --- | --- |
| `branch` | `FINISH_BRANCH` | positional arg | Branch whose worktree should be finished. |
| `baseBranch` | `BASE_BRANCH` | `main` | Expected main-checkout branch and PR base. |
| `dryRun` | `DRY_RUN=yes` | `false` | Log commands without changing anything. |
| `verbose` | `VERBOSE=yes` | `false` | Print each git command before running it. |

Requires an authenticated `gh` for merge verification. A dry run still performs
read-only preflight checks. The manual fallback is in
`runbooks/finish-worktree.md`.

### skill-evals

Validates the repository's eval files offline by default and offers an advisory
opt-in `--live` check using the `opencode` CLI. Live output is informational
only and never a pass/fail gate.

```bash
node skills/skill-evals/run-evals.js --offline
node skills/skill-evals/run-evals.js idea-discovery
node skills/skill-evals/run-evals.js --live
```

| Flag | Purpose |
| --- | --- |
| `--offline` | Validate eval files only (default). |
| `--live` | Advisory CLI checks; never a pass/fail gate. |
| `--help` | Print usage. |
| `skill` | Optional positional skill directory name to validate only. |

| Environment variable | Default | Purpose |
| --- | --- | --- |
| `EVAL_TIMEOUT` | `30000` | Per-eval timeout in ms for `--live`. |

The runner is modular: `discover.js`, `validate.js`, `live.js`, and `report.js`
back the thin `run-evals.js` CLI. See `ARCHITECTURE.md` for the conventions.

### verification-before-completion

Requires observed evidence before any completion claim or handoff, including
ad-hoc fixes. Runs the baseline checks (`npm test`, `node --check`,
`git diff --check`) plus task-specific ones, reads their output, and withholds
the claim if any check fails or cannot run. There is no exemption for
documentation-only changes.

```bash
node skills/verification-before-completion/verify-completion.js
```

The helper is optional: it runs the baseline checks in one step, prints their
output, and exits non-zero on any failure. Manual evidence is equally valid.
The helper is not a CI gate and does not require any new dependency.

### systematic-debugging

Requires a structured investigation before any fix for a bug, failing test, or
unexpected behavior, including intermittent issues. The hard-stop sequence is
reproduce → isolate → root cause → failing repeatable command → fix → verify,
then hand off to `verification-before-completion`. The failing command need not
be a Jest test; any explicit, repeatable command qualifies. Evidence is cited
inline, and unreproducible failures are reported rather than patched
speculatively. This skill adds no helper script or new tooling.

### test-driven-development

Owns the red → green → refactor hard gate for implementation work. For
executable behavior changes it requires a failing test before production code
and a `### TDD Evidence` section in task status with the command and observed
result for both Red and Green, plus a Refactor note. Docs/config-only changes
use `Exempt: docs/config-only` with a one-line reason.

The minimal validator is:

```bash
node skills/test-driven-development/check-tdd-evidence.js <task-file>
```

`implementation` runs it before completing a task; `review-and-pr` reuses it as
a PR-time backstop over changed plan task files. The skill does not choose a
test runner, replace `systematic-debugging`, or write production code itself.

## Shared council protocol

`_shared/council-protocol.md` defines the question loop, question-tool usage,
backlog handling, hard gate, worktree-first rule, and verification standard for
the council skills. Skill `SKILL.md` files contain only their roles, scope,
stages, and output schemas. Read the shared protocol before starting a council
skill rather than duplicating its rules.

## Manifests

The `manifest.jsonc` files in `create-worktree-on-change/` and `review-and-pr/`
describe hypothetical event entrypoints (`on_change`, `on_ready`) for an
external orchestrator. They are **illustrative metadata**: nothing in this
repository reads or dispatches them, and OpenCode does not use them. OpenCode
discovers skills from `SKILL.md` only. Wire them up in your own orchestrator if
you want event-driven behavior.

## Testing and evals

Run the script unit tests with:

```bash
npm test
```

Each council-style skill also has `evals/evals.json` (realistic task prompts
with expected outputs) and `evals/trigger-evals.json` (should-trigger and
should-not-trigger queries for tuning the description). Use these with a skill
evaluation harness when changing a skill's description or workflow.

## Prerequisites

- Node.js, for the bundled workflow scripts.
- Git, for worktrees and commits.
- GitHub CLI (`gh`) installed and authenticated, for `review-and-pr`.

## Adding a skill

1. Create `skills/<name>/SKILL.md` with `name` and `description` frontmatter.
2. Write the description for **triggering**: what the skill does, when to use
   it, and what it does not do. Keep operational notes in the body.
3. Keep the body lean. Put reusable conventions in a `references/` or the
   shared protocol and link to them instead of copying text.
4. Add `evals/evals.json` and, for prompt-driven skills,
   `evals/trigger-evals.json`.
5. Add a section to this README describing the skill and its inputs/outputs.
6. If the skill must run before other work, add a discovery rule to `AGENTS.md`.
