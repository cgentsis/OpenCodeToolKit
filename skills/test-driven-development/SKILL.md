---
name: test-driven-development
description: >-
  Use when implementing executable behavior, when code was written before a
  failing test, or when red/green/refactor evidence is missing. Requires a
  failing test before production code and records command-plus-output evidence
  in plan task status. Not for root-cause debugging, choosing a test framework,
  writing production code itself, or replacing review.
---

# Test-driven development

## When to use

- An implementation task changes executable behavior and needs a test-first
  path.
- Code has already been written before a failing test, or the red → green
  evidence is missing.
- A task status needs a consistent red/green/refactor record.

## When not to use

- To diagnose a bug before a fix. Use `systematic-debugging`.
- To choose a test runner, coverage tool, or test framework.
- To write production code for the user; this skill governs the loop.
- To replace `verification-before-completion`, `implementation`, or review.

## Input

1. A plan task whose status will receive the evidence.
2. The behavior to be implemented and a way to observe a failing test.
3. An existing test runner chosen by the project; this skill does not pick one.

## Hard gate

Before writing production code for executable behavior:

1. **Red** — write or change a test that expresses the desired observable
   behavior. Run it and record the command and the observed failure.
2. **Green** — write the smallest production change that makes that test pass.
   Run it and record the command and the observed pass.
3. **Refactor** — improve structure without changing behavior, then re-run the
   green check. Record what changed and that the check stayed green.

Do not mark the task complete while the test is missing, passing before the
production change, or unsupported by recorded output.

## Evidence contract

Add a `### TDD Evidence` section to the task's `## Status`. Use one of these
two forms.

For executable behavior changes:

```markdown
### TDD Evidence

Red: `npm test -- <target>` → FAIL: <observed failure>
Green: `npm test -- <target>` → PASS: <observed pass>
Refactor: <short note; green check stayed green>
```

For docs/config-only changes with no executable behavior:

```markdown
### TDD Evidence

Exempt: docs/config-only
Reason: <one-line reason>
```

Commands and observed results are required. A checkbox, a bare claim, or an
empty description is not evidence.

## Validator

`check-tdd-evidence.js` is the single source of truth for evidence validity.
`implementation` runs it before a task can be marked complete:

```bash
node skills/test-driven-development/check-tdd-evidence.js <task-file>
```

A non-zero result blocks completion. `review-and-pr` reuses the same validator
over changed plan task files as a backstop; it does not define a second format.

## Boundaries and safety

- Worktree first: before changing any file, use `create-worktree-on-change`.
- No new runtime dependency; the validator uses Node built-ins only.
- Does not replace `systematic-debugging`, mandate a framework, or write the
  production change itself.
- Completion claims still require `verification-before-completion`.

## Verification

Before marking a task complete, confirm the `### TDD Evidence` section is
present, the validator exits 0, and the task's listed checks pass with observed
results.
