# Verification before completion

## Description

A repo-local `verification-before-completion` skill that requires observed
evidence before any claim that work is done, fixed, or passing. It fires before
any completion claim or handoff, including ad-hoc fixes outside the plan
pipeline. The standard is to run the repository baseline checks (`npm test`,
`node --check`, `git diff --check`) plus checks specific to the change, read
their output, and only then make the claim. If a check fails or cannot be run,
the skill stops and reports the exact check and output; it does not allow a
qualified "done".

## Goals and success metrics

- Every completion claim cites the commands that were run and their observed
  output.
- No completion claim is made while a required check fails or could not run.
- The skill applies to ad-hoc fixes and debugging, not only to plan-driven work.
- The skill composes with `implementation`, `review-and-pr`, and
  `finish-worktree` without duplicating their responsibilities.
- Eval files validate the skill's trigger boundaries and negative cases.

## Audience

- Contributors and agents about to report a task, fix, or handoff as complete.
- Reviewers relying on completion claims when deciding whether to merge.
- Maintainers who want a consistent verification habit across the repository.

## Constraints and non-goals

Constraints:

- Baseline checks are `npm test`, `node --check`, and `git diff --check`.
- Task-specific checks are added when the change warrants them.
- Command output must be read and inspected; running a command is not evidence
  by itself.
- A failed or unavailable check blocks the completion claim until resolved or
  explicitly reported as unverified.
- The skill is a `SKILL.md` plus eval files; no new dependency or scripted gate.
- Worktree-first applies to any file change made while following the skill.

Non-goals:

- Not a test framework or CI configuration.
- Not a replacement for `implementation`'s per-task verification.
- Not a model judge or a scorer of model output.
- Not a mechanism for silently auto-fixing failures.

## Assumptions

- The three baseline commands are meaningful and affordable for this
  repository.
- Agents executing the skill can run shell commands and read their output.
- The skill is guidance with trigger evals, not executable tooling.

## Decision log

1. **Evidence bar.** Challenge: "verified" could mean anything from a cursory
   command to a full suite. Decision: baseline checks plus task-specific ones.
   Alternatives: task-specific only; scripted gate with a report. Rationale:
   consistent minimum bar without new machinery.
2. **Trigger scope.** Challenge: a narrow skill would leave ad-hoc work
   unguarded. Decision: fire before any completion claim or handoff.
   Alternatives: plan pipeline only; bug fixes only. Rationale: the failure
   mode is universal.
3. **Failed evidence.** Challenge: qualified "done" claims erode trust.
   Decision: stop and report; withhold the claim. Alternatives: best effort with
   a caveat; auto-fix silently. Rationale: explicit uncertainty is more useful
   than an ambiguous success signal.
4. **Council caveat.** Challenge: verification theater and duplicate gates.
   Decision: require reading command output; avoid re-running implementation's
   task verification as a second slow gate. Alternatives: none accepted.
   Rationale: evidence must be real and proportionate.

## Open questions / next steps

- Whether to allow a documented exception for documentation-only changes.
- How to reference this skill from `implementation`, `review-and-pr`, and
  `finish-worktree` without creating overlapping triggers.
- Both questions are resolved during solution brainstorming.

## Council sign-off

- Brainstormer: accepts the evidence bar, trigger scope, and failure behavior.
- Devil's Advocate: signs off with the caveat that output must be inspected and
  the skill must not duplicate `implementation`'s verification.

## Solution

### Chosen approach

A self-contained `skills/verification-before-completion/` skill with:

- `SKILL.md` — trigger-focused frontmatter with negative boundaries, the
  evidence bar (baseline plus task-specific checks), the failure rule (stop and
  report; no qualified "done"), and an explicit requirement to inspect command
  output.
- `verify-completion.js` — an **optional** helper using only Node built-ins that
  runs the baseline checks in one step, prints their output, and exits non-zero
  if any check fails. The skill accepts manually gathered evidence too; the
  script is an accelerator, not a gate.
- `evals/evals.json` and `evals/trigger-evals.json` — coverage for the skill's
  triggers and negative boundaries.

`implementation`, `review-and-pr`, and `finish-worktree` each gain a one-line
pointer in their **bodies**, not their frontmatter, so triggers stay distinct.
No shared protocol file is introduced. Documentation-only changes get no
exemption from the baseline checks.

### Alternatives considered

- **Guidance only (A alone):** rejected — weaker evidence capture; the optional
  script is cheap and useful.
- **Required scripted gate (B as gate):** rejected — contradicts the idea's
  "no scripted gate" constraint.
- **Shared verification protocol under `skills/_shared/`:** rejected — new
  convention and cross-file edits for little gain.
- **Embed in existing skills only:** rejected — fails the ad-hoc-work
  requirement.

### Trade-offs

- Two new implementation files plus eval files and three small doc pointers.
- The script duplicates the baseline command list, so it must stay in sync with
  the repository's verification conventions.
- Because the script is optional, evidence quality still depends on following
  the skill's checklist.

### Risks and mitigations

- **Command drift:** keep the baseline commands in one constant in the script;
  docs point to the skill rather than restating commands.
- **Verification theater:** the skill requires reading and citing observed
  output, not just running commands.
- **Trigger overlap:** cross-links live in skill bodies only; frontmatter
  descriptions are unchanged.
- **Missing dependencies in fresh worktrees:** the script reports a clear error
  when Jest is unavailable instead of treating it as a pass.
- **False confidence:** the script exits non-zero on any failed check and the
  skill treats that as blocking.

### High-level steps or components

1. `SKILL.md` with frontmatter, trigger conditions, evidence checklist, failure
   rule, and negative boundaries.
2. Optional `verify-completion.js` helper with a single baseline command list,
   clear output, and non-zero exit on failure.
3. Eval files covering trigger and no-trigger queries.
4. Body-only verification pointers in `implementation`, `review-and-pr`, and
   `finish-worktree`.
5. `skills/README.md` documentation and an `ARCHITECTURE.md` note under
   verification conventions.
6. Jest tests for the helper's success, failure, and missing-dependency paths,
   plus `skill-evals` validation.

### Assumptions

- Node.js is available; the helper uses only built-ins.
- Baseline checks are `npm test`, `node --check`, and `git diff --check`.
- No exemption for documentation-only changes.
- The helper is optional and does not become a CI gate.

### Decision log

1. **Helper role.** Challenge: script versus no script. Decision: optional
   accelerator. Alternatives: required gate; guidance only. Rationale: better
   evidence capture without changing the idea's constraint.
2. **Doc-only exception.** Challenge: cost versus simplicity. Decision: no
   exemption. Alternatives: documented exception; agent discretion. Rationale:
   the baseline is cheap and a single rule is easier to eval.
3. **Cross-links.** Challenge: discoverability versus trigger overlap.
   Decision: body-only pointers. Alternatives: shared protocol; none.
   Rationale: clear references without changing frontmatter triggers.
4. **Council caveat.** Challenge: verification theater and de facto gates.
   Decision: require inspected output; keep the helper advisory. Alternatives:
   none accepted. Rationale: evidence must be real and proportionate.

### Open questions / next steps

- None blocking. Move to implementation planning for the helper's interface,
  task breakdown, and exact verification notes.

### Council sign-off

- Brainstormer: accepts the hybrid approach and rejected alternatives as
  recorded.
- Devil's Advocate: signs off with the caveat that the helper remains optional
  and command output must still be inspected.
