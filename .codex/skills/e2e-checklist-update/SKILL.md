---
name: e2e-checklist-update
description: Create or update a versioned browser E2E inspection checklist from the current Git branch and HEAD. Use whenever a project needs its route, rendered-component, content-entry, interaction, Markdown/image, responsive UX, or local-performance coverage inventory refreshed before a manual E2E run.
compatibility: Requires filesystem and shell access. Uses browser-testing skills only for static reconnaissance when needed; it does not execute a test run.
---

# E2E Checklist Update

This is a project-level skill. Resolve repository paths from the current project root and keep generated artifacts inside that repository.

Create a testable, branch-specific checklist before a browser inspection. The checklist is a contract between the current implementation and later test-result documents, so its IDs must remain stable whenever the tested behavior has not changed.

## Inputs and defaults

- Use the repository CWD unless the user supplies another path.
- Treat the current branch and `HEAD` as the baseline. Record both full commit SHA and branch name.
- Store checklists in `test/e2e-test-cases-v<N>.md` by default. Respect an existing project convention if one exists.
- Record timestamps in the user's local timezone as ISO 8601 values.
- Default responsive coverage is desktop `1440×900` and mobile `390×844` unless the project or user specifies otherwise.

## Workflow

1. Read applicable `AGENTS.md` files. Inspect Git branch, `HEAD`, status, routing files, layouts, page imports, content collections, component use sites, and client-side interaction code.
2. Enumerate only runtime-reachable public behavior. Include static evidence for components that are imported but conditionally not rendered; do not pretend unmounted UI was tested.
3. Read every current content entry that maps to a public detail route. Identify fixture-specific features such as code blocks, images, MDX, math, callouts, Mermaid, external links, and pagination thresholds.
4. Read the previous checklist, if present. Preserve IDs for unchanged coverage; add IDs for new behavior and retire removed IDs in a short coverage note. Bump `<N>` when the actual test-item set or expected behavior changes. A timestamp-only refresh keeps the existing version.
5. Write the checklist. Do not run the server, browse pages, modify product code, or create a test-run directory in this skill.

## Required checklist format

Use this metadata table:

| 元数据 | 值 |
| --- | --- |
| 测试清单版本 | v<N> |
| 最后修改时间 | <ISO 8601 with offset> |
| 基线分支 | `<branch>` |
| 基线提交 | `<full SHA>` |
| 服务模式 | <planned mode> |
| 视口 | 桌面 `<width×height>`；手机 `<width×height>` |

Define severity in this order: `P0` blank, inaccessible, or crashing routes; `P1` implemented interaction failure; `P2` Markdown/MDX or image failure; `P3` UX issue; `P4` clear performance issue.

Then use one row per test item:

| 测试 ID | 页面/组件 | 前置条件 | 操作 | 预期结果 | 级别 |
| --- | --- | --- | --- | --- |

Use durable, scoped IDs such as `TC-ROUTE-01`, `TC-GLOBAL-02`, `TC-LIST-03`, `TC-ART-01`, `TC-MDX-01`, `TC-RES-01`, `TC-UX-02`, and `TC-PERF-01`.

## Coverage rules

- Include every public route, every navigation target, unknown-route handling, and each current content/detail page.
- Include all components actually composed by those routes, including global layout UI and hydrated islands.
- Include interactions only where the code exposes an actual behavior: navigation, search, filter, sorting, theme, copy, modal, pagination, scroll behavior, animation, and image fallback where reachable.
- Make rendering cases explicit: no blank route, no exposed Markdown/MDX source, no broken local images, and external dependencies recorded separately.
- Cover both required viewports. Check overflow, wrapping, overlap, contrast, minimum practical hit areas, fixed controls, and content readability.
- Include production-preview build and startup as a preflight item. Performance must be measured in a production-like server; development-mode metrics are diagnostic only.
- For conditional UI, state the exact condition. Example: when five posts produce one page, assert the pagination control is absent and mark click behavior as unexecutable rather than passing it.

## Completion report

Report the checklist path, version, baseline SHA, added/retired IDs, and intentionally untestable conditional or unmounted components. Do not claim a browser inspection occurred.
