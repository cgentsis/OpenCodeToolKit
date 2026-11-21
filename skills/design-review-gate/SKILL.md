---
name: design-review-gate
description: >-
  Use before handoff when a repeatable, read-only review of a design is needed
  with a standardized report and an explicit approval flag. Triggers on "gate
  this design", "review this design", or "design-review-gate". Alias of
  review-gate with the type fixed to design; all work is delegated to the core
  skill.
alias_of: review-gate
type: design
---

# Design Review Gate

Alias of [`review-gate`](../review-gate/SKILL.md) with the type fixed to
`design`. It adds no logic of its own: follow the core skill for the workflow,
council protocol, and report contract.

From the repository root, delegate with:

```bash
node skills/review-gate/run.js --type design
```
