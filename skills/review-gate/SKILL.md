---
name: review-gate
description: >-
  Use after an artifact is produced and before handoff or PR when a repeatable,
  read-only review of code, a design, or a specification is needed with a
  standardized report and an explicit approval flag. Triggers on "review this
  code", "gate this design", "review the specs", or the code-review-gate,
  design-review-gate, and specs-review-gate aliases. Runs deterministic scripted
  checks first, then a mandatory advisory council loop, and writes only a review
  report under docs/reviews/. Never edits source files, commits, pushes, or
  calls gh. Not for fixing issues (implementation / systematic-debugging), not
  for opening PRs (review-and-pr), and not a CI gate.
aliases: [code-review-gate, design-review-gate, specs-review-gate]
---

# Review Gate

Read `../_shared/council-protocol.md` (`skills/_shared/council-protocol.md` from
the repository root) before starting. It defines the question loop and how
council conversations run. This file defines only this skill's types, CLI,
workflow, and report contract; do not restate the shared protocol here.

## When to use

- After an artifact (code, design, or spec) is produced and before it is handed
  off or considered for PR.
- When a repeatable, auditable review report with an explicit approval flag is
  required, including the approved, HEAD-fresh report that `review-and-pr`
  consumes for code.
- When triggered through an alias — `code-review-gate`, `design-review-gate`, or
  `specs-review-gate` — each of which fixes the type and delegates here. The
  frontmatter `aliases:` list is the machine-readable registry of those wrappers.

## When not to use

- To fix, patch, or edit source files. Route fixes to `implementation` or
  `systematic-debugging` and re-run the gate afterward.
- To commit, push, or open a PR. Use `review-and-pr` only after this gate has
  produced an approved report.
- As a replacement for `verification-before-completion` or the council skills'
  hard gates; this gate consumes their results rather than replacing them.
- To author or change the artifact under review, or as a CI/remote check. The
  gate is local and advisory until a user approves the report.

## CLI

Run from the repository root:

```bash
node skills/review-gate/run.js --type code
node skills/review-gate/run.js --type design --out docs/reviews/my-design.md
node skills/review-gate/run.js --help
```

The runner loads `checks/<type>.json`, runs the configured scripted checks (the
baseline `verification-before-completion` checks for every type), records the
current `HEAD`, and writes a Markdown report with YAML frontmatter. It is
read-only with respect to source files and never calls `gh`.

### Options

| Option | Argument | Default | Purpose |
| --- | --- | --- | --- |
| `--type` | `code` \| `design` \| `specs` | — | Review type; selects the check config and the default report path. |
| `--out` | `<path>` | `docs/reviews/<type>.md` | Report output path. |
| `--help` | — | — | Print usage and exit. |

A missing or invalid `--type` fails before any report is written. When checks
fail, the runner writes a report with `scripted_verdict: fail` and exits
non-zero.

## Workflow

1. **Scripted checks first.** Run the CLI above. Its `scripted_verdict`
   (`pass`/`fail`) is authoritative; never reinterpret, override, or edit it. If
   it is `fail`, the review is not approvable: report the failing checks, route
   fixes to `implementation` or `systematic-debugging`, and re-run the gate
   against the new HEAD.
2. **Mandatory council loop (advisory).** For every type, run the shared
   council-protocol question loop with these roles:
   - **Reviewer** — examines the artifact and check results for correctness,
     completeness, and consistency within the review type, and asks the
     questions.
   - **Devil's Advocate** — challenges the verdict and the artifact, exposes
     hidden assumptions and contradictions, and offers a concrete improvement
     with each critique.
   Append the council's questions and findings to the report's advisory section
   (`advisory_notes` frontmatter and the advisory appendix). Council notes are
   **advisory only**: they can never change `scripted_verdict` or approve a
   report on their own. The hard gate still requires explicit user approval.
3. **Record approval.** Only after (a) every scripted check passes
   (`scripted_verdict: pass`) **and** (b) the user explicitly approves, edit the
   report's YAML frontmatter to set `approved: true`. Do not change
   `scripted_verdict`, `head`, or `type` — leave them as the runner wrote them.
   Without explicit user approval the report stays `approved: false`.

## Report contract

The runner writes Markdown with YAML frontmatter containing:

| Field | Meaning |
| --- | --- |
| `type` | Review type (`code`, `design`, or `specs`). |
| `head` | Git HEAD the checks ran against; used by `review-and-pr` for freshness. |
| `scripted_verdict` | `pass` or `fail` from the scripted checks; authoritative. |
| `advisory_notes` | Council questions and findings; advisory only. |
| `approved` | `false` on the drafted report; set to `true` only as in step 3. |

The body holds the check-results table and an advisory council appendix. The
council cannot change `scripted_verdict`.

## Boundaries and safety

- The review report is the **only** file this skill writes or edits. Never
  create, edit, or delete source files, and never write outside the report path.
- Never call `gh` and never commit, push, or open a PR.
- Worktree-first still applies: create or enter a worktree before writing the
  report (`create-worktree-on-change`).
- Passing scripted checks alone never auto-approve; explicit user approval is
  required alongside them.

## Verification

Before presenting the review as complete, confirm the report exists at the
expected path, read it back to confirm its frontmatter fields and advisory
section, and confirm no source file was modified (`git status --short`). Follow
`verification-before-completion` before claiming completion.
