---
name: e2e-test-execution
description: Execute a versioned local browser E2E inspection checklist and write a dated result document with screenshots for failures. Use whenever a checklist already exists and the user asks to run, rerun, verify, or document route, UI, interaction, Markdown/image, responsive, or performance tests.
compatibility: Requires filesystem, shell, local-server, and browser control. Use the webapp-testing skill for server lifecycle guidance and the explicitly requested browser skill for UI testing.
---

# E2E Test Execution

This is a project-level skill. Resolve checklists, run directories, commands, and evidence paths from the current project root.

Execute the chosen checklist against the recorded baseline and produce an evidence-backed result document. Test visible behavior, not source-code intent alone.

## Inputs and modes

- Required: a checklist path and its version.
- Optional: `full` (default) or `retest` scope with explicit test IDs.
- Default output root: `test/e2e-test-run-YYYY-MM-DD/`; use `-02`, `-03`, and so on for same-day collisions.
- In retest mode, create a new run directory rather than overwriting a prior result. Include only scoped IDs and link the source result document.

## Preflight

1. Read applicable `AGENTS.md`, the full checklist, and its recorded branch/SHA.
2. Capture current branch, SHA, and Git status. If they differ from the checklist baseline, record a `P0` environment mismatch and stop unless the user explicitly approves testing the new baseline.
3. Read the applicable browser-testing skill before browser work. If the user explicitly selected an in-app browser or Chrome, use that browser surface; do not substitute another automation surface.
4. Run the project build and start the production preview using the project's documented commands. Treat build or preview failure as `P0`.
5. If the user has authorized a functional fallback and production preview cannot start, start the development server only to finish functional inspection. Label all performance results as non-production diagnostic data and never call the build preflight a pass.

## Browser procedure

1. Set each checklist viewport in turn. After navigation, wait for the best supported stable load state; if `networkidle` is unavailable, use a fresh DOM snapshot plus targeted state checks.
2. Use rendered DOM and screenshots to choose locators. Before clicking, filling, or pressing, verify a unique target; verify the expected result after the action.
3. Visit every checklist route and every current detail page. Execute each listed interaction through the UI where possible.
4. Check visible images for completed, non-zero dimensions; distinguish local failures from external network failures. Check Markdown/MDX through rendered semantic elements and visible output, not a broad source-text dump.
5. Capture screenshots for failures that are visually demonstrable. For nonvisual failures, document reproducible actions, actual behavior, console errors, timing, or request evidence in the result cell.
6. Record performance only from production-like runs. Flag a `P4` only for repeatable blocking over three seconds or an identifiable, material optimization opportunity.
7. Close test tabs and stop only the server process that this run started. Reset temporary viewport overrides.

## Required result format

Create `results.md` in the run directory with this metadata:

| 元数据 | 值 |
| --- | --- |
| 对应测试清单版本 | v<N> |
| 测试日期 | YYYY-MM-DD |
| 基线分支 | `<branch>` |
| 基线提交 | `<full SHA>` |
| 测试环境 | <commands, server mode, viewports> |

Use this exact five-column table and preserve checklist IDs and names:

| 测试清单版本 | 测试日期 | 测试项 | 测试情况 | 修复情况 |
| --- | --- | --- | --- |

- Write `PASS` only when the stated expectation was exercised and met; leave its repair cell empty.
- Use `FAIL P0` through `FAIL P4` for defects. Include cause, actual behavior, and a relative evidence link such as `[截图](./evidence/TC-ROUTE-04.png)`.
- Use `PARTIAL P<N>` when a sub-behavior fails and identify both the working and failing portions.
- Use `N/A（非缺陷）` only for known inactive conditions. Use `N/A（覆盖缺口）` for missing test fixtures; state exactly how to make it testable.
- Write all screenshots beneath `evidence/`; retain only failure evidence unless the user asks for visual samples.

## Completion report

State the result path, baseline, server mode, pass/fail/partial/N/A counts, and every non-pass ID ordered by severity. Explicitly call out when production performance evidence is unavailable.
