---
type: code
head: e9a94635bf789169a4137e1807bd3449ee37493e
scripted_verdict: pass
advisory_notes: |
  Reviewer: Checks are authoritative, fail closed, and cover runner, aliases,
  report enforcement, and PR gating. Freshness is protected by comparing the
  report head with the current HEAD. All three review types share the baseline
  runner while keeping type-specific config files.
  Devil's Advocate: A shared baseline could hide type-specific gaps; the config
  split keeps future type checks additive. Advisory notes could be mistaken for
  approval; the contract keeps them separate from scripted_verdict and approved.
  The LF-to-CRLF warning from existing files is cosmetic and non-blocking.
approved: true
---
# Review gate report - code

Scripted verdict: **pass** (authoritative; advisory notes cannot change it).
Baseline runner: `verification-before-completion`.
Head: `e9a94635bf789169a4137e1807bd3449ee37493e`.

## Check results

| Check | Result | Output |
| --- | --- | --- |
| npm test | PASS | > opencode-toolkit@0.1.0 test > jest --runInBand  HEAD is now at 49a3830 initial HEAD is now at 49a3830 initial HEAD is now at 49a3830 initial  warning: in the working copy of 'README.md', LF will be replaced by CRLF the next time Git touches it Preparing worktree (new branch 'new-1795297930545') Preparing worktree (new branch 'reuse-1795297930876') Preparing worktree (new branch 'inside-1795297931380')  Test Suites: 10 passed, 10 total Tests:       81 passed, 81 total Snapshots:   0 total Time:        2.219 s, estimated 3 s Ran all test suites. |
| node --check create-and-review.js | PASS | - |
| node --check finish-worktree.js | PASS | - |
| node --check run-review-pr.js | PASS | - |
| node --check skills/create-worktree-on-change/create-worktree.js | PASS | - |
| node --check skills/create-worktree-on-change/ensure-worktree.js | PASS | - |
| node --check skills/review-and-pr/review-pr.js | PASS | - |
| node --check skills/review-gate/check-review-report.js | PASS | - |
| node --check skills/review-gate/run.js | PASS | - |
| node --check skills/skill-authoring/validate-skill-set.js | PASS | - |
| node --check skills/skill-evals/discover.js | PASS | - |
| node --check skills/skill-evals/live.js | PASS | - |
| node --check skills/skill-evals/report.js | PASS | - |
| node --check skills/skill-evals/run-evals.js | PASS | - |
| node --check skills/skill-evals/validate.js | PASS | - |
| node --check skills/verification-before-completion/verify-completion.js | PASS | - |
| node --check test/create-worktree.test.js | PASS | - |
| node --check test/finish-worktree.test.js | PASS | - |
| node --check test/review-gate-alias-validator.test.js | PASS | - |
| node --check test/review-gate-enforcement.test.js | PASS | - |
| node --check test/review-gate-runner.test.js | PASS | - |
| node --check test/review-pr.test.js | PASS | - |
| node --check test/skill-authoring-validator.test.js | PASS | - |
| node --check test/skill-evals-alias.test.js | PASS | - |
| node --check test/skill-evals.test.js | PASS | - |
| node --check test/verification-before-completion.test.js | PASS | - |
| git diff --check | PASS | - |

## Advisory council appendix

**Reviewer**
- Does the gate enforce an authoritative verdict and explicit approval? Yes: the runner writes `scripted_verdict`, and approval is a separate frontmatter flag that only the user can authorize.
- Does the PR workflow reject stale or unapproved reports? Yes: `checkReviewReport` verifies `approved: true`, `scripted_verdict: pass`, and that `head` matches the current HEAD.
- Are all three review types covered? Yes: code, design, and specs use dedicated check configs and the same read-only runner.

**Devil's Advocate**
- Critique: one shared baseline across all types could miss type-specific gaps. Improvement: keep separate `checks/<type>.json` configs so type-specific checks can be added without changing runner behavior.
- Critique: advisory notes might be read as approval. Improvement: the report contract documents that notes cannot change `scripted_verdict` or `approved`, and tests cover the enforcement path.
- Critique: the test output includes LF-to-CRLF warnings. Improvement: treat as cosmetic and non-blocking because all checks pass and no source behavior is affected.

_Advisory only: these notes cannot change `scripted_verdict` or set `approved`._
