---
name: e2e-issue-remediation
description: Repair only user-approved E2E findings from a result document, run scoped regression checks, and backwrite repair status without silently changing unrelated findings. Use when the user names failing test IDs, approves proposed fixes, or asks to remediate browser inspection results.
compatibility: Requires filesystem, shell, and the e2e-test-execution skill for scoped browser retests.
---

# E2E Issue Remediation

This is a project-level skill. Modify only the current repository and keep every repair and retest record inside it.

Turn explicitly approved E2E failures into minimal code changes and verified repair records. This skill never treats a result document as blanket authorization to fix every finding.

## Inputs

- Required: result document path and explicit approved test IDs.
- Required for each approved ID: user-approved repair approach, or permission to propose and wait for one.
- Optional: existing retest run path and issue/commit links for the repair cell.

## Rules of engagement

1. Read applicable `AGENTS.md`, the checklist, the result document, failure evidence, and the implementation paths relevant to the approved ID.
2. Reproduce or otherwise verify the exact failure before changing code. Keep the fix focused on its root cause.
3. Do not modify product behavior for any unapproved test ID. If an approved fix incidentally affects another finding, report it and leave that finding's repair status unchanged until it is explicitly retested and approved.
4. Do not use destructive Git recovery commands. Preserve user changes and pre-existing dirty files.
5. Run the narrowest suitable validation first, then invoke `e2e-test-execution` in `retest` mode for the approved IDs. A passing build alone is not a browser-fix verification.

## Repair-loop output

For each approved ID, maintain this state:

| 状态 | 含义 |
| --- | --- |
| `待修复` | User approved it; no code change has been verified. |
| `已修复待复测` | Code changed; scoped retest has not yet passed. |
| `已修复并验证` | Scoped retest passed; link its new run document. |
| `未修复` | Attempt did not fix the issue; state blocker or next proposed approach. |

After each scoped retest:

- Update the original result document's **修复情况** cell with the state, relevant commit (if any), and a relative link to the retest `results.md`.
- Keep the original **测试情况** as the historical observation; do not replace a failure with `PASS`.
- In the new retest document, record the current result for each scoped ID.
- For result rows that the user explicitly declines to fix, write `用户未指定修复，无需修复` in **修复情况** and do not edit product code for them.

## Completion report

List changed files, the scoped retest path, IDs verified fixed, IDs still failing, and IDs intentionally not fixed. If any approved issue remains, propose the next concrete repair and wait for approval before expanding scope.
