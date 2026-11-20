---
name: systematic-debugging
description: >-
  Use before proposing or applying a fix for any bug, failing test, or unexpected
  behavior, including flaky and hard-to-reproduce issues. Requires reproduce,
  isolate, root cause, a failing repeatable command, fix, and verify, with a hard
  stop before the fix. Not a test framework, not CI, not a model judge, not a
  code-approval gate, and not a replacement for implementation's plan tasks.
---

# Systematic debugging

## When to use

- Before proposing or applying a fix for a bug or failing test.
- When behavior differs from what the code or documentation says it should do.
- For flaky or intermittent failures, even if they cannot yet be reproduced on
  demand.
- After a previous fix failed and the cause is still uncertain.

## Hard-stop sequence

Do not skip or reorder these steps:

1. **Reproduce.** Run the failing case and capture the observed output.
2. **Isolate.** Reduce it to the smallest case that still fails; identify what
   changed and what did not.
3. **Root cause.** Explain why the failure happens. "Likely cause" is not enough.
4. **Failing command checkpoint.** Produce a command that fails before the fix.
   It must be explicit and repeatable; it need not be a Jest test. Record the
   command and its observed failing output. **Stop here until this exists.**
5. **Fix.** Change only what the root cause requires.
6. **Verify.** Re-run the same command and confirm it now passes. Then follow
   `verification-before-completion` before claiming the work is done.

A fix proposed before step 4 is speculative and is not allowed.

## Unreproducible failures

If the failure cannot be reproduced after reasonable effort:

- stop and report what was tried and what was observed;
- do not propose a fix or mark the issue resolved;
- do not close it as a non-issue unless the evidence supports that conclusion.

Effort is judged by the situation; there is no fixed attempt count. Make the
judgment explicit in the report.

## Evidence and proportionality

- Cite evidence inline in the response; do not introduce a new report file or
  format.
- Keep the record concise for trivial failures, but never skip root cause and
  the failing-command checkpoint.
- Running a command is not evidence unless its output was read.

## Safety rules

- Never apply a fix before the root cause and failing command are established.
- Never treat an unrun or passing command as the pre-fix failing baseline.
- Never claim completion without the post-fix verification evidence.
- This skill does not commit, push, open PRs, or configure CI.
- File changes must still follow `create-worktree-on-change`.

## Boundaries

This skill investigates and repairs failures. It is not a test framework, does
not configure CI, does not judge model output, is not a code-approval gate, and
does not replace the per-task verification in an implementation plan. Use
`implementation` for plan work and `verification-before-completion` for the
final completion evidence.
