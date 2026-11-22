---
name: pr-lifecycle-monitor
description: >-
  Use after review-and-pr creates or reuses a PR and the user wants review
  comments and merge state watched until the PR is resolved. Monitors only PRs
  opened or refreshed by this workflow in the current session, proposes replies
  or fixes by default, and supports explicit full autonomy. Not for opening a
  PR, running a review gate, reviewing a design, or monitoring unrelated PRs.
---

# PR Lifecycle Monitor

## When to use

- Immediately after a successful `review-and-pr` handoff for a PR in this
  repository.
- When the user wants new inline review comments, top-level PR comments, and
  merge state watched without manually re-checking GitHub.
- When the user wants local worktree cleanup to happen automatically after the
  tracked PR is verified merged.

## When not to use

- To open, update, or merge a PR. Use `review-and-pr`.
- To run a code review or produce a review report. Use `review-gate`.
- To monitor PRs not opened or refreshed by this workflow.
- To keep monitoring after the OpenCode session ends. This skill is
  session-only.

## Contract

1. **Start after handoff.** Register the PR number, head branch, and initial
   comment cursor in memory only. Ask once whether full autonomy is enabled and
   print the chosen mode in the handoff summary.
2. **Detect and notify.** Start the short-lived `wait-for-activity.js` waiter
   for the tracked PRs. It uses `gh event listen --count 1` for review-submitted,
   PR-state-changed, and head-changed CloudEvents plus a roughly 10-second `gh
   api` poll for top-level comments. If event listening fails, polling remains
   active. The waiter prints one JSON activity record and exits so the harness
   notifies the session. Refresh full details with `gh api`, handle the activity,
   update the cursor, and restart the waiter. The long-running `monitor.js`
   remains available for continuous watching.
3. **Deduplicate.** Key comment activity by `id` plus `updated_at`. An edited
   comment is new activity; an unchanged comment is not emitted twice.
4. **React by default with a proposal.** Emit a structured approval card with
   the comment summary, proposed reply, optional code-change plan, and Approve,
   Edit, and Skip choices. Do not reply, edit, push, or refresh the review report
   until the user approves.
5. **Full autonomy is bounded.** When explicitly enabled at start, the monitor
   may reply to comments, implement and push fixes, and re-run verification gates
   plus refresh the approved review report. It never merges a PR and never
   deletes a remote branch.
6. **Clean up on verified merge.** Re-read PR state before cleanup, then invoke
   `finish-worktree` once for the tracked branch. A per-PR guard prevents repeat
   cleanup. A close without merge stops watching without cleanup.
7. **Stop cleanly.** Stop on merged, closed, or session end. Use the explicit
   stop hook plus abort signal so listeners and timers are closed.

## Hard boundaries

- No autonomous merge, even under full autonomy.
- No remote branch deletion or other destructive remote mutation.
- No monitoring of untracked PRs.
- No repository-persistent state, external scheduler, env var, repo config, or
  other pre-use setup. The notification waiter cursor lives only in the approved
  temp directory and is removed on stop, merge/close, or session cleanup.
- Worktree-first applies to every file change made in response to a comment.
- `gh` and `git` calls must be injectable so tests can mock them.

## Entrypoint and companions

- Scripts: `skills/pr-lifecycle-monitor/monitor.js`,
  `skills/pr-lifecycle-monitor/wait-for-activity.js`,
  `skills/pr-lifecycle-monitor/reactions.js`, and
  `skills/pr-lifecycle-monitor/cleanup.js`.
- Task prompts: `skills/pr-lifecycle-monitor/evals/evals.json`.
- Trigger queries: `skills/pr-lifecycle-monitor/evals/trigger-evals.json`.
- The script owns deterministic detection, deduplication, authorization checks,
  and cleanup calls. This skill owns the start prompt, approval card, audit
  output, and stop conditions.

## Verification

Before reporting that monitoring has started or stopped, confirm the observed
events, emitted proposals or actions, waiter activity record and cursor state,
cleanup guard state, and stop output. Do not claim a merge was cleaned up unless
`finish-worktree` succeeded.
