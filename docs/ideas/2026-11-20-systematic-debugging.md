# Systematic debugging

## Description

A repo-local `systematic-debugging` skill that requires a structured
investigation before any fix is proposed for a bug, failing test, or unexpected
behavior. It fires whenever an agent is about to diagnose or repair a failure,
including flaky or hard-to-reproduce issues, and blocks speculative fixes. The
required sequence is: reproduce, isolate, identify the root cause, write a
failing regression test, apply the fix, and verify. If the failure cannot be
reproduced after reasonable effort, the skill stops and reports the attempts and
evidence instead of guessing. Before any completion claim, it hands off to
`verification-before-completion`.

## Goals and success metrics

- Every fix cites a reproduction, the isolated root cause, a failing regression
  test, and post-fix verification output.
- No fix is proposed or applied before the root cause is established.
- Unreproducible failures are reported with evidence, not silently closed or
  patched speculatively.
- The skill covers bugs, test failures, and unexpected behavior, including
  intermittent issues.
- The investigation record is concise in proportion to the issue; it does not
  become ceremony for trivial failures.
- Eval files validate triggers and negative boundaries.

## Audience

- Contributors and agents diagnosing bugs, failing tests, or unexpected behavior.
- Reviewers who need to see why a fix was chosen and what proves it works.
- Maintainers who want a consistent debugging habit across the repository.

## Constraints and non-goals

Constraints:

- Required sequence: reproduce → isolate → root cause → failing regression test
  → fix → verify.
- A failing regression test must exist before the fix is applied.
- If reproduction fails after reasonable effort, stop and report the attempts
  and evidence; do not propose a fix.
- Completion claims must follow `verification-before-completion`.
- Worktree-first applies to any file change made while following the skill.
- The artifact is a `SKILL.md` plus eval files; no new dependency is assumed.

Non-goals:

- Not a test framework or CI configuration.
- Not a code-approval gate or a replacement for code review.
- Not a replacement for `implementation`'s per-task verification.
- Not a model judge or a scorer of model output.
- Not a mechanism for silently auto-fixing failures.

## Assumptions

- Regression tests can be added in this repository.
- Agents executing the skill can run commands, read output, and edit files in a
  worktree.
- Existing skills (`implementation`, `verification-before-completion`) remain the
  owners of plan execution and completion evidence.
- "Reasonable effort" to reproduce is judged by the agent and reported openly;
  it is not a fixed attempt count.

## Decision log

1. **Trigger scope.** Challenge: a narrow skill would leave runtime bugs and
   flaky behavior unguarded. Decision: cover all bugs, test failures, and
   unexpected behavior. Alternatives: only reproducible failures; only failing
   automated tests. Rationale: the failure mode — speculative fixing — is the
   same everywhere.
2. **Evidence before a fix.** Challenge: "likely cause" permits guesswork and
   misses regressions. Decision: require reproduce → isolate → root cause →
   failing regression test before the fix. Alternatives: likely cause plus fix;
   investigation notes only. Rationale: the regression test is durable proof
   of both the bug and the repair.
3. **Unreproducible bugs.** Challenge: pressure to patch an issue that cannot be
   reproduced. Decision: stop and report attempts and evidence; no fix.
   Alternatives: labeled hypothesis; close as non-issue. Rationale: consistent
   with `verification-before-completion` — no claim without evidence.
4. **End of scope.** Challenge: stopping at diagnosis adds handoffs; advising
   only is too passive. Decision: carry through fix and verification, then hand
   off to `verification-before-completion` before claiming done. Alternatives:
   diagnosis only; advice only. Rationale: keeps ownership clear while avoiding
   unsupported completion claims.
5. **Devil's Advocate caveat.** Challenge: a mandatory investigation record can
   become bureaucracy for trivial failures. Decision: keep the evidence record
   concise but never skip root cause and regression coverage. Alternatives:
   exempt small fixes entirely. Rationale: proportionality without weakening the
   bar.

## Open questions / next steps

- How to record investigation evidence compactly without adding new tooling.
- Whether related skills need body-only pointers, and if so which ones.
- Both questions are resolved during solution brainstorming.

## Council sign-off

- Brainstormer: accepts the trigger scope, required sequence, unreproducible-bug
  behavior, and handoff to `verification-before-completion`.
- Devil's Advocate: signs off with the caveat that the evidence record must stay
  proportionate and must never become ceremony.

## Solution

### Chosen approach

A standalone, guidance-only `skills/systematic-debugging/` skill containing
`SKILL.md` plus eval files. No helper script, no new file format, and no shared
protocol file. The skill defines a hard-stop sequence: reproduce → isolate →
root cause → **regression test checkpoint** → fix → verify → hand off to
`verification-before-completion` before any completion claim.

The regression-test checkpoint is explicit and blocking: the fix must not be
applied until a repeatable command has been observed failing before the fix. The
command need not be a Jest test; any explicit, repeatable command that fails
before and passes after qualifies. Evidence is cited inline in the agent's
response rather than written to a new artifact.

`implementation` and `verification-before-completion` each gain a body-only
pointer so triggers stay distinct. Frontmatter descriptions are unchanged.

### Alternatives considered

- **Skill + optional `debug-checklist.js` helper:** rejected — adds tooling the
  idea excluded and conflicts with the inline-evidence decision; even a
  print-only helper would be extra machinery for one checkpoint.
- **Shared debugging protocol in `skills/_shared/`:** rejected — a new
  convention and single point of failure for one consumer.
- **Embedded guidance in existing skills:** rejected — violates the standalone
  skill requirement and blurs trigger boundaries.
- **Guidance without an explicit checkpoint:** rejected — "write a regression
  test" can be quietly skipped under time pressure.

### Trade-offs

- No mechanical enforcement; the checkpoint and evals must carry the invariant.
- Inline evidence is lightweight but less durable than a saved report.
- Flexible regression commands support more bug types but require the agent to
  judge what counts as repeatable.

### Risks and mitigations

- **Speculative fixes:** mandatory reproduction, root cause, and failing-command
  checkpoint before any fix is proposed.
- **Endless investigation:** agent-judged effort with the attempts reported
  inline; no fixed cap, no silent abandonment.
- **Trigger overlap:** body-only pointers, not frontmatter changes, in the two
  related skills.
- **Trivial-fix ceremony:** evidence record stays concise, but root cause and
  regression coverage are never skipped.

### High-level steps or components

1. `skills/systematic-debugging/SKILL.md` — trigger-focused frontmatter with
   negative boundaries, the hard-stop sequence, the regression-test checkpoint,
   unreproducible-bug handling, inline evidence rule, and the handoff to
   `verification-before-completion`.
2. `skills/systematic-debugging/evals/evals.json` and
   `evals/trigger-evals.json` — cases covering speculative fixes, skipped
   regression tests, unreproducible bugs, and negative boundaries.
3. Body-only pointers in `skills/implementation/SKILL.md` and
   `skills/verification-before-completion/SKILL.md`.
4. `skills/README.md` and `ARCHITECTURE.md` documentation updates.

### Assumptions

- Any explicit, repeatable failing command qualifies as the regression check.
- Inline evidence is sufficient; no saved report is required.
- Agents can run commands and edit files in a worktree.
- Existing skills retain ownership of plan execution and completion evidence.

### Decision log

1. **Evidence record.** Challenge: a saved report adds a new convention.
   Decision: inline evidence only. Alternatives: `docs/debug-notes/` file;
   reporting script. Rationale: keeps the skill guidance-only.
2. **Cross-links.** Challenge: implementation agents need a route to debugging
   without overlapping triggers. Decision: body-only pointers in `implementation`
   and `verification-before-completion`. Alternatives: verification only; all
   skills. Rationale: covers both entry and exit points with minimal edits.
3. **Approach.** Challenge: guidance alone can skip the key invariant.
   Decision: guidance plus a hard-stop regression-test checkpoint. Alternatives:
   optional helper; shared protocol; embedded guidance. Rationale: no new
   tooling, but the invariant is unmistakable.
4. **Regression definition.** Challenge: not every bug has a Jest entry point.
   Decision: any repeatable failing command. Alternatives: Jest only; inline
   assertion. Rationale: flexibility without losing repeatability.
5. **Reproduction effort.** Challenge: an unbounded investigation could stall.
   Decision: agent judges effort and reports attempts. Alternatives: fixed cap;
   no bound. Rationale: transparency over arbitrary ritual.

### Open questions / next steps

- None. All idea-stage open questions are resolved.
- Hand off to `implementation-planning` for an execution plan.

### Council sign-off

- Brainstormer: accepts the guidance-only skill with a hard-stop regression
  checkpoint, inline evidence, and the two body-only pointers.
- Devil's Advocate: signs off with the caveat that the checkpoint must be a hard
  stop before the fix, not a soft reminder.
