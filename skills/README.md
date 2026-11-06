# Skills

Shared OpenCode skills. Each skill has a `manifest.jsonc` that declares its
event hook and entrypoint.

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
