---
name: specs-review-gate
description: >-
  Use before handoff when a repeatable, read-only review of a specification is
  needed with a standardized report and an explicit approval flag. Triggers on
  "review the specs", "review this spec", or "specs-review-gate". Alias of
  review-gate with the type fixed to specs; all work is delegated to the core
  skill.
alias_of: review-gate
type: specs
---

# Specs Review Gate

Alias of [`review-gate`](../review-gate/SKILL.md) with the type fixed to `specs`.
It adds no logic of its own: follow the core skill for the workflow, council
protocol, and report contract.

From the repository root, delegate with:

```bash
node skills/review-gate/run.js --type specs
```
