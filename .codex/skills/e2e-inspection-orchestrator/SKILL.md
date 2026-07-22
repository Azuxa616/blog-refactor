---
name: e2e-inspection-orchestrator
description: Run the complete local E2E inspection lifecycle: enforce a clean Git worktree, update the branch-based checklist, execute browser tests, obtain user-approved remediation scope, and loop through repair, scoped retest, and result backwrite until all approved findings are verified. Use this as the default entry point whenever the user asks for a full E2E巡检, complete UI audit, regression inspection, or inspection-to-fix workflow.
compatibility: Requires filesystem, shell, browser control, and the e2e-checklist-update, e2e-test-execution, and e2e-issue-remediation skills.
---

# E2E Inspection Orchestrator

This is a project-level skill. Treat the repository containing this skill as the only default scope for inspection, repair, evidence, and result documents.

This is the single entry point for the full inspection lifecycle. It protects the user's worktree, keeps test documentation aligned with the active branch, and never starts code repair without explicit approval of both finding IDs and repair approaches.

## Required workflow

### 1. Worktree gate

1. Read applicable `AGENTS.md` and inspect `git status --short`, current branch, and `HEAD`.
2. If the worktree is clean, continue.
3. If any tracked or untracked files are present, stop before checklist creation or testing. Show the exact paths grouped as tracked modifications, staged changes, and untracked files.
4. Discuss the user's choice for those files: discard, commit, stash, or keep them and explicitly authorize a non-clean baseline. Do not choose, delete, commit, stash, or proceed on the user's behalf.
5. Recheck status after the user resolves the choice. Continue only with a clean worktree or explicit non-clean-baseline authorization recorded in the checklist and result document.

### 2. Inspection

1. Invoke `e2e-checklist-update` against the active branch and `HEAD`.
2. Invoke `e2e-test-execution` in `full` mode using the resulting checklist.
3. Present a concise, severity-ordered inspection summary: result path, baseline, build/server limitation, counts, every non-pass test ID, evidence links, and a concrete repair proposal for each repairable failure.
4. Ask the user to explicitly select which IDs to repair and confirm the corresponding repair proposal. Do not call the remediation skill until that confirmation arrives.

### 3. Approved repair loop

For the user-approved IDs only:

1. Invoke `e2e-issue-remediation` with the original result document, IDs, and approved approaches.
2. It changes code, runs scoped retests, creates a new dated run directory, and backwrites the original result's **修复情况** cells.
3. Read the scoped retest. If an approved ID still fails, summarize the remaining root cause and next repair proposal; obtain user confirmation before another repair attempt that changes the approach or scope.
4. Repeat repair → scoped retest → backwrite until every user-approved ID is `已修复并验证`, or the user explicitly stops/deprioritizes it.
5. For every original non-pass ID that the user did not approve, write `用户未指定修复，无需修复` in its **修复情况** cell. Do not fix it incidentally or remove its evidence.

## Cross-skill invariants

- Keep baseline branch, full SHA, checklist version, test IDs, and run dates traceable across all documents.
- Use a new dated run directory for every full run and every scoped retest; never overwrite prior evidence.
- Preserve historical failures in their original result rows. Verification lives in a linked retest record and the repair-status cell.
- Order findings by `P0`, `P1`, `P2`, `P3`, then `P4`.
- Browser testing must respect an explicitly requested browser surface. Build failures, external dependency failures, inactive conditional UI, and missing content fixtures must be clearly distinguished.

## Final handoff

Report the checklist, original run, every retest run, changed files, approved IDs that were verified fixed, and unapproved IDs marked as not requested. State whether the lifecycle ended because all approved issues passed or because the user intentionally stopped remaining work.
