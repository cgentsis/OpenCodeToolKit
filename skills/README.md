# Skills

Shared OpenCode skills. opencode discovers each skill through its `SKILL.md`
file, and `opencode.jsonc` registers this directory via `skills.paths`.

The `manifest.jsonc` files describe the skill entrypoints for external
orchestration. opencode itself uses `SKILL.md` for discovery and instructions.

## idea-discovery

Captures the **what** and **why** of a new idea through a council of Brainstormer
and Devil's Advocate. Produces a validated idea document under `docs/ideas/` and
then offers to continue with `solution-brainstorming`.

## solution-brainstorming

Captures the **how** for a validated idea. Generates alternatives, stress-tests
them, records the chosen approach, and appends the solution to the idea document
(or writes a separate solution file).

## review-and-pr

Commits pending changes, pushes the current branch, and opens or reuses a GitHub
pull request.

```bash
AUTO_PR=yes node run-review-pr.js
```

Options can be supplied as environment variables or through `run(options)` when
used as a module:

| Option | Environment variable | Default | Description |
| --- | --- | --- | --- |
| `branch` | `BRANCH` | current branch | Branch to push and open a PR for. |
| `baseBranch` | `BASE_BRANCH` | `main` | Target branch for the PR. |
| `commitMsg` | `COMMIT_MSG` | generated | Commit message. |
| `paths` | `COMMIT_PATHS` | all changes | Comma-separated paths to stage. |
| `autoApprove` | `AUTO_PR=yes` | prompt | Skip the confirmation prompt. |
| `dryRun` | `DRY_RUN=yes` | `false` | Log commands without changing anything. |
| `verbose` | `VERBOSE=yes` | `false` | Print each git/gh command. |
| `prTitle` | `PR_TITLE` | commit subject | PR title. |
| `prBody` | `PR_BODY` | commit body | PR body. |

The skill requires the GitHub CLI (`gh`) to be installed and authenticated, and
it skips the commit when the working tree is clean.

## create-worktree-on-change

Creates or reuses a git worktree before changes are made. Existing worktrees for
the requested branch are reused, and `HEAD` (or `BASE_REF`) is used as the base
for new branches.

```bash
node run-workflow.js my-feature
```

| Option | Environment variable | Default | Description |
| --- | --- | --- | --- |
| `requestedName` | `WORKTREE_NAME` | `feature-x` | Worktree/branch name. |
| `name` | `TASK_NAME` | requested name | Overrides the worktree name. |
| `baseRef` | `BASE_REF` | `HEAD` | Base ref for new branches. |

Worktrees are created under `worktrees/<branch>`, which is ignored by git.
