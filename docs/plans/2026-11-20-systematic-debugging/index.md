# Plan — Systematic debugging skill

## Summary

Adds a standalone, guidance-only `systematic-debugging` skill that requires a
structured investigation before any fix: reproduce → isolate → root cause →
failing repeatable command → fix → verify → hand off to
`verification-before-completion`. The regression command is a hard stop before
the fix. Evidence is cited inline; no helper script or new report format is
introduced. Body-only pointers keep trigger boundaries distinct.

## Inputs

- [Idea and solution](../../ideas/2026-11-20-systematic-debugging.md)
- [Architecture](../../../ARCHITECTURE.md)

## Milestones

- **M1 — Skill artifact:** the skill definition and its eval files exist and
  validate.
- **M2 — Integration and documentation:** related skills point to the new
  boundary and repository docs describe it.
- **M3 — Verification:** all checks pass and every artifact is consistent.

## Task list

| # | Task | Milestone | Size | Dependencies |
| --- | --- | --- | --- | --- |
| 01 | [Skill definition and eval files](01-skill-and-evals.md) | M1 | M | none |
| 02 | [Cross-links and docs](02-cross-links-docs.md) | M2 | S | 01 |
| 03 | [Final verification](03-final-verification.md) | M3 | S | 01, 02 |

## Dependency order

Strictly sequential: 01 → 02 → 03. No parallel tracks; task 03 must run fresh
after the earlier artifacts are complete.

## Decision log

1. **Evidence record.** Challenge: a saved report file adds a new convention.
   Decision: cite evidence inline. Alternatives: `docs/debug-notes/`; reporting
   script. Rationale: keeps the skill guidance-only.
2. **Cross-links.** Challenge: agents need a route into debugging without
   overlapping triggers. Decision: body-only pointers in `implementation` and
   `verification-before-completion`. Alternatives: verification only; all skills.
   Rationale: covers entry and exit points with minimal edits.
3. **Approach.** Challenge: guidance alone can skip the key invariant.
   Decision: hard-stop regression checkpoint. Alternatives: optional helper;
   shared protocol; embedded guidance. Rationale: no new tooling, but the
   invariant is unmistakable.
4. **Regression definition.** Challenge: not every bug has a Jest entry point.
   Decision: any explicit, repeatable failing command. Alternatives: Jest only;
   inline assertion. Rationale: flexibility without losing repeatability.
5. **Architecture impact.** Challenge: the new convention should be visible in
   the source of truth. Decision: add a layout entry and a short debugging
   conventions section. Alternatives: layout only; no change. Rationale: future
   work can find the invariant without reading every skill.
6. **Task structure.** Challenge: avoid unverifiable mega-tasks. Decision: three
   tasks. Alternatives: four; two. Rationale: skill and evals stay together;
   docs and verification remain independently checkable.
7. **Devil's Advocate caveat.** Challenge: "test first" is the most likely
   instruction to be skipped. Decision: task 01 must include a negative eval for
   fixing before a failing command is established. Rationale: makes the
   invariant testable at the eval level.

## Risks and assumptions

- Risk: trigger overlap with `implementation` or `verification-before-completion`.
  Mitigation: body-only pointers and explicit negative boundaries.
- Risk: the hard stop becomes a soft reminder. Mitigation: explicit checkpoint
  language and a negative eval case.
- Risk: unbounded reproduction effort. Mitigation: agent-judged effort with
  attempts reported inline.
- Assumption: any repeatable failing command qualifies as the regression check.
- Assumption: inline evidence is sufficient; no saved report is required.

## Open questions / next steps

- None. After review approval, a separate handoff decision is required before
  implementation begins.
