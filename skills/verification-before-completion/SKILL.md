---
name: verification-before-completion
description: >-
  Use before claiming any work is done, fixed, or passing, or before handing off
  to review-and-pr or finish-worktree, including ad-hoc fixes outside the plan
  pipeline. Requires observed evidence from baseline and task-specific checks
  rather than a list of intended commands. Not a test framework, not CI, not a
  model judge, and not a replacement for implementation's per-task verification.
---

# Verification before completion

## When to use

- Before reporting a task, fix, or change as complete, done, fixed, or passing.
- Before handing off to `review-and-pr` or `finish-worktree`.
- After an ad-hoc fix or debugging session that did not follow the full plan
  pipeline.
- When a previous verification failed and you are about to claim it is resolved.

## Evidence bar

1. **Run the baseline checks from the repository root:**

   ```bash
   npm test
   node --check <each JavaScript file you changed>
   git diff --check
   ```

   Documentation-only changes get no exemption. Add task-specific checks when
   the change warrants them (for example, `node skills/skill-evals/run-evals.js
   --offline` after editing a skill's eval files).

2. **Read the output of every command.** Running a command is not evidence.
   A completion claim must cite the commands run and their observed results.

3. **Optionally, run the helper instead of typing the baseline commands:**

   ```bash
   node skills/verification-before-completion/verify-completion.js
   ```

   It runs `npm test`, `node --check` on all tracked `.js` files, and `git diff
   --check`, prints each result, and exits non-zero if any check fails. Manual
   evidence is equally valid; the helper is an accelerator, not a gate.

## Failure rule

If any required check fails, or cannot be run at all:

- stop and report the exact check and its output;
- fix the problem within scope if possible, then re-run the full set;
- if it truly cannot be run, say so explicitly and withhold the completion claim.

Do not use qualified "done" language such as "should pass" or "probably fixed"
while a check is unverified.

## Safety rules

- Never present an unrun command as evidence.
- Never treat the helper's exit code alone as proof; inspect its printed output.
- The helper is optional and must never become a CI gate.
- This skill does not modify files, commit, push, or open PRs.
- Directory changes and file edits must still follow `create-worktree-on-change`.

## Boundaries

This skill enforces evidence for completion claims. It is not a test framework,
does not configure CI, does not judge model output, and does not replace the
per-task verification defined in an implementation plan. Use `implementation`
for plan tasks, `skill-evals` for eval-file validation, and `review-and-pr` only
after evidence has been gathered.
