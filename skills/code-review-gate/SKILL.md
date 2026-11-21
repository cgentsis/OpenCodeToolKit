---
name: code-review-gate
description: >-
  Use before handoff or PR when a repeatable, read-only review of code is needed
  with a standardized report and an explicit approval flag. Triggers on "review
  this code", "gate this code", or "code-review-gate". Alias of review-gate with
  the type fixed to code; all work is delegated to the core skill.
alias_of: review-gate
type: code
---

# Code Review Gate

Alias of [`review-gate`](../review-gate/SKILL.md) with the type fixed to `code`.
It adds no logic of its own: follow the core skill for the workflow, council
protocol, and report contract.

From the repository root, delegate with:

```bash
node skills/review-gate/run.js --type code
```
