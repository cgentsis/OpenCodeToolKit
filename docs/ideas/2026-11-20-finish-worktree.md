# Finish worktree

## Description

A `finish-worktree` skill and companion script that automate the final stage of
this repository's worktree lifecycle: after a pull request has been merged,
clean up the local worktree and branch safely. The workflow verifies the merge
state, refuses unsafe states, moves the session back to the main checkout,
fast-forwards `main`, removes the local worktree, and deletes the fully merged
local branch. It never deletes a remote branch.

This closes the only missing stage in the pipeline: create a worktree, do the
work, open a PR, merge it, then clean up. All of these steps were performed
manually after PR #3, and the operations are safety-sensitive.

## Goals and success metrics

- One skill invocation performs the complete post-merge cleanup.
- A `DRY_RUN=yes` mode previews every action without changing any state.
- The workflow refuses to proceed when the PR is not merged, the worktree has
  uncommitted changes, or the local branch is not fully merged.
- After a successful run, the session points at the main checkout, `main` is
  updated, and the local worktree and branch no longer exist.
- No remote branch is ever deleted.

## Audience

- Anyone using this repository's worktree-based workflow, including coding
  agents that need to return to the main checkout after a merge.
- Contributors who want a repeatable, reviewable alternative to a sequence of
  manual git and `gh` commands.

## Constraints and non-goals

Constraints:

- Verify merge state with the GitHub CLI; stop rather than infer it if the
  lookup fails or `gh` is unauthenticated.
- Follow the mandatory worktree-first rule for any file change; the workflow
  itself is the exception because its purpose is worktree removal.
- Work on Windows/PowerShell as well as Unix shells.
- Never delete a remote branch, by default or by option.
- Preserve the session's working directory correctly: only move it after the
  worktree is safely removable.

Non-goals:

- Creating worktrees (`create-worktree-on-change` owns that).
- Committing, pushing, or opening PRs (`review-and-pr` owns that).
- Merging PRs or changing remote state.
- Cleaning unrelated or stale worktrees from other branches.

## Assumptions

- The current branch has a discoverable open-or-merged PR.
- If the session is already in the main checkout, the workflow is a no-op with
  a clear message.
- The local branch is fully merged into `main` before its deletion.
- The main checkout lives at the git common directory's parent.

## Decision log

1. **Why a new skill instead of extending `review-and-pr`?** Challenge: cleanup
   is git worktree plumbing, while `review-and-pr` owns commit/push/PR creation.
   Decision: a separate `finish-worktree` skill with its own script.
   Alternatives: add a `--cleanup` flag to `review-and-pr`; keep the manual
   steps. Rationale: distinct lifecycle stage, distinct safety checks, and no
   need to touch `review-and-pr` to change cleanup behavior.

2. **Remote branch deletion.** Challenge: leaving remote branches around is
   untidy, but deleting them is irreversible and some teams keep them.
   Decision: never delete remote branches. Alternatives: delete automatically,
   or ask for confirmation. Rationale: user preference; local cleanup is the
   safe, reversible part.

3. **Merge verification.** Challenge: deleting a branch whose PR is not merged
   loses work. Decision: require a successful `gh pr view` reporting MERGED, and
   stop on any lookup failure. Alternatives: trust local branch ancestry, or
   prompt the user. Rationale: local ancestry can be stale; an explicit check
   prevents data loss.

4. **Session handling.** Challenge: removing the worktree while the session is
   inside it breaks the working directory. Decision: move the session to the
   main checkout before removing the worktree, and only after the safety checks
   pass. Alternatives: remove with force and repair afterward; leave cleanup to
   the user. Rationale: deterministic ordering avoids a broken session.

## Open questions / next steps

- None blocking. Exact commands, gates, and test cases belong in solution
  brainstorming and implementation planning.

## Council sign-off

- Brainstormer: accepts the idea, goals, and non-goals as captured.
- Devil's Advocate: accepts with the recorded caveat that PR lookup must fail
  closed; the README and `AGENTS.md` discovery rules will need updating when
  the skill exists.

## Solution

### Chosen approach

Build `finish-worktree` as a dedicated skill backed by a Node.js script,
following the `review-and-pr` pattern: `skills/finish-worktree/SKILL.md` plus a
root-level `finish-worktree.js`. Add a short `runbooks/finish-worktree.md` as a
human-readable manual fallback.

The skill first moves the session back to the main checkout, then invokes the
script. The script performs fail-closed preflight checks, previews actions in
`DRY_RUN` mode, and only then mutates local state.

### Alternatives considered

- **Prompt-only skill** — rejected: safety for destructive operations would
  depend on instruction-following, with no unit tests.
- **Extending `create-worktree-on-change`** — rejected: couples two lifecycle
  stages and increases the blast radius of a stable, tested script.
- **Runbook only** — rejected as a standalone solution: cannot provide one
  invocation, guardrails, or dry-run. Retained as a companion artifact.
- **`review-and-pr --finish` flag** — rejected: conflates PR creation with
  cleanup and complicates the CLI.

### Trade-offs

- More code and tests than a prompt-only skill, in exchange for deterministic
  guardrails on destructive git operations.
- The session moves to the main checkout before preflight. A failed check leaves
  the session relocated but the worktree intact. This was an explicit user
  decision and is considered recoverable.
- The script cannot call the harness session tool directly, so the skill owns
  that step and the script prints the main checkout path for verification.

### Risks and mitigations

- **Deleting an unmerged branch:** preflight requires `gh pr view` to report a
  merged PR and fails closed on lookup errors.
- **Dirty worktree:** preflight refuses when `git status --porcelain` is
  non-empty.
- **Wrong branch or detached HEAD:** preflight requires a named current branch
  with a matching registered worktree.
- **Accidental remote changes:** the script never calls `git push` or `gh pr`;
  remote branches are never deleted.
- **Unverified ordering:** `DRY_RUN=yes` previews every command before any
  mutation.

### High-level steps or components

1. `skills/finish-worktree/SKILL.md` — triggers, authorization, session move,
   invocation, and reporting.
2. `finish-worktree.js` — CLI entrypoint with preflight, dry-run, and cleanup
   phases; exports pure helpers for testing.
3. `test/finish-worktree.test.js` — mocked `child_process` tests for success,
   dry-run, and every refusal path.
4. `runbooks/finish-worktree.md` — manual fallback checklist.
5. Documentation updates: `skills/README.md`, top-level `README.md` if needed,
   and `AGENTS.md` discovery rules.
6. Eval files: `evals/evals.json` and `evals/trigger-evals.json`.

### Assumptions

- `gh` is installed and authenticated.
- The current branch has a discoverable PR.
- The main checkout is the parent of the git common directory.
- The local branch is fully merged before deletion.

### Decision log

1. **Session move timing.** Challenge: a failed preflight after moving the
   session leaves it relocated. Decision: move first. Alternatives: two-phase
   preflight/execute; never move. Rationale: user preference; the outcome is
   recoverable and the flow stays simple.
2. **Remote branch.** Challenge: untidy remotes versus irreversible deletion.
   Decision: never delete. Alternatives: automatic or confirmed deletion.
   Rationale: user preference.
3. **Script versus prompt-only.** Challenge: code cost versus safety. Decision:
   script. Alternatives: instructions only. Rationale: destructive operations
   need testable guardrails.

### Open questions / next steps

- None blocking. Move to implementation planning for task decomposition.

### Council sign-off

- Brainstormer: accepts the chosen approach and rejects the alternatives as
  recorded.
- Devil's Advocate: signs off provided tests cover every refusal path and PR
  lookup fails closed; both are captured above.
