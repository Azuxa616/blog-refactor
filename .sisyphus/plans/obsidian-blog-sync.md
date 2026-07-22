# Obsidian 笔记仓库 → 博客自动同步

## TL;DR

> **Quick Summary**: 笔记仓库 (Azuxa616/Markdown_Repository) push 触发 GitHub Actions，运行 Node 同步脚本：扫描 `publish:true` 笔记 → LLM 推断元数据 → 转换 wikilink/图片/mermaid → 在博客仓库 (blog-refactor) 建分支 + 提交 + 跨仓库 PR。
>
> **是否需要服务**: **不需要常驻服务**。GitHub Actions 完全够用 —— 它本身就是事件触发的临时计算。只有需要实时推送（非 git push 触发）或 agent 长驻审查时才需要单独服务。
>
> **Deliverables**:
> - 笔记仓库: `scripts/sync-to-blog/` 同步工具 + `.github/workflows/sync-to-blog.yml` + `.blog-sync/manifest.json` 状态文件 + 模板字段重命名
> - 博客仓库: GitHub remote 接入 + `rehype-mermaid` 接入 markdown 管线
> - 跨仓库 PR 认证方案（fine-grained PAT）+ LLM API key 管理
>
> **Estimated Effort**: Large
> **Parallel Execution**: YES - 5 waves
> **Critical Path**: T1 (博客 remote) → T5 (manifest schema) → T6/T7/T8 (核心转换器) → T12 (编排器) → T15 (Actions workflow) → F1-F4

---

## Context

### Original Request

> 我有一个 md 的 obsidian 笔记仓库，我希望能将这个仓库中的部分指定文件当作文章同步到博客站上公开发布，并且每次在笔记仓库中提交时都能触发同步。我是否需要一个简单的服务来做到这步？两个仓库分别需要什么修改

### Interview Summary

**Key Discussions**:
- 触发机制: GitHub Actions（笔记仓库 push 到 main）
- 发布标记: Frontmatter `publish: true`（统一字段名，模板 `published` → `publish`）
- 产物形式: 创建跨仓库 PR（未来加 agent 审查 hook）
- 取消发布: 自动从博客删除
- Wikilinks: 转为 `/articles/{slug}` 博客链接
- Slug 生成: LLM 智能推断（中文文件名）
- 状态记录: `.blog-sync/manifest.json` 提交到笔记仓库
- 博客 remote: 计划内前置任务（当前无 remote）

**Research Findings**:
- **笔记仓库**: `https://github.com/Azuxa616/Markdown_Repository.git`（私有, main）
  - 附件统一在 `zob-source/images/`（Obsidian app.json 配置）
  - 图片引用格式: `![[xxx.png]]` (Obsidian wiki 风格)
  - 文件命名: 大量中文 + 符号
  - Mermaid: 已有 3 个文件使用（在 `面试/JS/`）
  - 装了 Obsidian Git/Image Auto Upload/Dataview/Local REST API/Excalidraw 等插件
  - 模板 frontmatter: `title/source/author/published/created/description/tags`
  - `Blog/` 已分子目录 Drift, Public（Public 为空）→ 可作 category 来源
  - `.gitignore`: 仅排除 `dairy`
- **博客仓库**: `F:\MyProjects\blog-Azx616\blog-refactor`（本地，**无 remote!**）
  - 内容结构: `content/posts/{slug}/index.{md,mdx}`
  - Schema 必填: title, slug, description, publishDate, category
  - Schema 选填: tags, coverImage, updatedDate, isRepost, originalAuthor, originalLink
  - 图片目录: `public/blog-images/`
  - Markdown 管线: remarkMath + remarkGfm + remarkEmoji + **remarkCallout** ✓ + remarkToc + rehypeSlug + rehypeAutolinkHeadings + rehypeExternalLinks + rehypeCodeHeader + **rehypeKatex** ✓ + rehypePresetMinify
  - Mermaid: ❌ 缺失 → 需新增
  - Wikilink: ❌ 无原生支持 → 脚本预处理

### Metis Review

**识别的关键 gap（已在计划中处理）**:

1. **PR 生命周期未定义** → 决策: 同源分支只维护一个 open PR，新 push 更新已有 PR
2. **Partial sync 失败语义** → 决策: 每条笔记原子化（独立成功/失败），失败的笔记在 PR body 列出错误，整体 manifest 仅在所有提交成功后写回
3. **Slug 不可变性** → 决策: 一旦 manifest 中赋值，永不再变（除非用户手动改 manifest）
4. **并发竞态** → 决策: GitHub Actions `concurrency: { group: sync-to-blog, cancel-in-progress: false }`
5. **博客 deploy 缺失** → 决策: v1 不实现自动 deploy，PR body 明确标注"merge ≠ published, 需手动 deploy"
6. **PAT scope 过宽风险** → 决策: fine-grained PAT, 仅 `contents:write` 限定到博客仓库
7. **LLM 不确定性** → 决策: 6 步降级链 + manifest 缓存首次成功结果 + Zod 校验输出 + 单次成本上限
8. **图片路径解析** → 决策: 实现 Obsidian "shortest path when possible" 查找算法
9. **Manifest schema 版本** → 决策: 加入 `version: 1` 字段
10. **首同步批量** → 决策: 单 PR 上限 20 篇笔记，超出则分批（关闭当前 PR 触发下一轮）
11. **Wikilink 变体** → 决策: v1 支持 `[[note]]` 和 `[[note|display]]`，不支持 `[[note#section]]` 和 `[[note^block]]`
12. **Schema 耦合** → 决策: 在同步工具中 vendored 一份博客 schema 副本（手工同步）+ 文档说明
13. **Mermaid 插件插入点** → 决策: `rehype-mermaid` with `strategy: 'pre-mermaid'`（客户端渲染，避免 SSR 需要 Playwright），插入位置在 `rehypeSlug` 之前
14. **图片去重** → 决策: 按 sha256 内容寻址，相同图片只复制一次
15. **publishDate 来源** → 决策: 笔记的 git 首次提交时间（`git log --diff-filter=A --follow --format=%aI`）
16. **Image GC** → 决策: 删除笔记时，扫描其他发布笔记的引用，无人引用才删图片

### Post-Clarification Gaps（增量更新边界 case）

用户澄清"增量更新"时识别的 3 个边界 case，**v1 通过文档明示 + 手动解法处理**，v2 实现自动化：

17. **反向引用更新** → v1: 文档说明（编辑引用方笔记触发更新）；v2: `referencedBy` 反向引用图
18. **工具版本漂移** → v1: 文档说明（手动删 transformedHash）；v2: manifest 加 `toolVersion` 字段
19. **博客 schema 变化** → v1: 文档说明（手动删 llmResult 缓存）；v2: `llmResult` 加 schema 版本号

详见 T18 的 README "Known Limitations" 章节。

---

## Work Objectives

### Core Objective

实现笔记仓库 → 博客仓库的**单向、增量、可审查**同步管线：笔记 `publish: true` 触发后，自动转换为博客可消费的内容并开 PR。

### Concrete Deliverables

**笔记仓库** (`Azuxa616/Markdown_Repository`):
- `scripts/sync-to-blog/` 完整 Node CLI 工具
- `.github/workflows/sync-to-blog.yml` 触发工作流
- `.blog-sync/manifest.json` 状态文件
- `.blog-sync/config.json` 同步配置（LLM 模型/成本上限/批量大小等）
- `template/通用笔记模板.md` 字段重命名 `published` → `publish`
- `package.json` 用于 sync tool 依赖管理（pnpm）

**博客仓库** (`blog-refactor`):
- 新增 GitHub remote（用户手动创建仓库后接入）
- `astro.config.mjs` 接入 `rehype-mermaid`
- 不再有其他源码改动（content/posts/ 和 public/blog-images/ 是运行时产物）

### Definition of Done

- [ ] 在笔记仓库 push 一条带 `publish: true` 的笔记，能在博客仓库看到一个 PR
- [ ] PR 合并后 `content/posts/{slug}/index.md` 存在且通过 `pnpm astro check`
- [ ] 同一笔记再 push（无实质改动）不产生新 PR / 新 commit（幂等性）
- [ ] `publish: true → false` 后下次同步自动从博客删除该文章
- [ ] 笔记中的 `![[xxx.png]]` 在博客渲染为可见图片
- [ ] 笔记中的 mermaid 代码块在博客渲染为 SVG/canvas
- [ ] 笔记中的 `[[note]]` 转换为 `/articles/{slug}` 链接（目标已发布时）

### Must Have

- 笔记仓库 push 自动触发（GitHub Actions）
- 跨仓库 PR（不是直接 push 到博客 main）
- Manifest 状态管理（增量同步）
- Slug 不可变性
- 失败降级链（LLM 失败 → pinyin → hash）
- `--dry-run` 本地测试模式
- 并发控制（concurrency group）
- 6 步 LLM 降级链
- Zod schema 校验（manifest + LLM 输出 + 笔记转换后）
- 成本上限与重试边界
- PR body 含同步摘要（新增/更新/删除/失败/成本）

### Must NOT Have (Guardrails)

- **不允许 slug 在首次发布后改变**（除非用户手动改 manifest）
- **不允许使用 broad-scope PAT**（仅 fine-grained, 限定博客仓库 `contents:write`）
- **不允许 auto-merge PR**（用户明确选 PR 是为后续 agent 审查 hook）
- **不允许改动笔记仓库内容**（除 `.blog-sync/manifest.json`）
- **不允许改动博客仓库**除 `content/posts/`, `public/blog-images/`, `astro.config.mjs` 之外的位置
- **不允许跳过 Zod 校验**（转换后笔记必须通过博客 schema）
- **不允许 LLM 无限重试**（成本上限 $0.50/sync, 单笔记最多 2 次重试, 10s 超时）
- **不允许提交 secrets 到任何仓库**
- **不允许删除笔记后留下孤儿图片**（GC 必须执行）
- **不允许静默删除博客文章**（删除走独立 PR 或在 PR diff 中可见）
- **不允许单次同步处理超过 50 篇笔记**（防失控）
- **不允许处理 PDF/video/audio 附件**（明确报错而非静默跳过）
- **不允许 `publish: null` 或缺失字段被视为 true**（仅 explicit `true` 触发）
- **不允许 wikilink 自动发布目标笔记**（仅直接 `publish:true` 才发布）
- **不允许在 v1 处理 Excalidraw 文件**（明确报错）

---

## Verification Strategy

> **ZERO HUMAN INTERVENTION** - ALL verification is agent-executed. No exceptions.

### Test Decision
- **Infrastructure exists**: NO（项目当前无 Vitest）
- **Automated tests**: None（不为本期工作单独引入 Vitest；用 dry-run + 命令行断言替代）
- **Framework**: none
- 失败路径通过 `--dry-run` + 临时 fixture + 命令行断言验证

### QA Policy
每个 task 必须包含 agent 执行的 QA scenario：
- **CLI 工具**: 用 Bash 运行 `node scripts/sync-to-blog/index.js --dry-run ...` 验证输出
- **GitHub Actions**: 用 `act`（本地 Actions 模拟器）或 push 后通过 `gh run list/watch` 验证
- **博客内容**: 用 Bash `pnpm astro check` + `Test-Path` + 渲染后 `curl | grep` 验证
- **跨仓库 PR**: 用 `gh pr list/view` 验证

Evidence saved to `.sisyphus/evidence/task-{N}-{scenario-slug}.{ext}`.

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Foundation - 5 parallel):
├── T1: 博客仓库 GitHub remote 创建 + 接入 [quick]
├── T2: Fine-grained PAT 创建 + 双仓库 secrets 配置 [quick]
├── T3: 博客 markdown 管线接入 rehype-mermaid [quick]
├── T4: 笔记仓库 sync tool 项目脚手架 [quick]
└── T5: Manifest schema + Zod 校验 + 配置文件骨架 [quick]

Wave 2 (Core primitives - 6 parallel, depends Wave 1):
├── T6: Markdown 解析器 + 转换器（frontmatter/wikilink/image-rewrite） [deep]
├── T7: LLM 元数据推断模块（6 步降级链 + Zod 校验） [deep]
├── T8: 图片资源处理器（Obsidian 路径解析 + sha256 去重 + 复制） [unspecified-high]
├── T9: 博客仓库 git 客户端（clone/branch/commit/push via octokit） [unspecified-high]
├── T10: PR 创建器（生命周期: 新建/更新已 open PR） [unspecified-high]
└── T11: 笔记仓库模板字段重命名 + 文档 [quick]

Wave 3 (Integration - 4 parallel, depends Wave 2):
├── T12: 同步编排器（orchestrator，组合 T6-T10） [deep]
├── T13: Manifest 状态管理器（atomic 写入 + git 集成） [unspecified-high]
├── T14: CLI 入口（--dry-run / --note / --verbose / --batch-size） [quick]
└── T15: GitHub Actions workflow + concurrency group [quick]

Wave 4 (Hardening - 3 parallel, depends Wave 3):
├── T16: 错误处理 + 重试逻辑 + PR body 生成器 [unspecified-high]
├── T17: 图片 GC + 删除流程 + 批量首同步模式 [unspecified-high]
└── T18: 端到端 dry-run 测试场景 + 文档（含 deploy gap 说明） [writing]

Wave FINAL (4 parallel reviews):
├── F1: Plan compliance audit (oracle)
├── F2: Code quality review (unspecified-high)
├── F3: Real manual QA (unspecified-high)
└── F4: Scope fidelity check (deep)
-> Present results -> Get explicit user okay
```

**Critical Path**: T1 → T5 → T6 → T12 → T15 → F1-F4
**Parallel Speedup**: ~70% faster than sequential
**Max Concurrent**: 6 (Wave 2)

### Dependency Matrix

| Task | Depends On | Blocks |
|------|------------|--------|
| T1 | - | T9, T10 |
| T2 | T1 | T9, T10, T15 |
| T3 | - | F1, F3 |
| T4 | - | T6, T7, T8, T9, T10, T12, T14 |
| T5 | T4 | T6, T7, T12, T13 |
| T6 | T4, T5 | T12 |
| T7 | T4, T5 | T12 |
| T8 | T4, T5 | T12 |
| T9 | T1, T4 | T12 |
| T10 | T1, T2, T4 | T12 |
| T11 | - | (parallel, no blocks) |
| T12 | T6, T7, T8, T9, T10 | T16, T17, T18 |
| T13 | T5, T9 | T12, T16 |
| T14 | T4 | T15, T18 |
| T15 | T2, T14 | T18 |
| T16 | T12, T13 | F1-F4 |
| T17 | T12, T13 | F1-F4 |
| T18 | T12, T15 | F1-F4 |

### Agent Dispatch Summary

- **Wave 1**: 5 - T1-T2 → `quick`, T3 → `quick`, T4-T5 → `quick`
- **Wave 2**: 6 - T6/T7 → `deep`, T8/T9/T10 → `unspecified-high`, T11 → `quick`
- **Wave 3**: 4 - T12 → `deep`, T13 → `unspecified-high`, T14/T15 → `quick`
- **Wave 4**: 3 - T16/T17 → `unspecified-high`, T18 → `writing`
- **FINAL**: 4 - F1 → `oracle`, F2/F3 → `unspecified-high`, F4 → `deep`

---

## TODOs

- [ ] 1. **博客仓库 GitHub remote 创建 + 接入**

  **What to do**:
  - 在 GitHub 创建新仓库 `Azuxa616/blog-refactor`（建议私有，与笔记仓库一致；用户后续可改公开）
  - 在本地 `F:\MyProjects\blog-Azx616\blog-refactor` 添加 origin remote
  - 推送 main 分支 + 所有需要的备份分支（用户选择）
  - 验证 `git remote -v` 显示正确 URL
  - 在仓库根创建 `README.md` 增补一行说明 "本仓库通过 Azuxa616/Markdown_Repository 的 sync workflow 接收内容"

  **Must NOT do**:
  - 不要配置 branch protection rules（v1 不需要，PR 工作流不强依赖）
  - 不要在博客仓库添加 GitHub Actions（部署留给后续）
  - 不要 force-push 已有历史

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 单一明确任务，仅 git 操作 + GitHub 仓库创建
  - **Skills**: [`git-master`]
    - `git-master`: 涉及 git 远端配置与多分支推送

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with T2, T3, T4, T5)
  - **Blocks**: T9, T10 (依赖博客远端存在)
  - **Blocked By**: None (可立即开始)

  **References**:
  - **Pattern References**: 笔记仓库 `Azuxa616/Markdown_Repository` 已在 GitHub，可作为参考
  - **API/Type References**: `https://github.com/Azuxa616/Markdown_Repository.git` (用户名 Azuxa616)
  - **WHY**: 确定远端 URL 格式与命名一致性

  **Acceptance Criteria**:
  - [ ] `git -C "F:\MyProjects\blog-Azx616\blog-refactor" remote -v` 输出包含 `origin` 和 GitHub URL
  - [ ] `gh repo view Azuxa616/blog-refactor` 成功
  - [ ] `git -C "F:\MyProjects\blog-Azx616\blog-refactor" ls-remote origin main` 成功

  **QA Scenarios**:
  ```
  Scenario: 博客远端可访问
    Tool: Bash (gh + git)
    Preconditions: 用户已 gh auth login
    Steps:
      1. 运行 `gh repo view Azuxa616/blog-refactor --json name,visibility`
      2. 运行 `git -C "F:\MyProjects\blog-Azx616\blog-refactor" remote get-url origin`
      3. 运行 `git -C "F:\MyProjects\blog-Azx616\blog-refactor" ls-remote --heads origin`
    Expected Result:
      - JSON 含 `"name": "blog-refactor"`
      - URL 为 `https://github.com/Azuxa616/blog-refactor.git` (或 ssh 等价)
      - heads 列表含 `main`
    Failure Indicators: 任何命令非零退出 / repo 不存在 / main 分支缺失
    Evidence: .sisyphus/evidence/task-1-blog-remote-setup.txt
  ```

  **Commit**: YES
  - Message: `chore(repo): add GitHub remote and push main`
  - Files: `README.md` (新增远端说明)
  - Pre-commit: 无（仅远端操作）

- [x] 2. **Fine-grained PAT 创建 + 双仓库 secrets 配置**

  **What to do**:
  - 编写 `docs/sync-setup.md`（在笔记仓库 `scripts/sync-to-blog/docs/` 下）详述：
    - 如何在 https://github.com/settings/personal-access-tokens/new 创建 fine-grained PAT
    - Resource owner: `Azuxa616`
    - Repository access: Only select repositories → `Azuxa616/blog-refactor`（**不选**笔记仓库，**不选**所有仓库）
    - Permissions: `Contents: Read and write`（**仅此一项**，无 admin, 无 delete-repo, 无 metadata 之外的其他）
    - Expiration: 建议 90 天，到期前更新流程
  - 在笔记仓库 GitHub Settings → Secrets and variables → Actions 添加：
    - `BLOG_REPO_PAT`: 上面创建的 PAT 值
    - `BLOG_REPO_FULL_NAME`: `Azuxa616/blog-refactor`
    - `LLM_API_KEY`: LLM 服务 API key（建议 ZhipuAI GLM，用户已知技术栈）
    - `LLM_MODEL`: 如 `glm-4.6` 或 `glm-4-plus`
    - `LLM_BASE_URL`: 如 `https://open.bigmodel.cn/api/paas/v4/`
  - 编写验证脚本 `scripts/sync-to-blog/scripts/verify-secrets.sh`（仅检查环境变量存在性，不打印值）
  - 在 sync tool README 中链接到 setup 文档

  **Must NOT do**:
  - 不要把 PAT 真值写入任何文件
  - 不要选择 `repo` scope（classic PAT 不允许）
  - 不要赋予 admin / delete-repo / workflows 权限
  - 不要在 PR body 或日志中打印 secret 值

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 主要是文档撰写 + 用户手动操作清单，无复杂代码
  - **Skills**: [`git-master`]
    - `git-master`: 了解 GitHub 认证模型

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with T1, T3, T4, T5)
  - **Blocks**: T9, T10, T15
  - **Blocked By**: T1（BLOG_REPO_FULL_NAME 依赖远端存在）

  **References**:
  - **External References**:
    - GitHub docs: `https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens`
    - Fine-grained PAT 限制: `https://docs.github.com/en/rest/overview/permissions-required-for-fine-grained-personal-access-tokens`
    - ZhipuAI API: `https://open.bigmodel.cn/dev/api`

  **Acceptance Criteria**:
  - [ ] `scripts/sync-to-blog/docs/sync-setup.md` 存在且包含完整 PAT 创建步骤
  - [ ] 文档明确列出最少权限清单（Contents:write only）
  - [ ] 文档列出所有需要配置的 secret 名称
  - [ ] `scripts/sync-to-blog/scripts/verify-secrets.sh` 存在且可执行
  - [ ] 用户在 GitHub UI 手动配置完 secrets 后（人机步骤，由用户执行）

  **QA Scenarios**:
  ```
  Scenario: 文档完整可执行
    Tool: Bash
    Preconditions: 无
    Steps:
      1. Read scripts/sync-to-blog/docs/sync-setup.md
      2. Grep "fine-grained" - 应至少出现 3 次
      3. Grep "Contents" 在 Permissions 章节
      4. Grep "BLOG_REPO_PAT|LLM_API_KEY|LLM_MODEL|LLM_BASE_URL" - 4 个 secret 名都应出现
      5. Run bash scripts/sync-to-blog/scripts/verify-secrets.sh
         (在测试环境导出 dummy secrets 后应返回 0;
          未导出时应返回非零并打印缺哪个)
    Expected Result: 所有 grep 命中; verify-secrets 行为符合预期
    Failure Indicators: 关键章节缺失 / secret 名拼写不一致
    Evidence: .sisyphus/evidence/task-2-pat-docs-and-verify.txt

  Scenario: PAT 权限最小化（人工检查项转自动）
    Tool: Bash (gh)
    Preconditions: 用户已按文档创建 PAT 并配 secret
    Steps:
      1. 在 workflow 中加临时 step: `gh api /user`（验证 PAT 可用）
      2. 验证 PAT 不能访问笔记仓库: 应失败
      3. 验证 PAT 不能 delete repo: 应失败
    Expected Result: 仅对 blog-refactor 有 contents:write
    Failure Indicators: PAT scope 过宽
    Evidence: .sisyphus/evidence/task-2-pat-scope-verification.txt
  ```

  **Commit**: YES
  - Message: `docs(sync): PAT setup guide and secrets verification`
  - Files: `scripts/sync-to-blog/docs/sync-setup.md`, `scripts/sync-to-blog/scripts/verify-secrets.sh`
  - Pre-commit: 无

- [x] 3. **博客 markdown 管线接入 rehype-mermaid**

  **What to do**:
  - 安装 `rehype-mermaid`（pnpm add -D）
  - 在 `astro.config.mjs` 现有 rehype 管线中插入 `rehypeMermaid`
  - 插入位置：**在 `rehypeSlug` 之前**（mermaid 处理 `\`\`\`mermaid` 代码块，需在其他 rehype 处理 heading 之前）
  - 配置 `strategy: 'pre-mermaid'`（客户端渲染，避免 SSR 需要 Playwright/无头浏览器依赖）
  - 在博客 Layout.astro 或客户端入口注入 mermaid client script（`<script type="module">import mermaid from 'mermaid'; mermaid.initialize(...)</script>`）
  - 验证深色模式渲染（博客默认 dark mode，mermaid 需配置 theme: 'dark' 或动态切换）
  - 复制一篇笔记的 mermaid 内容到 `content/posts/_mermaid-test/index.md` 测试（task 完成后删除）

  **Must NOT do**:
  - 不要使用 `inline-svg` strategy（需要 Playwright，CI/Actions 复杂化）
  - 不要给 mermaid 自定义主题（v1 用默认 dark）
  - 不要修改其他 remark/rehype 插件顺序
  - 不要永久留下 `_mermaid-test` 测试目录

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 单一插件接入 + 配置，模式清晰
  - **Skills**: []
    - 不需要特别 skill；astro.config 修改属于常规配置

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with T1, T2, T4, T5)
  - **Blocks**: F1, F3 (Final 验证需要 mermaid 工作)
  - **Blocked By**: None

  **References**:
  - **Pattern References**: `F:\MyProjects\blog-Azx616\blog-refactor\astro.config.mjs` 现有 rehype 数组结构
  - **External References**:
    - `rehype-mermaid` 官方: `https://github.com/remcohaszing/rehype-mermaid`
    - Astro integrations: `https://docs.astro.build/en/guides/markdown-content/`
  - **WHY**: 现有管线顺序文档化在 AGENTS.md，插入新插件需保持兼容

  **Acceptance Criteria**:
  - [ ] `package.json` 含 `rehype-mermaid` 依赖
  - [ ] `astro.config.mjs` import 并使用 rehypeMermaid
  - [ ] `pnpm astro check` 通过
  - [ ] `pnpm build` 成功
  - [ ] 临时测试文章包含 `\`\`\`mermaid` 代码块且 `pnpm dev` 后浏览器渲染出 SVG/canvas

  **QA Scenarios**:
  ```
  Scenario: Mermaid 渲染（dev 模式）
    Tool: Playwright (webapp-testing skill)
    Preconditions: pnpm dev 运行在 localhost:4321
    Steps:
      1. 创建 content/posts/_mermaid-test/index.md 含：
         frontmatter (title/slug/description/publishDate/category) +
         \`\`\`mermaid
         flowchart LR
           A[Test] --> B[Render]
         \`\`\`
      2. Playwright navigate to http://localhost:4321/articles/_mermaid-test
      3. Wait for selector: 'svg' or '.mermaid' or 'canvas' (timeout: 10s)
      4. Screenshot
      5. 删除 content/posts/_mermaid-test/
    Expected Result: 页面含渲染后的 mermaid 图（SVG/canvas 元素存在）
    Failure Indicators: 文本原样显示 "flowchart LR..." / 客户端 JS 报错
    Evidence: .sisyphus/evidence/task-3-mermaid-render.png

  Scenario: 深色模式可读性
    Tool: Playwright
    Preconditions: 同上
    Steps:
      1. 在 dark mode 下截图
      2. 检查 mermaid SVG 文本颜色对比度（非黑色背景上黑字）
    Expected Result: 文字清晰可读，与博客 dark theme 协调
    Failure Indicators: 文字与背景同色 / 边框消失
    Evidence: .sisyphus/evidence/task-3-mermaid-dark-mode.png
  ```

  **Commit**: YES
  - Message: `feat(markdown): integrate rehype-mermaid for diagram rendering`
  - Files: `package.json`, `pnpm-lock.yaml`, `astro.config.mjs`, (可选)`src/layouts/Layout.astro` 或 client script
  - Pre-commit: `pnpm astro check && pnpm build`

- [x] 4. **笔记仓库 sync tool 项目脚手架**

  **What to do**:
  - 在 `F:\MarkDown\Markdown_Repository\scripts\sync-to-blog\` 初始化 Node 项目
  - 创建 `package.json`:
    - `name`: `obsidian-blog-sync`
    - `type`: `module` (ESM)
    - `bin`: `{ "sync-to-blog": "./index.js" }`
    - scripts: `{ "sync": "node index.js", "test": "node --test" }`
    - 依赖（初始）: `zod`, `gray-matter`, `unified`, `remark-parse`, `remark-stringify`, `remark-wiki-link`, `@sindresorhus/slugify`, `pinyin-pro`, `simple-git`, `@octokit/rest`, `commander`, `pino` (日志)
    - devDependencies: `@types/node`
  - 创建目录结构：
    ```
    scripts/sync-to-blog/
      index.js              # CLI 入口（T14 实现）
      src/
        config.js           # 配置加载（T5 部分实现）
        manifest.js         # manifest 管理（T13 实现）
        parser.js           # markdown 解析（T6）
        transformer.js      # 转换管线（T6）
        llm.js              # LLM 推断（T7）
        images.js           # 图片处理（T8）
        blog-git.js         # 博客仓库 git 客户端（T9）
        pr.js               # PR 创建（T10）
        orchestrator.js     # 编排（T12）
        schemas.js          # Zod schemas（T5 实现）
        utils.js
      docs/
        sync-setup.md       # (T2 填充)
        architecture.md     # 本期填充概览
      scripts/
        verify-secrets.sh   # (T2 填充)
      test/
        fixtures/           # 测试用笔记样本
      README.md
    ```
  - 创建初始 `index.js` 占位（仅打印 "TODO: implemented in T14"）
  - 创建 `.gitignore` 排除 `node_modules/`, `.env`, `test-output/`
  - 创建 `README.md` 概览（架构图 + 用法占位 + 文档链接）

  **Must NOT do**:
  - 不要在此 task 实现具体逻辑（仅脚手架）
  - 不要安装 npm 包（在执行 task 时由 agent 运行 pnpm install）
  - 不要使用 TypeScript（保持 .js 与笔记仓库现有非 TS 风格一致；如用户后续要 TS 再迁移）
  - 不要把 `node_modules/` 提交到 git

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 项目脚手架是模板化操作
  - **Skills**: []
    - 不需要特别 skill

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with T1, T2, T3, T5)
  - **Blocks**: T6, T7, T8, T9, T10, T12, T14, T18（所有后续 sync tool 实现 task）
  - **Blocked By**: None

  **References**:
  - **Pattern References**: 笔记仓库现有结构（根目录无 package.json，将作为新增）
  - **External References**: Node ESM best practices, `commander` CLI 框架

  **Acceptance Criteria**:
  - [ ] `F:\MarkDown\Markdown_Repository\scripts\sync-to-blog\package.json` 存在且 JSON 合法
  - [ ] 目录结构所有文件夹存在
  - [ ] `index.js` 占位可运行（`node index.js` 返回 0）
  - [ ] `.gitignore` 含 `node_modules/`, `.env`
  - [ ] `README.md` 含项目名 + 用法占位

  **QA Scenarios**:
  ```
  Scenario: 脚手架可运行
    Tool: Bash
    Preconditions: 无
    Steps:
      1. cd F:\MarkDown\Markdown_Repository\scripts\sync-to-blog
      2. pnpm install
      3. node index.js
    Expected Result: 
      - pnpm install 成功 (lockfile 生成)
      - node index.js 退出码 0 且打印占位信息
    Failure Indicators: 依赖安装失败 / 语法错误 / 退出码非 0
    Evidence: .sisyphus/evidence/task-4-scaffold-runs.txt

  Scenario: 目录结构完整
    Tool: Bash
    Steps:
      1. Test-Path scripts/sync-to-blog/{src,docs,scripts,test}
      2. Test-Path scripts/sync-to-blog/test/fixtures
      3. Get-ChildItem scripts/sync-to-blog -Recurse -File | Measure-Object
    Expected Result: 所有路径存在; 文件数 >= 10
    Failure Indicators: 缺失关键目录
    Evidence: .sisyphus/evidence/task-4-directory-structure.txt
  ```

  **Commit**: YES
  - Message: `chore(sync): scaffold sync-to-blog tool project structure`
  - Files: `scripts/sync-to-blog/**`, `scripts/sync-to-blog/.gitignore`
  - Pre-commit: 无

- [x] 5. **Manifest schema + Zod 校验 + 配置文件骨架**

  **What to do**:
  - 实现 `scripts/sync-to-blog/src/schemas.js`：
    ```javascript
    import { z } from 'zod'
    
    // Manifest 单条 entry
    export const ManifestEntrySchema = z.object({
      notePath: z.string(),              // 笔记在笔记仓库的相对路径，如 'Blog/Drift/note.md'
      slug: z.string().regex(/^[a-z0-9-]+$/).min(3).max(80),
      contentHash: z.string(),           // sha256(原始 markdown 内容), hex
      transformedHash: z.string(),       // sha256(转换后 markdown 内容), hex
      publishedAt: z.string().datetime(), // ISO 8601
      lastSyncedAt: z.string().datetime(),
      llmResult: z.object({              // 首次 LLM 推断缓存（用于幂等）
        slug: z.string(),
        title: z.string().optional(),
        description: z.string().optional(),
        category: z.string().optional(),
        tags: z.array(z.string()).default([])
      }).optional(),
      blogImagePath: z.array(z.string()).default([]), // 此笔记引用的图片（用于 GC）
    })
    
    // Manifest 整体
    export const ManifestSchema = z.object({
      version: z.literal(1),
      entries: z.array(ManifestEntrySchema),
      updatedAt: z.string().datetime(),
    })
    
    // LLM 输出 schema
    export const LLMOutputSchema = z.object({
      slug: z.string().regex(/^[a-z0-9-]+$/).min(3).max(80),
      title: z.string().min(1).max(200).optional(),
      description: z.string().min(10).max(300).optional(),
      category: z.string().min(1).max(50).optional(),
      tags: z.array(z.string()).max(10).default([]),
    })
    
    // 同步后的博客 frontmatter schema（vendored from src/content.config.ts）
    export const BlogPostFrontmatterSchema = z.object({
      title: z.string().min(1),
      slug: z.string().regex(/^[a-z0-9-]+$/),
      description: z.string().min(1),
      publishDate: z.coerce.date(),
      updatedDate: z.coerce.date().optional(),
      category: z.string().min(1),
      tags: z.array(z.string()).default([]),
      coverImage: z.string().optional(),
      isRepost: z.boolean().default(false),
      originalAuthor: z.string().optional(),
      originalLink: z.string().optional(),
    })
    ```
  - 实现 `scripts/sync-to-blog/src/config.js` 加载 `.blog-sync/config.json`：
    ```javascript
    // config.json schema
    {
      llm: {
        model: "glm-4.6",
        baseUrl: "https://open.bigmodel.cn/api/paas/v4/",
        maxCostPerSync: 0.50,   // USD
        maxRetriesPerNote: 2,
        timeoutMs: 10000,
        temperature: 0
      },
      sync: {
        maxNotesPerPr: 20,
        maxNotesPerRun: 50,
        publishedMarker: "publish",
        publishedValue: true,
        notesRepo: {
          rootPath: ".",
          blogSourceDirs: ["Blog"],  // 仅扫描这些目录的 publish:true 笔记
          excludeDirs: ["dairy", "Excalidraw", ".trash", "Clippings"]
        },
        blogRepo: {
          owner: "Azuxa616",
          name: "blog-refactor",
          baseUrl: "https://github.com/Azuxa616/blog-refactor.git",
          contentDir: "content/posts",
          imageDir: "public/blog-images",
          branchPrefix: "sync/"
        }
      }
    }
    ```
  - 创建 `.blog-sync/config.json` 用上述默认值
  - 创建 `.blog-sync/manifest.json` 初始：`{ "version": 1, "entries": [], "updatedAt": "<now>" }`
  - 创建 `docs/schema-coupling.md` 说明 vendored schema 与博客 `src/content.config.ts` 的同步责任

  **Must NOT do**:
  - 不要使用 any/unknown 跳过校验
  - 不要省略 `version` 字段
  - 不要把 secrets 放进 config.json（secrets 走 env / GH secrets）

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Schema 定义 + 配置文件骨架，模式清晰
  - **Skills**: [`Frontend Components Standards`]
    - 评估：实际上不太适用，可省略
  - **Skills**: []（最终）

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with T1, T2, T3, T4)
  - **Blocks**: T6, T7, T12, T13
  - **Blocked By**: T4（脚手架存在）

  **References**:
  - **Pattern References**: `F:\MyProjects\blog-Azx616\blog-refactor\src\content.config.ts` - **复制 schema 字段定义**
  - **API/Type References**: Zod schemas 必须与博客 Zod schemas 等价（字段名、类型、必填性）
  - **WHY**: vendored schema 是同步工具与博客 schema 的一致性契约

  **Acceptance Criteria**:
  - [ ] `src/schemas.js` 含 4 个 export: ManifestEntrySchema, ManifestSchema, LLMOutputSchema, BlogPostFrontmatterSchema
  - [ ] `.blog-sync/config.json` 存在且通过自校验
  - [ ] `.blog-sync/manifest.json` 存在且通过 ManifestSchema 校验
  - [ ] `docs/schema-coupling.md` 说明同步责任

  **QA Scenarios**:
  ```
  Scenario: Schema 校验工作
    Tool: Bash (node)
    Preconditions: T4 完成
    Steps:
      1. 创建临时 test script 调用 schemas:
         - 解析合法 manifest → 应通过
         - 解析缺 version 字段的 manifest → 应报错
         - 解析 slug 含非法字符 → 应报错
         - 解析合法 LLM 输出 → 应通过
      2. node test/schema-smoke.js
    Expected Result: 所有合法样本通过，所有非法样本报错且消息明确
    Failure Indicators: schema 校验无效 / 字段缺失
    Evidence: .sisyphus/evidence/task-5-schema-validation.txt

  Scenario: Vendored schema 与博客 schema 等价
    Tool: Bash
    Steps:
      1. Read F:\MyProjects\blog-Azx616\blog-refactor\src\content.config.ts
      2. Read F:\MarkDown\Markdown_Repository\scripts\sync-to-blog\src\schemas.js
      3. Diff 字段清单（人工/agent 比较）:
         - title: string ✓
         - slug: string ✓ (regex 已加)
         - description: string ✓
         - publishDate: date ✓
         - updatedDate: date optional ✓
         - category: string ✓
         - tags: array default [] ✓
         - coverImage: string optional ✓
         - isRepost: boolean default false ✓
         - originalAuthor/originalLink: optional ✓
    Expected Result: 字段完全一致
    Failure Indicators: 字段缺失或类型不一致
    Evidence: .sisyphus/evidence/task-5-schema-parity.txt
  ```

  **Commit**: YES
  - Message: `feat(sync): define Zod schemas and bootstrap manifest/config`
  - Files: `scripts/sync-to-blog/src/schemas.js`, `scripts/sync-to-blog/src/config.js`, `.blog-sync/config.json`, `.blog-sync/manifest.json`, `scripts/sync-to-blog/docs/schema-coupling.md`, `scripts/sync-to-blog/test/schema-smoke.js`
  - Pre-commit: 无

- [x] 6. **Markdown 解析器 + 转换器（frontmatter/wikilink/image-rewrite）**

  **What to do**:
  - 实现 `src/parser.js`：
    - `parseNote(filePath)`: 读文件 → gray-matter 解析 frontmatter + content
    - `extractTitle(markdown, frontmatter, fileName)`: 优先级 frontmatter.title > first H1 > fileName (without ext)
    - `validatePublishMarker(frontmatter)`: 仅当 `frontmatter.publish === true` 才视为可发布（null/undefined/false 都跳过）
  - 实现 `src/transformer.js` 用 unified/remark-parse/remark-stringify 管线：
    - **Wikilink 转换**: 使用 `remark-wiki-link` 插件（或自写 visitor）：
      - `[[note]]` → `[/articles/{slug}](/articles/{slug})` （当目标已发布时）
      - `[[note]]` → 纯文本 `note`（当目标未发布时，**绝不自动发布**）
      - `[[note|Display]]` → `[Display](/articles/{slug})` 或 `Display`
      - **v1 不支持**: `[[note#section]]`, `[[note^block]]`（保留原样并在 stderr 警告）
      - 需要 manifest 注入：transformer 接受 `publishedSlugs: Set<string>` 参数
    - **图片引用转换**: 自写 remark/rehype visitor：
      - `![[xxx.png]]` → `![alt](/blog-images/xxx.png)` （alt 取 Obsidian 内的可选描述或文件名 stem）
      - 实现图片路径解析：先查 note 同目录 → 再查 `zob-source/images/` → 再全局 shortest-path 搜索
      - 未找到的图片：在 PR body 列出错误，note 仍同步但标记为有 broken image
    - **Frontmatter 字段映射**: 接受已推断的 metadata（来自 T7），生成博客 schema 兼容的 frontmatter
    - **Obsidian 语法剥离**: 移除 `%%comment%%`（Obsidian 注释）
    - **Dataview 块处理**: `dataview` 代码块保留为代码块（在 PR body 警告）
  - 暴露 `transform({ markdown, frontmatter, manifest, fileName, notePath })` 接口
  - 输出: `{ markdown: 转换后, frontmatter: 转换后, images: 引用的图片列表, warnings: string[] }`

  **Must NOT do**:
  - 不要在 v1 处理 `[[note#section]]`/`[[note^block]]`
  - 不要自动发布 wikilink 目标
  - 不要静默忽略 broken image
  - 不要重写 markdown 内容（除上述语法转换）

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: 涉及多种 markdown AST 转换，需要严谨处理边界情况
  - **Skills**: []
    - 不需要特别 skill

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with T7, T8, T9, T10, T11)
  - **Blocks**: T12
  - **Blocked By**: T4 (scaffold), T5 (schemas)

  **References**:
  - **Pattern References**:
    - `F:\MyProjects\blog-Azx616\blog-refactor\src\lib\remark\remark-callout.ts` - 现有 remark 插件实现风格
    - `F:\MyProjects\blog-Azx616\blog-refactor\src\lib\rehype\rehype-code-header.ts` - 现有 rehype 插件实现风格
  - **External References**:
    - `remark-wiki-link`: `https://github.com/landakram/remark-wiki-link`
    - Obsidian wikilink syntax: `https://help.obsidian.md/Linking+notes+and+files/Internal+links`
    - Obsidian embeds: `https://help.obsidian.md/Linking+notes+and+files/Embed+files`
  - **WHY**: 现有项目已有 remark/rehype 自写插件，可参考其 TypeScript/ESM 风格

  **Acceptance Criteria**:
  - [ ] `parseNote()` 处理 fixture 笔记返回正确 frontmatter + content
  - [ ] `validatePublishMarker()` 对 publish:null/undefined/false 返回 false，仅 true 返回 true
  - [ ] `transform()` 处理 fixture 含 `![[xxx.png]]` → 输出 `![xxx](/blog-images/xxx.png)`
  - [ ] `transform()` 处理 fixture 含 `[[published-note]]` → 输出 `[/articles/published-note](/articles/published-note)`
  - [ ] `transform()` 处理 fixture 含 `[[unpublished-note]]` → 输出纯文本 `unpublished-note`
  - [ ] `transform()` 处理 fixture 含 `%%comment%%` → 输出无该注释
  - [ ] `transform()` 处理 fixture 含 `[[note|Display]]` → 输出 `[Display](/articles/...)`
  - [ ] `transform()` 处理 fixture 含 `[[note#section]]` → 保留原样并返回 warning

  **QA Scenarios**:
  ```
  Scenario: 图片引用转换正确
    Tool: Bash (node)
    Preconditions: T4 + T5 完成; test/fixtures/note-with-images.md 含 ![[a.png]] ![[b.jpg]]
    Steps:
      1. node test/transform-images.js
         - 调用 transform() on fixture
         - 断言输出 markdown 含 '![a](/blog-images/a.png)' 和 '![b](/blog-images/b.jpg)'
         - 断言返回的 images 数组含 2 个条目
    Expected Result: 所有断言通过
    Failure Indicators: 引用未转换 / alt 文本错误 / 图片数组缺失
    Evidence: .sisyphus/evidence/task-6-image-transform.txt

  Scenario: Wikilink 双向处理（已发布 vs 未发布）
    Tool: Bash (node)
    Preconditions: fixture note 含 [[published]] [[unpublished]]
    Steps:
      1. manifest 注入 publishedSlugs: Set(['published'])
      2. transform()
      3. 断言输出含 '/articles/published' 链接
      4. 断言输出含纯文本 'unpublished'（无链接）
      5. 断言 warnings 数组为空
    Expected Result: 双向处理正确
    Evidence: .sisyphus/evidence/task-6-wikilink-transform.txt

  Scenario: 边界情况 - 不支持的 wikilink 变体
    Tool: Bash (node)
    Preconditions: fixture note 含 [[note#section]] [[note^block]]
    Steps:
      1. transform()
      2. 断言 markdown 中原始语法保留
      3. 断言 warnings 含 2 条（关于 heading/block refs）
    Expected Result: 不支持的语法保留 + 警告
    Evidence: .sisyphus/evidence/task-6-unsupported-wikilinks.txt
  ```

  **Commit**: YES
  - Message: `feat(sync): markdown parser and transformer (wikilink/image/frontmatter)`
  - Files: `scripts/sync-to-blog/src/parser.js`, `scripts/sync-to-blog/src/transformer.js`, `scripts/sync-to-blog/test/transform-*.js`, `scripts/sync-to-blog/test/fixtures/*.md`
  - Pre-commit: `node --test scripts/sync-to-blog/test/`

- [x] 7. **LLM 元数据推断模块（6 步降级链 + Zod 校验）**

  **What to do**:
  - 实现 `src/llm.js` 暴露 `inferMetadata({ fileName, markdown, frontmatter, manifestEntry })`:
    - **降级链（严格执行）**：
      ```
      Step 1: 若 manifestEntry 已存在且 llmResult 已缓存 → 返回缓存值
      Step 2: 若 fileName 是纯 ASCII → slugify(fileName via @sindresorhus/slugify)
              其他字段从 markdown 推断（无 LLM）：title=H1/fileName, description=首段 100 字, category 默认 'uncategorized', tags=[]
              返回（不调用 LLM，零成本）
      Step 3: 调用 LLM（仅当 fileName 非 ASCII 或步骤 2 字段推断不足）：
              Prompt: "Based on this Chinese note filename '{fileName}' and first 500 chars of content, infer:
                       slug (URL-safe lowercase, 3-80 chars, /^[a-z0-9-]+$/),
                       title (1-200 chars),
                       description (10-300 chars),
                       category (1-50 chars, English or Chinese OK),
                       tags (max 10). Respond JSON."
              - timeoutMs: 10000
              - maxRetries: 2
              - temperature: 0
              - 用 LLMOutputSchema (Zod) 校验响应；校验失败 → 重试
              - 累计 cost 跟踪，超过 config.maxCostPerSync → 跳到 step 4
              - 缓存成功的 llmResult 到 manifestEntry.llmResult（实现幂等性）
      Step 4: pinyin 转换（pinyin-pro, 无声调, 小写）→ slugify
              title/description/category 同 step 2 fallback
      Step 5: hash-based slug: `note-${sha256(fileName).slice(0,8)}`
      Step 6: 唯一性检查 + 碰撞处理：
              - 查 manifest 所有 entries 的 slug
              - 查博客仓库现有 content/posts/* 目录
              - 若碰撞: 加 `-2`, `-3` 后缀
              - 若与 manifest 中其他 notePath 的 entry 碰撞 → ERROR（人工解决）
      ```
  - 实现 `callLLM(prompt, opts)` 通用函数：
    - 支持 OpenAI-compatible API（GLM/Claude/OpenAI 等）via fetch
    - 失败/超时 → throw，由调用方决定降级
  - 实现 cost tracker：累计本次 sync 的 LLM 调用费用（粗估）

  **Must NOT do**:
  - 不要在 manifest 已缓存 llmResult 时再调 LLM
  - 不要让 LLM 决定 security 相关操作（仅元数据推断）
  - 不要超过 maxRetries 或 maxCostPerSync
  - 不要 trust LLM 输出未通过 Zod 校验的结果
  - 不要用 LLM 重写内容

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: 6 步降级链逻辑复杂，需要严格测试边界
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2
  - **Blocks**: T12
  - **Blocked By**: T4, T5

  **References**:
  - **External References**:
    - ZhipuAI GLM API: `https://open.bigmodel.cn/dev/api`
    - `pinyin-pro`: `https://github.com/mozillazg/pinyin-pro`
    - `@sindresorhus/slugify`: `https://github.com/sindresorhus/slugify`
  - **WHY**: 选 GLM 因为用户项目上下文显示已知该模型; OpenAI-compatible 接口让 fallback 到其他模型简单

  **Acceptance Criteria**:
  - [ ] `inferMetadata()` 对 ASCII 文件名不调用 LLM
  - [ ] `inferMetadata()` 对中文文件名调用 LLM，超时/失败时降级到 pinyin
  - [ ] pinyin 失败时降级到 hash slug
  - [ ] 碰撞时附加 `-2/-3` 后缀
  - [ ] LLM 输出通过 LLMOutputSchema 校验后才使用
  - [ ] manifest 缓存命中时不调 LLM
  - [ ] 累计 cost 跟踪准确

  **QA Scenarios**:
  ```
  Scenario: ASCII 文件名零 LLM 调用
    Tool: Bash (node)
    Preconditions: fixture note 'closures.md'
    Steps:
      1. 设置 mock LLM 调用计数器
      2. inferMetadata({ fileName: 'closures.md', ... })
      3. 断言 mock LLM 未被调用
      4. 断言 slug === 'closures'
    Expected Result: 零 LLM 调用, slug 来自 slugify
    Evidence: .sisyphus/evidence/task-7-ascii-no-llm.txt

  Scenario: 中文文件名调 LLM 并缓存
    Tool: Bash (node)
    Preconditions: fixture note '闭包.md', LLM_API_KEY 设置或 mock
    Steps:
      1. inferMetadata({ fileName: '闭包.md', manifestEntry: null }) → 应调 LLM
      2. 记录返回的 slug（如 'closure'）
      3. inferMetadata({ fileName: '闭包.md', manifestEntry: {llmResult: ...缓存} }) → 应不调 LLM
      4. 断言第二次返回的 slug 与第一次相同
    Expected Result: 首次调 LLM 后缓存, 幂等
    Evidence: .sisyphus/evidence/task-7-llm-cache.txt

  Scenario: LLM 超时降级到 pinyin
    Tool: Bash (node)
    Preconditions: 设置 LLM_BASE_URL 指向不可达地址（模拟超时）
    Steps:
      1. inferMetadata({ fileName: '闭包.md' })
      2. 断言最终 slug === 'bi-bao'（pinyin 无声调）或 'bao-bi'（取决于词典；记录实际值即可）
      3. 断言 warnings 含 LLM 失败记录
    Expected Result: 降级链正常工作
    Evidence: .sisyphus/evidence/task-7-llm-fallback.txt

  Scenario: 碰撞处理
    Tool: Bash (node)
    Preconditions: manifest 已有 entry slug='closure'
    Steps:
      1. inferMetadata 一个新文件，LLM 返回 slug='closure'
      2. 断言最终 slug === 'closure-2'
    Expected Result: 碰撞时附加后缀
    Evidence: .sisyphus/evidence/task-7-slug-collision.txt
  ```

  **Commit**: YES
  - Message: `feat(sync): LLM metadata inference with 6-step fallback chain`
  - Files: `scripts/sync-to-blog/src/llm.js`, `scripts/sync-to-blog/test/llm-*.js`
  - Pre-commit: `node --test scripts/sync-to-blog/test/`

- [x] 8. **图片资源处理器（Obsidian 路径解析 + sha256 去重 + 复制）**

  **What to do**:
  - 实现 `src/images.js`：
    - `resolveImagePath(imageName, notePath, config)`: 复刻 Obsidian "shortest path when possible" 解析：
      1. 先查 notePath 同目录的 imageName
      2. 再查 `config.notesRepo.rootPath + '/' + 配置的 attachmentFolderPath + '/' + imageName`（默认 `zob-source/images/`）
      3. 再全局搜索（在 excludeDirs 之外）找 shortest unique path
      4. 找不到 → 返回 null（broken image，由 transformer 记 warning）
    - `computeImageHash(absPath)`: 读文件 + sha256 hex
    - `planImageCopy(absPath, blogImageDir)`: 返回 `{ sourcePath, destPath, hash, destFileName }`
      - destFileName = `${hash.slice(0,16)}-${原文件名}` （content-addressed，避免冲突）
    - `copyImages(plannedCopies)`: 实际 fs.copyFile，返回写入的路径数组
    - `findOrphanImages(manifest, currentNoteSlugs)`: 返回 manifest 中记录但当前已发布笔记都不引用的图片（用于 GC）
  - 支持格式: png, jpg, jpeg, gif, webp, svg（配置可扩展）
  - **不支持**: pdf, mp4, mp3, excalidraw → 调用方收到 error 而非 silent skip

  **Must NOT do**:
  - 不要复制二进制非图片附件
  - 不要重复复制同一文件（按 hash 去重）
  - 不要用源文件名直接做 destFileName（可能冲突）

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: 文件 IO + 算法逻辑，需要测试覆盖
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2
  - **Blocks**: T12
  - **Blocked By**: T4, T5

  **References**:
  - **Pattern References**: 
    - Obsidian 附件解析逻辑: `https://help.obsidian.md/Linking+notes+and+files/Internal+links#Linking+to+a+file+in+another+folder`
    - `F:\MarkDown\Markdown_Repository\.obsidian\app.json` - `attachmentFolderPath: "zob-source/images"`
  - **WHY**: 准确复刻 Obsidian 路径解析否则会大量 broken image

  **Acceptance Criteria**:
  - [ ] `resolveImagePath()` 对同目录图片命中
  - [ ] `resolveImagePath()` 对 zob-source/images/ 中的图片命中
  - [ ] `resolveImagePath()` 对不存在图片返回 null
  - [ ] `computeImageHash()` 对同内容文件返回相同 hash
  - [ ] `copyImages()` 不重复复制相同 hash 文件
  - [ ] 非 supported 格式抛出 error
  - [ ] `findOrphanImages()` 正确识别无引用图片

  **QA Scenarios**:
  ```
  Scenario: 路径解析优先级
    Tool: Bash (node)
    Preconditions: 
      - fixture note at test/fixtures/note.md
      - fixture image at test/fixtures/note/a.png (同目录)
      - fixture image at test/fixtures/zob-source/images/a.png (全局)
    Steps:
      1. resolveImagePath('a.png', 'test/fixtures/note.md') → 应返回同目录的
      2. resolveImagePath('b.png', 'test/fixtures/note.md') → 应返回 zob-source 路径
      3. resolveImagePath('missing.png', ...) → null
    Expected Result: 优先级正确
    Evidence: .sisyphus/evidence/task-8-image-path-resolution.txt

  Scenario: 去重复制
    Tool: Bash (node)
    Steps:
      1. 复制 a.png 两次（不同源路径，相同内容）
      2. 断言目标目录只有 1 个文件
      3. 断言文件名含 hash
    Expected Result: 去重生效
    Evidence: .sisyphus/evidence/task-8-image-dedup.txt

  Scenario: 非图片格式报错
    Tool: Bash (node)
    Steps:
      1. copyImages([{ sourcePath: 'x.pdf', ... }])
      2. 断言 throw Error with "unsupported format"
    Expected Result: 明确 error 而非 silent skip
    Evidence: .sisyphus/evidence/task-8-unsupported-format.txt
  ```

  **Commit**: YES
  - Message: `feat(sync): image asset handler with Obsidian path resolution and dedup`
  - Files: `scripts/sync-to-blog/src/images.js`, `scripts/sync-to-blog/test/images-*.js`, `scripts/sync-to-blog/test/fixtures/**/*.png`
  - Pre-commit: `node --test scripts/sync-to-blog/test/`

- [x] 9. **博客仓库 git 客户端（clone/branch/commit/push via octokit）**

  **What to do**:
  - 实现 `src/blog-git.js` 用 `simple-git` + `@octokit/rest`：
    - `cloneBlogRepo({ baseUrl, pat, targetDir, branch })`:
      - baseUrl 嵌入 PAT: `https://x-access-token:${PAT}@github.com/Azuxa616/blog-refactor.git`
      - 浅克隆 (--depth=1) 指定分支
    - `createBranch(repoDir, branchName, fromBranch='main')`
    - `writeFiles(repoDir, files)`: files = `[{ path: 'content/posts/slug/index.md', content: '...' }, ...]`
    - `deleteFiles(repoDir, paths)`: paths = `['content/posts/old-slug/', ...]`
    - `commitAndPush(repoDir, message, branchName)`:
      - git add -A
      - git commit -m message（设置 bot 身份: `sync-bot <noreply@azuxa616.local>`）
      - git push origin branchName
    - `pushManifestUpdate(notesRepoDir, manifestContent)`:
      - 在笔记仓库写 manifest.json
      - git add + commit + push（用 GITHUB_TOKEN，不是 PAT——因为是同仓库）
  - 所有 git 操作实现错误处理 + 重试（指数退避，最多 3 次，处理网络抖动）

  **Must NOT do**:
  - 不要把 PAT 写入日志/文件/异常信息
  - 不要 force-push
  - 不要在博客仓库 main 分支直接 commit（必须走 branch）
  - 不要把笔记仓库的 PAT 用于博客仓库（用 BLOG_REPO_PAT）
  - 不要在 push 失败时静默继续

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: 涉及 git 操作 + GitHub API + 安全敏感的 PAT 处理
  - **Skills**: [`git-master`]
    - `git-master`: 多种 git 操作模式与安全实践

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2
  - **Blocks**: T12
  - **Blocked By**: T1 (remote), T4 (scaffold)

  **References**:
  - **External References**:
    - `simple-git`: `https://github.com/steveukx/git-js`
    - `@octokit/rest`: `https://octokit.github.io/rest.js/`
    - GitHub PAT in URL: `https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens`
  - **WHY**: PAT-in-URL 是 GitHub 推荐的 Actions 内 git push 方式

  **Acceptance Criteria**:
  - [ ] `cloneBlogRepo()` 成功克隆到指定目录
  - [ ] `createBranch()` 创建分支并切换
  - [ ] `writeFiles()` 写入多文件
  - [ ] `deleteFiles()` 删除指定路径（含目录）
  - [ ] `commitAndPush()` 成功 push 到远端
  - [ ] 失败重试逻辑工作（用不可达 remote 模拟）
  - [ ] 日志中无 PAT 字符串

  **QA Scenarios**:
  ```
  Scenario: 完整 git 操作链路
    Tool: Bash (node)
    Preconditions: T1 完成（remote 存在），T2 完成（PAT 配置）
    Steps:
      1. 临时分支: 'test/sync-task-9-<timestamp>'
      2. cloneBlogRepo({ ..., branch: 'main' })
      3. createBranch(repoDir, 'test/sync-task-9-...')
      4. writeFiles(repoDir, [{path: 'content/posts/test-task-9/index.md', content: '---\ntitle: Test\nslug: test-task-9\n...\n---\n# Hi'}])
      5. commitAndPush(repoDir, 'test: sync task 9 verification', branchName)
      6. 验证 GitHub: gh api repos/Azuxa616/blog-refactor/contents/content/posts/test-task-9/index.md?ref=test/sync-task-9-...
      7. 清理: gh api -X DELETE repos/Azuxa616/blog-refactor/git/refs/heads/test/sync-task-9-...
    Expected Result: 文件成功 push, gh api 返回 200, 分支被清理
    Failure Indicators: push 失败 / 文件不存在 / PAT 泄露
    Evidence: .sisyphus/evidence/task-9-git-flow.txt

  Scenario: PAT 不出现在日志
    Tool: Bash
    Steps:
      1. 设置 dummy PAT env var
      2. 运行 git 客户端在 verbose 模式
      3. grep "<PAT>" 在 stdout + stderr
    Expected Result: 0 匹配
    Evidence: .sisyphus/evidence/task-9-no-pat-leak.txt
  ```

  **Commit**: YES
  - Message: `feat(sync): blog repo git client (clone/branch/commit/push via simple-git + octokit)`
  - Files: `scripts/sync-to-blog/src/blog-git.js`, `scripts/sync-to-blog/test/blog-git-*.js`
  - Pre-commit: `node --test scripts/sync-to-blog/test/`

- [x] 10. **PR 创建器（生命周期: 新建/更新已 open PR）**

  **What to do**:
  - 实现 `src/pr.js` 用 `@octokit/rest`：
    - `findOpenSyncPR(octokit, owner, repo)`: 
      - 查询 `GET /repos/{owner}/{repo}/pulls?state=open`
      - 过滤 head 开始 with `sync/` 或 label 含 `sync-to-blog`
      - 返回首个匹配或 null
    - `createSyncPR({ octokit, owner, repo, branchName, title, body, labels })`:
      - head: `<owner>:<branchName>` (fork 模式) 或 `<branchName>` (同仓库)
      - base: `main`
      - labels: `['sync-to-blog', 'automated']`
    - `updateSyncPR({ octokit, owner, repo, prNumber, title, body })`:
      - PATCH /pulls/{pr_number}
    - `ensureBranchBase(octokit, owner, repo, branchName)`:
      - 检查分支 base 是否落后于 main 太多
      - 如落后，创建新分支 from main 并关闭旧 PR（防 stale）
    - `generatePRBody({ added, updated, removed, failed, llmCost, warnings, deployGapWarning })`:
      - Markdown 表格: 笔记路径 | 状态 (added/updated/removed) | slug | 备注
      - 失败列表: 笔记 + 错误原因
      - 警告列表
      - **deploy gap 警告**: "⚠️ 合并此 PR 不会自动部署博客。请手动执行 [部署步骤](...)。"
      - LLM 成本摘要: `$0.0234 used of $0.5000 budget`

  **Must NOT do**:
  - 不要 auto-merge
  - 不要在 body 中泄露 secrets
  - 不要同时维护多个 sync PR（同源只一个）
  - 不要 stale PR 永久存在（落后 main 太多时关闭）

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: GitHub API 集成 + 生命周期管理逻辑
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2
  - **Blocks**: T12
  - **Blocked By**: T1, T2 (PAT), T4

  **References**:
  - **External References**:
    - Octokit PR API: `https://octokit.github.io/rest.js/v20#pulls`
    - PR lifecycle patterns: `https://docs.github.com/en/rest/pulls`
  - **WHY**: 同源单 PR 模型简化用户 review

  **Acceptance Criteria**:
  - [ ] `findOpenSyncPR()` 在无 sync PR 时返回 null
  - [ ] `createSyncPR()` 成功创建 PR 含正确 labels
  - [ ] `updateSyncPR()` PATCH 现有 PR
  - [ ] 同源分支已有 open PR 时不再创建新 PR
  - [ ] `generatePRBody()` 输出含 deploy gap 警告
  - [ ] PR body 不含 PAT 或敏感信息

  **QA Scenarios**:
  ```
  Scenario: PR 生命周期管理
    Tool: Bash (node)
    Preconditions: T9 完成可写博客仓库
    Steps:
      1. 第一次调用 createSyncPR → 应创建 PR #N
      2. 第二次调用同一源 → 应更新 PR #N（不创建新的）
      3. 关闭 PR #N → 再次调用 → 应创建新 PR #(N+1)
    Expected Result: 单 PR 模型工作
    Evidence: .sisyphus/evidence/task-10-pr-lifecycle.txt

  Scenario: PR body 含 deploy gap 警告
    Tool: Bash
    Steps:
      1. 生成 PR body (用任意 fixture 数据)
      2. grep "deploy" in body
      3. grep "merge" in body
    Expected Result: 含明确警告文字
    Evidence: .sisyphus/evidence/task-10-pr-body.txt
  ```

  **Commit**: YES
  - Message: `feat(sync): PR creator with single-open-PR lifecycle and deploy-gap warning`
  - Files: `scripts/sync-to-blog/src/pr.js`, `scripts/sync-to-blog/test/pr-*.js`
  - Pre-commit: `node --test scripts/sync-to-blog/test/`

- [x] 11. **笔记仓库模板字段重命名 + 文档**

  **What to do**:
  - 修改 `F:\MarkDown\Markdown_Repository\template\通用笔记模板.md`:
    - frontmatter 字段 `published:` → `publish:`
    - 加注释（YAML 注释）说明 `publish: true` 触发博客同步
  - 修改 `F:\MarkDown\Markdown_Repository\template\通用日记模板.md`（如果适用）
  - 全局 grep 旧字段使用：`Get-ChildItem -Recurse -Filter *.md | Select-String "^published:"`
    - 列出所有用了 `published:` 的笔记
    - **不自动批量修改**（防止误改）→ 仅生成报告 `docs/published-field-migration.md` 列出待迁移笔记
    - 用户后续手动批量替换或单独处理
  - 在笔记仓库根 `README.md` 增补章节 "Blog Sync":
    - 简短说明流程
    - 链接到 `scripts/sync-to-blog/README.md`
    - 说明 `publish: true` 是发布的开关

  **Must NOT do**:
  - 不要自动批量改笔记的 frontmatter（防止破坏）
  - 不要新增其他模板字段（仅 rename）
  - 不要改笔记仓库其他配置

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 模板字段重命名 + 文档更新
  - **Skills**: [`git-master`]
    - `git-master`: 涉及多文件 grep 与谨慎修改

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2
  - **Blocks**: None（独立 task，无下游）
  - **Blocked By**: None

  **References**:
  - **Pattern References**: `F:\MarkDown\Markdown_Repository\template\通用笔记模板.md`

  **Acceptance Criteria**:
  - [ ] `template\通用笔记模板.md` 字段为 `publish:`（无 `published:`）
  - [ ] `docs/published-field-migration.md` 列出所有用了 `published:` 的笔记
  - [ ] 根 `README.md` 含 "Blog Sync" 章节

  **QA Scenarios**:
  ```
  Scenario: 模板字段已重命名
    Tool: Bash
    Steps:
      1. Get-Content template\通用笔记模板.md | Select-String "^publish:" → 应有匹配
      2. Get-Content template\通用笔记模板.md | Select-String "^published:" → 应无匹配
    Expected Result: 重命名生效
    Evidence: .sisyphus/evidence/task-11-template-rename.txt

  Scenario: 迁移报告完整
    Tool: Bash
    Steps:
      1. Read docs/published-field-migration.md
      2. 报告应列出所有 .md 文件含 '^published:' 的清单
      3. 手动重新跑 grep 验证报告准确
    Expected Result: 报告完整准确
    Evidence: .sisyphus/evidence/task-11-migration-report.txt
  ```

  **Commit**: YES
  - Message: `chore(template): rename frontmatter field published → publish and document sync flow`
  - Files: `template\通用笔记模板.md`, `template\通用日记模板.md`（如适用）, `README.md`, `docs/published-field-migration.md`
  - Pre-commit: 无

- [x] 12. **同步编排器（orchestrator，组合 T6-T10）**

  **What to do**:
  - 实现 `src/orchestrator.js` 暴露 `runSync({ config, manifest, notesRepoDir, dryRun })`:
    - **完整流程**：
      1. **扫描阶段**: 遍历 `config.notesRepo.blogSourceDirs` 下所有 `.md` 文件
      2. **过滤阶段**: 用 parser.js 解析 frontmatter，过滤出 `publish === true` 的笔记
      3. **批量上限**: 若笔记数 > `maxNotesPerRun` (50)，超出部分写入 skipped 报告并停止
      4. **差异计算**: 对每篇笔记计算 sha256(markdown 原文) 与 manifest 中 contentHash 对比
         - 一致 → skip（已同步且无改动）
         - 不一致 → 加入 toProcess
      5. **取消检测**: manifest 中存在但本次扫描未出现 publish:true 的笔记 → 加入 toRemove
      6. **逐篇处理**（per-note atomic）：
         - 调 `inferMetadata()` (T7)
         - 调 `transform()` (T6)
         - 调 `planImageCopy()` (T8) 收集所需图片
         - 收集结果到 batch
         - 单篇失败 → 记录到 failedList，继续下一篇
      7. **批量上限（PR 维度）**: 若 toProcess + toRemove > `maxNotesPerPr` (20)，分批：
         - 当前批次结束，进入"提交阶段"，剩余下次 sync 处理
      8. **提交阶段**（atomic，按顺序）：
         a. 调 `cloneBlogRepo()` (T9)
         b. 调 `createBranch()` 'sync/<timestamp>'
         c. 调 `writeFiles()` 写所有新/更新笔记的 index.md + 复制图片
         d. 调 `deleteFiles()` 删除所有 toRemove 笔记的目录 + GC 图片
         e. 调 `commitAndPush()` 推送到博客仓库
         f. 仅在 (e) 成功后：调 `createSyncPR()` 或 `updateSyncPR()` (T10)
         g. 仅在 (f) 成功后：写回 manifest（含新 entries + 删除 entries + llmResult 缓存 + lastSyncedAt）
         h. 调 `pushManifestUpdate()` 推送到笔记仓库
      9. **PR body 生成**: 含 added/updated/removed/failed/llmCost/warnings/deployGapWarning
    - **dryRun=true**: 跳过 8-9，仅打印计划
    - **错误处理**:
      - LLM 失败 → 由 T7 内部 fallback 处理
      - 单篇 transform 失败 → 加入 failedList
      - git push 失败 → 重试 3 次（T9 内部），仍失败则抛出
      - PR 创建失败 → 不写 manifest（保证 manifest 与博客一致）

  **Must NOT do**:
  - 不要在 manifest 写入前创建 PR（顺序必须先 PR 后 manifest）
  - 不要在 git push 失败后写 manifest
  - 不要在同一 sync 内处理超过 maxNotesPerRun 笔记
  - 不要在 dry-run 模式修改任何远端

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: 系统集成，需要严密的状态管理与错误恢复
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO（核心集成）
  - **Parallel Group**: Sequential within Wave 3
  - **Blocks**: T16, T17, T18
  - **Blocked By**: T6, T7, T8, T9, T10（所有核心 primitive）

  **References**:
  - **Pattern References**: 自己生成的 src/*.js 各模块接口（T6-T10）
  - **WHY**: 编排器是胶水代码，需严格按各模块接口契约

  **Acceptance Criteria**:
  - [ ] `runSync()` 完整流程可在 dry-run 模式跑通
  - [ ] per-note 失败不影响其他笔记
  - [ ] manifest 仅在 PR 成功后写入
  - [ ] 同状态二次运行（已全部 sync）只产生 skip 不产生 PR
  - [ ] maxNotesPerRun 上限强制执行
  - [ ] maxNotesPerPr 上限触发分批

  **QA Scenarios**:
  ```
  Scenario: 完整 dry-run
    Tool: Bash (node)
    Preconditions: 3 fixture 笔记含 publish:true，空 manifest
    Steps:
      1. node index.js --dry-run --verbose
      2. 检查 stdout:
         - 应列出 3 篇笔记待添加
         - 应列出每篇的 slug
         - 应不创建任何文件、不 push、不创建 PR
      3. 检查笔记仓库 git status: 应无改动
    Expected Result: dry-run 完全只读
    Evidence: .sisyphus/evidence/task-12-dry-run.txt

  Scenario: 幂等性
    Tool: Bash (node)
    Preconditions: manifest 中已有 3 篇笔记的 entries，对应 contentHash 与当前文件一致
    Steps:
      1. node index.js --dry-run
      2. 检查 stdout: 应显示 "0 added, 0 updated, 0 removed, 3 skipped"
    Expected Result: 完全幂等
    Evidence: .sisyphus/evidence/task-12-idempotent.txt

  Scenario: 单篇失败不影响其他
    Tool: Bash (node)
    Preconditions: 3 笔记，其中 1 篇故意 YAML 解析错误
    Steps:
      1. node index.js --dry-run
      2. 检查 stdout: 应有 2 篇成功，1 篇在 failedList
    Expected Result: 错误隔离
    Evidence: .sisyphus/evidence/task-12-partial-failure.txt
  ```

  **Commit**: YES
  - Message: `feat(sync): orchestrator combining all primitives with atomic semantics`
  - Files: `scripts/sync-to-blog/src/orchestrator.js`, `scripts/sync-to-blog/test/orchestrator-*.js`
  - Pre-commit: `node --test scripts/sync-to-blog/test/`

- [x] 13. **Manifest 状态管理器（atomic 写入 + git 集成）**

  **What to do**:
  - 实现 `src/manifest.js`:
    - `loadManifest(jsonPath)`: 读 + Zod parse，不存在则初始化空 manifest
    - `saveManifestAtomic(jsonPath, manifestObj)`:
      - 写到 `<path>.tmp`
      - fsync + rename 到目标（POSIX 原子；Windows 上 rename 不完全原子但够用）
      - 校验写回的字节确实可解析
    - `applyChanges(manifest, { added, updated, removed })`:
      - added: 新 entry 追加
      - updated: 按 notePath 索引替换 contentHash/transformedHash/lastSyncedAt
      - removed: 按 notePath 过滤掉
      - 更新 `updatedAt`
      - 返回新 manifest（不 mutate 输入）
    - `findEntryByNotePath(manifest, notePath)` / `findEntryBySlug(manifest, slug)`
    - `getAllPublishedSlugs(manifest)`: 返回 Set 用于 wikilink 解析
    - `validateManifestIntegrity(manifest, notesRepoDir)`:
      - 每个 entry.notePath 在 notesRepoDir 中应存在
      - entry 的 transformedHash 应与对应博客 content/posts 文件 hash 一致（可选，跨仓库检查）
      - 返回 inconsistencies 列表
  - 与 git 集成：在 `pushManifestUpdate` 之前先 `saveManifestAtomic`，由 T9 的 git client 负责 push

  **Must NOT do**:
  - 不要直接 mutate manifest 对象（用 immutable 更新）
  - 不要在写入失败后认为 manifest 一致
  - 不要省略 `updatedAt` 更新

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: 状态管理 + atomic IO，需要严谨
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3
  - **Blocks**: T16, T17
  - **Blocked By**: T5 (schema), T9 (git client)

  **References**:
  - **Pattern References**: schemas.js (T5) 中的 ManifestSchema

  **Acceptance Criteria**:
  - [ ] `loadManifest` 不存在时初始化空 manifest
  - [ ] `saveManifestAtomic` 中断时（模拟）不破坏现有 manifest
  - [ ] `applyChanges` 正确处理 added/updated/removed
  - [ ] `validateManifestIntegrity` 检测到孤儿 entry
  - [ ] `getAllPublishedSlugs` 返回正确 Set

  **QA Scenarios**:
  ```
  Scenario: Atomic 写入失败回滚
    Tool: Bash (node)
    Preconditions: 现有 manifest.json
    Steps:
      1. 模拟写入失败（chmod 只读 / 强制 throw 在 rename 之前）
      2. saveManifestAtomic() 应抛出
      3. 检查 manifest.json: 应仍是原始内容
    Expected Result: 失败时不破坏现状
    Evidence: .sisyphus/evidence/task-13-atomic-rollback.txt

  Scenario: 完整 CRUD
    Tool: Bash (node)
    Steps:
      1. 空 manifest
      2. applyChanges({added: [entry1, entry2]}) → 应有 2 entries
      3. applyChanges({updated: [entry1']}) → entry1 替换
      4. applyChanges({removed: [entry2.notePath]}) → 只剩 entry1'
      5. validateManifestIntegrity → 应通过
    Expected Result: CRUD 正确
    Evidence: .sisyphus/evidence/task-13-manifest-crud.txt
  ```

  **Commit**: YES
  - Message: `feat(sync): manifest state manager with atomic writes and integrity validation`
  - Files: `scripts/sync-to-blog/src/manifest.js`, `scripts/sync-to-blog/test/manifest-*.js`
  - Pre-commit: `node --test scripts/sync-to-blog/test/`

- [x] 14. **CLI 入口（--dry-run / --note / --verbose / --batch-size）**

  **What to do**:
  - 实现 `scripts/sync-to-blog/index.js`（替换 T4 占位）：
    ```javascript
    import { Command } from 'commander'
    import { runSync } from './src/orchestrator.js'
    import { loadConfig } from './src/config.js'
    // ...
    
    const program = new Command()
    program
      .name('sync-to-blog')
      .description('Sync Obsidian notes to Astro blog via cross-repo PR')
      .option('-d, --dry-run', 'Plan only, no writes', false)
      .option('-v, --verbose', 'Verbose logging', false)
      .option('-n, --note <path>', 'Sync only this note (relative path)')
      .option('-b, --batch-size <n>', 'Override maxNotesPerPr', parseInt)
      .option('--config <path>', 'Config file path', '.blog-sync/config.json')
      .action(async (opts) => {
        // load config + manifest
        // if opts.note: filter toProcess
        // runSync(...)
        // exit code: 0 if no errors, 1 if any failed
      })
    
    program.parseAsync(process.argv)
    ```
  - 退出码：
    - 0: 全部成功或全部 skipped
    - 1: 有 failed 笔记（但其他成功）
    - 2: 致命错误（git push 失败、配置错误等）
  - 日志: 用 `pino`，verbose → debug level，否则 info
  - 错误打印到 stderr，正常输出到 stdout
  - 在 dry-run 模式打印完整 plan（哪些 add/update/remove/skip/fail，每篇的 slug、images、warnings）

  **Must NOT do**:
  - 不要在 dry-run 模式调用任何写操作（git/PR/manifest）
  - 不要把敏感信息打印到日志

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: CLI 包装层，逻辑简单
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3
  - **Blocks**: T15 (workflow 调用 CLI), T18 (测试)
  - **Blocked By**: T4 (scaffold), T12 (orchestrator)

  **References**:
  - **External References**: `commander` API

  **Acceptance Criteria**:
  - [ ] `node index.js --help` 列出所有 options
  - [ ] `node index.js --dry-run` 不修改任何文件
  - [ ] `node index.js --note path/to/note.md` 只处理该笔记
  - [ ] `node index.js --batch-size 5` 覆盖 config
  - [ ] 退出码语义正确

  **QA Scenarios**:
  ```
  Scenario: Help 输出
    Tool: Bash
    Steps:
      1. node index.js --help
      2. 检查输出含 -d, -v, -n, -b, --config
    Expected Result: 所有选项可见
    Evidence: .sisyphus/evidence/task-14-cli-help.txt

  Scenario: Dry-run 零副作用
    Tool: Bash
    Steps:
      1. git status --short (笔记仓库)
      2. node index.js --dry-run
      3. git status --short (再次)
      4. 比较两次输出
    Expected Result: 完全相同
    Evidence: .sisyphus/evidence/task-14-dry-run-noop.txt

  Scenario: --note 过滤
    Tool: Bash
    Steps:
      1. fixture: 3 篇 publish:true 笔记
      2. node index.js --dry-run --note path/to/note1.md
      3. 检查输出: 只列 note1，不列 note2/note3
    Expected Result: 过滤生效
    Evidence: .sisyphus/evidence/task-14-note-filter.txt
  ```

  **Commit**: YES
  - Message: `feat(sync): CLI entry with dry-run, note filter, verbose, batch-size options`
  - Files: `scripts/sync-to-blog/index.js`
  - Pre-commit: `node index.js --help`

- [x] 15. **GitHub Actions workflow + concurrency group**

  **What to do**:
  - 创建 `.github/workflows/sync-to-blog.yml`:
    ```yaml
    name: Sync to Blog
    
    on:
      push:
        branches: [main]
        paths:
          - '**/*.md'
          - '.blog-sync/**'
          - 'scripts/sync-to-blog/**'
          - 'template/**'
      workflow_dispatch:  # 手动触发
    
    concurrency:
      group: sync-to-blog
      cancel-in-progress: false  # 排队不取消
    
    permissions:
      contents: write  # 用于 push manifest
    
    jobs:
      sync:
        runs-on: ubuntu-latest
        timeout-minutes: 15
        steps:
          - name: Checkout notes repo
            uses: actions/checkout@v4
            with:
              fetch-depth: 0  # full history for git first-commit date
            
          - name: Setup Node
            uses: actions/setup-node@v4
            with:
              node-version: '20'
          
          - name: Setup pnpm
            uses: pnpm/action-setup@v3
            with:
              version: 9
          
          - name: Install sync tool deps
            working-directory: scripts/sync-to-blog
            run: pnpm install --frozen-lockfile
          
          - name: Verify secrets present
            working-directory: scripts/sync-to-blog
            env:
              BLOG_REPO_PAT: ${{ secrets.BLOG_REPO_PAT }}
              LLM_API_KEY: ${{ secrets.LLM_API_KEY }}
              LLM_MODEL: ${{ secrets.LLM_MODEL }}
              LLM_BASE_URL: ${{ secrets.LLM_BASE_URL }}
            run: bash scripts/verify-secrets.sh
          
          - name: Run sync
            working-directory: scripts/sync-to-blog
            env:
              BLOG_REPO_PAT: ${{ secrets.BLOG_REPO_PAT }}
              LLM_API_KEY: ${{ secrets.LLM_API_KEY }}
              LLM_MODEL: ${{ secrets.LLM_MODEL }}
              LLM_BASE_URL: ${{ secrets.LLM_BASE_URL }}
              GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}  # for manifest push
            run: node index.js --verbose
    ```
  - 在 README 说明触发条件、并发模型、手动触发方式

  **Must NOT do**:
  - 不要使用 `cancel-in-progress: true`（会丢工作）
  - 不要把 secrets 直接写进 yaml
  - 不要省略 timeout-minutes（防挂死）
  - 不要在 workflow 中使用 `${{ secrets.* }}` 在 run 命令的字符串中（用 env 注入）

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 单一 yaml 文件 + 文档
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3
  - **Blocks**: T18
  - **Blocked By**: T2 (secrets), T14 (CLI)

  **References**:
  - **External References**:
    - GitHub Actions concurrency: `https://docs.github.com/en/actions/using-jobs/using-concurrency`
    - Action examples: `https://github.com/actions/checkout`

  **Acceptance Criteria**:
  - [ ] `.github/workflows/sync-to-blog.yml` 存在
  - [ ] `concurrency` 块含 `cancel-in-progress: false`
  - [ ] secrets 全部通过 env 注入，不在 run 命令字符串中
  - [ ] paths filter 仅触发相关文件改动
  - [ ] workflow_dispatch 允许手动触发
  - [ ] README 含触发条件说明

  **QA Scenarios**:
  ```
  Scenario: workflow 文件语法合法
    Tool: Bash (actionlint 或 yamllint)
    Steps:
      1. yamllint .github/workflows/sync-to-blog.yml
      2. (可选) actionlint
    Expected Result: 无 lint 错误
    Evidence: .sisyphus/evidence/task-15-workflow-lint.txt

  Scenario: Concurrency 配置正确
    Tool: Bash
    Steps:
      1. grep "cancel-in-progress" .github/workflows/sync-to-blog.yml
      2. 应匹配 "false"
    Expected Result: 排队模式
    Evidence: .sisyphus/evidence/task-15-concurrency-config.txt

  Scenario: 手动触发可工作（集成测试）
    Tool: Bash (gh)
    Preconditions: T1-T14 全完成且 secrets 已配
    Steps:
      1. gh workflow run sync-to-blog.yml --repo Azuxa616/Markdown_Repository
      2. gh run watch (取最新 run)
      3. gh run view <id> --log
      4. 验证: run 成功; 博客仓库出现新 PR 或更新已有 PR
    Expected Result: workflow 完整跑通
    Evidence: .sisyphus/evidence/task-15-workflow-run.txt
  ```

  **Commit**: YES
  - Message: `ci(sync): add sync-to-blog workflow with concurrency group`
  - Files: `.github/workflows/sync-to-blog.yml`, `scripts/sync-to-blog/README.md` (增补)
  - Pre-commit: 无

- [x] 16. **错误处理 + 重试逻辑 + PR body 生成器**

  **What to do**:
  - 在 `src/orchestrator.js` 和各 primitive 中审计并加固错误处理：
    - **LLM 失败分类**: timeout / 4xx / 5xx / invalid output / cost exceeded
      - timeout/5xx → fallback to step 4 (pinyin)
      - 4xx → 立即 fallback（认证/配额问题）
      - invalid output → 重试 2 次后 fallback
      - cost exceeded → 全 sync 停止 LLM 调用，剩余笔记用 step 4
    - **git 失败重试**: 网络抖动用指数退避 (1s, 2s, 4s), 3 次仍失败 → throw
    - **GitHub API rate limit**: 检查 X-RateLimit-Remaining header, 低于阈值延迟
    - **Octokit 422 (validation)**: 不重试，记录到 failedList
  - 实现 `src/pr-body.js` 生成器（如未在 T10 完整实现）：
    - 结构化 sections:
      ```
      ## 📝 Sync Summary
      - Added: N
      - Updated: N
      - Removed: N
      - Failed: N
      - Skipped: N (already synced)
      
      ## 📊 Details
      | Note | Status | Slug | Notes |
      |------|--------|------|-------|
      | Blog/Drift/x.md | added | x | LLM inferred |
      
      ## ⚠️ Warnings
      - Missing image: y.png in note z
      
      ## ❌ Failed
      - path/to/note.md: YAML parse error at line 5
      
      ## 💰 LLM Cost
      $0.0234 used of $0.5000 budget (12 notes × ~$0.002/note)
      
      ## ⚠️ Deploy Gap
      合并此 PR 不会自动部署博客。请手动执行部署步骤。
      
      ## 🤖 Generated
      by sync-to-blog@<version> at <timestamp>
      ```
  - 加日志: pino structured logs, 关键事件 (start, batch_decision, primitive_calls, end)

  **Must NOT do**:
  - 不要在 fatal error 后继续执行后续步骤
  - 不要在 PR body 包含 PAT/secret
  - 不要无限重试

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: 错误处理路径多，需要细致
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4
  - **Blocks**: F1-F4
  - **Blocked By**: T12, T13

  **References**:
  - **Pattern References**: T10 的 PR body 接口

  **Acceptance Criteria**:
  - [ ] LLM timeout 时正确 fallback
  - [ ] git push 失败重试 3 次
  - [ ] rate limit 时延迟
  - [ ] PR body 含所有 sections (summary/details/warnings/failed/cost/deploy)
  - [ ] 日志结构化

  **QA Scenarios**:
  ```
  Scenario: LLM 失败 fallback
    Tool: Bash (node)
    Preconditions: LLM_BASE_URL 指向不可达
    Steps:
      1. 处理 1 篇中文笔记
      2. 应触发 pinyin fallback
      3. 日志应记录 "LLM failed, falling back to pinyin"
    Expected Result: 软降级
    Evidence: .sisyphus/evidence/task-16-llm-fallback-handling.txt

  Scenario: git push 重试
    Tool: Bash (node)
    Preconditions: 模拟网络抖动（断网后恢复）
    Steps:
      1. 触发 push
      2. 前 2 次失败，第 3 次成功
      3. 验证日志含 3 次尝试
    Expected Result: 重试成功
    Evidence: .sisyphus/evidence/task-16-git-retry.txt

  Scenario: PR body 完整
    Tool: Bash (node)
    Steps:
      1. 生成 PR body (用 fixture: 2 added, 1 updated, 1 failed, $0.05 cost)
      2. 检查输出含所有 sections
    Expected Result: 所有 sections 存在且数据正确
    Evidence: .sisyphus/evidence/task-16-pr-body.txt
  ```

  **Commit**: YES
  - Message: `feat(sync): robust error handling, retry logic, and structured PR body generator`
  - Files: `scripts/sync-to-blog/src/{orchestrator,pr-body,llm,blog-git}.js` (审计加固), `scripts/sync-to-blog/test/error-handling-*.js`
  - Pre-commit: `node --test scripts/sync-to-blog/test/`

- [x] 17. **图片 GC + 删除流程 + 批量首同步模式**

  **What to do**:
  - 实现 `src/gc.js`（图片垃圾回收）:
    - `findOrphanImages(manifest, notesRepoDir, currentPublishedNotes)`:
      - 对 manifest 中每个 entry.blogImagePath
      - 检查 entry.notePath 是否仍在 published 列表
      - 若否，检查该图片是否被其他 published entry 引用（hash 查重）
      - 若无人引用 → 加入 orphan 列表
    - `planImageDeletion(orphanList, blogRepoDir)`:
      - 返回需删除的 `public/blog-images/...` 路径列表
  - 在 orchestrator 集成 GC：
    - 处理 toRemove 笔记后，调 GC 找 orphan → 加入 deleteFiles 列表
  - **批量首同步模式**:
    - 当 manifest 为空（首次 sync）且 toProcess > maxNotesPerPr 时：
      - 触发 "bootstrap mode"
      - 按 maxNotesPerPr 分批
      - 每批一个 PR（按时间戳编号）
      - PR body 注明 "Bootstrap batch X/Y"
      - 关闭当前 PR 不触发下一批；下一批需要再次 push 触发
      - 在 README 说明此模式
  - 在 README 添加 "Cancellation and GC" 章节

  **Must NOT do**:
  - 不要 GC 当前仍被其他笔记引用的图片
  - 不要在批量模式下一次性创建多个 PR（仍按 sync 触发顺序）
  - 不要删除笔记仓库的源图片

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: 涉及引用追踪算法 + 流程分支
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4
  - **Blocks**: F1-F4
  - **Blocked By**: T12, T13

  **References**:
  - **Pattern References**: T8 的 findOrphanImages 接口

  **Acceptance Criteria**:
  - [ ] 单一图片被多笔记引用时，删一笔记不删图片
  - [ ] 最后一个引用笔记删除时，图片被列入删除
  - [ ] 首次 sync 100 篇时自动分批（5 个 PR）
  - [ ] 批次编号正确

  **QA Scenarios**:
  ```
  Scenario: 引用计数 GC
    Tool: Bash (node)
    Preconditions:
      - 2 笔记都引用 img.png
      - manifest 含 2 entries
    Steps:
      1. 处理 toRemove: [note1]
      2. findOrphanImages → 应为空（note2 还在引用）
      3. 处理 toRemove: [note2]
      4. findOrphanImages → 应含 img.png
    Expected Result: GC 正确
    Evidence: .sisyphus/evidence/task-17-gc-refcount.txt

  Scenario: Bootstrap 批量
    Tool: Bash (node)
    Preconditions: 空 manifest, 25 篇 publish:true
    Steps:
      1. node index.js --dry-run --batch-size 5
      2. 检查输出: 应只显示前 5 篇 will-be-added
      3. 注释说明 "Bootstrap batch 1/5"
    Expected Result: 分批生效
    Evidence: .sisyphus/evidence/task-17-bootstrap-batch.txt
  ```

  **Commit**: YES
  - Message: `feat(sync): image GC, deletion flow, and bootstrap batch mode`
  - Files: `scripts/sync-to-blog/src/gc.js`, `scripts/sync-to-blog/src/orchestrator.js` (集成 GC), `scripts/sync-to-blog/README.md`
  - Pre-commit: `node --test scripts/sync-to-blog/test/`

- [x] 18. **端到端 dry-run 测试场景 + 文档（含 deploy gap 说明）**

  **What to do**:
  - 创建 `scripts/sync-to-blog/test/e2e/` 端到端测试：
    - `e2e-happy-path.js`: fixture 笔记 → dry-run → 验证 plan 输出
    - `e2e-cancellation.js`: 模拟 publish:true → false → dry-run → 验证 toRemove
    - `e2e-bootstrap.js`: 空 manifest + 多笔记 → dry-run → 验证分批
    - `e2e-llm-fallback.js`: 模拟 LLM 不可达 → dry-run → 验证 fallback 路径
    - `e2e-image-transform.js`: fixture 含图片 → dry-run → 验证 transform 输出
  - 完善 `scripts/sync-to-blog/README.md`:
    - 项目概览 + 架构图
    - **deploy gap 章节**: "合并 PR 不会自动部署博客。请手动执行: ..."
    - **Known Limitations 章节**（v1 已知限制，明示用户）:
      - **反向引用不会自动更新**：若笔记 A 已发布且含 wikilink `[[B]]`，当时 B 未发布则 A 中渲染为纯文本 "B"。后续给 B 加 `publish: true` 触发 sync 时，B 会作为 added 处理，但 **A 的 contentHash 未变 → 被 skip**，A 中的 `[[B]]` 仍是纯文本，不会自动升级为 `/articles/{b-slug}` 链接。
        - **手动解法**：编辑 A 笔记（任意改动即可，如末尾加空行），触发 contentHash 变化，下次 sync 会重新转换并更新链接
        - **v2 计划**：维护 `referencedBy` 反向引用图，B 新发布时自动把所有引用方加入 toProcess（本期不实现）
      - **工具版本漂移**：若 sync 工具的 transformer 逻辑升级（如 wikilink 转换规则变化），已发布的笔记 contentHash 未变 → skipped，不会按新逻辑重新转换。
        - **手动解法**：删 manifest 中对应 entry 的 transformedHash 字段，或整条 entry，下次 sync 会重新转换
        - **v2 计划**：manifest 加 `toolVersion` 字段，工具版本不匹配时强制重新转换全部（本期不实现）
      - **博客 schema 变化**：若博客 `src/content.config.ts` 加了新必填字段，旧 manifest 缓存的 `llmResult` 可能不含该字段，Zod 校验失败。
        - **手动解法**：手动编辑 manifest 删除受影响笔记的 `llmResult` 缓存，下次 sync 重新推断
        - **v2 计划**：`llmResult` 加 schema 版本号，不匹配时丢弃缓存重推断（本期不实现）
    - 故障排查
    - 配置参考
    - 开发指南
  - 完善 `docs/architecture.md`:
    - 同步流程时序图（mermaid）
    - 模块依赖图
    - 错误处理矩阵
  - 在博客仓库根 README.md 增补 "Content sync" 章节说明博客接收 sync PR 的方式

  **Must NOT do**:
  - 不要在 dry-run 测试中调真实 LLM API（用 mock 或 env）
  - 不要省略 deploy gap 警告

  **Recommended Agent Profile**:
  - **Category**: `writing`
    - Reason: 主要是文档撰写 + 测试场景设计
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4
  - **Blocks**: F1-F4
  - **Blocked By**: T12, T15

  **References**:
  - **Pattern References**: 各 task 的 QA scenarios（汇总成 e2e 测试）

  **Acceptance Criteria**:
  - [ ] 所有 e2e 测试可通过 `node --test test/e2e/` 运行
  - [ ] README 含完整章节（含 deploy gap）
  - [ ] README 含 "Known Limitations" 章节，覆盖反向引用、工具版本漂移、schema 变化三种 case，且每种都给出手动解法
  - [ ] architecture.md 含时序图
  - [ ] 博客根 README 含 content sync 章节

  **QA Scenarios**:
  ```
  Scenario: E2E 测试套件全通过
    Tool: Bash
    Steps:
      1. cd scripts/sync-to-blog
      2. node --test test/e2e/
    Expected Result: 所有 e2e 测试 PASS
    Evidence: .sisyphus/evidence/task-18-e2e-suite.txt

  Scenario: 文档完整
    Tool: Bash
    Steps:
      1. grep "deploy gap" README.md → 应有匹配
      2. grep "Content sync" F:\MyProjects\blog-Azx616\blog-refactor\README.md → 应有匹配
      3. grep "sequenceDiagram" docs/architecture.md → 应有匹配
    Expected Result: 所有文档完整
    Evidence: .sisyphus/evidence/task-18-docs-completeness.txt

  Scenario: Known Limitations 章节完整
    Tool: Bash
    Preconditions: README.md 已写好
    Steps:
      1. grep -c "Known Limitations" README.md → 应 >= 1
      2. grep "反向引用" README.md → 应有匹配
      3. grep "工具版本" README.md → 应有匹配
      4. grep "schema 变化" README.md → 应有匹配
      5. grep "v2 计划" README.md → 应至少 3 处匹配（每个 limitation 一个）
      6. grep "手动解法" README.md → 应至少 3 处匹配
    Expected Result: 三种 limitation 都有说明 + 手动解法 + v2 计划
    Failure Indicators: 任何 limitation 章节缺失
    Evidence: .sisyphus/evidence/task-18-known-limitations-doc.txt
  ```

  **Commit**: YES
  - Message: `test(sync): e2e dry-run scenarios and complete documentation with deploy-gap notice`
  - Files: `scripts/sync-to-blog/test/e2e/*.js`, `scripts/sync-to-blog/README.md`, `scripts/sync-to-blog/docs/architecture.md`, `F:\MyProjects\blog-Azx616\blog-refactor\README.md`
  - Pre-commit: `node --test scripts/sync-to-blog/test/`

---

## Final Verification Wave (MANDATORY — after ALL implementation tasks)

> 4 review agents run in PARALLEL. ALL must APPROVE. Present consolidated results to user and get explicit "okay" before completing.
>
> **Do NOT auto-proceed after verification. Wait for user's explicit approval before marking work complete.**

- [x] F1. **Plan Compliance Audit** — `oracle`
  Read the plan end-to-end. For each "Must Have": verify implementation exists (read file, run command). For each "Must NOT Have": search codebase for forbidden patterns — reject with file:line if found. Check evidence files exist in .sisyphus/evidence/. Compare deliverables against plan.
  Specific checks for this plan:
  - Verify `scripts/sync-to-blog/` exists in notes repo with all expected files
  - Verify `.github/workflows/sync-to-blog.yml` has `concurrency: { group: sync-to-blog, cancel-in-progress: false }`
  - Verify fine-grained PAT scope docs in README (no broad scope)
  - Verify slug immutability code path (manifest check before LLM call)
  - Verify `--dry-run` flag works
  Output: `Must Have [N/N] | Must NOT Have [N/N] | Tasks [N/N] | VERDICT: APPROVE/REJECT`

- [x] F2. **Code Quality Review** — `unspecified-high`
  Run `pnpm astro check` on blog + `pnpm lint` (if available). Review all changed files for: `as any`/`@ts-ignore`, empty catches, console.log in prod, commented-out code, unused imports. Check AI slop: excessive comments, over-abstraction, generic names. Verify sync tool code follows no-semicolon + single-quote + `@/` alias conventions where applicable.
  Output: `Build [PASS/FAIL] | Lint [PASS/FAIL] | Tests [N pass/N fail] | Files [N clean/N issues] | VERDICT`

- [x] F3. **Real Manual QA** — `unspecified-high`
  Start from clean state. Execute EVERY QA scenario from EVERY task — follow exact steps, capture evidence. Test cross-task integration: full sync flow from note edit → PR. Test edge cases: missing image, invalid frontmatter, wikilink to unpublished note, LLM timeout (simulate via env), publish:false toggling. Save to `.sisyphus/evidence/final-qa/`.
  Specific scenarios:
  - Pick 1 real note with `publish:true`, run full flow, verify PR created with correct content
  - Toggle `publish:false`, run sync, verify deletion appears in next PR
  - Edit synced note (whitespace only), run sync, verify idempotency (no new commits)
  Output: `Scenarios [N/N pass] | Integration [N/N] | Edge Cases [N tested] | VERDICT`

- [x] F4. **Scope Fidelity Check** — `deep`
  For each task: read "What to do", read actual diff (git log/diff in both repos). Verify 1:1 — everything in spec was built, nothing beyond spec was built. Check "Must NOT do" compliance. Detect cross-task contamination: Task N touching Task M's files. Flag unaccounted changes. Verify blog repo diff only touches `astro.config.mjs` (no other source code). Verify notes repo diff only adds `scripts/sync-to-blog/`, `.github/workflows/`, `.blog-sync/`, and template rename.
  Output: `Tasks [N/N compliant] | Contamination [CLEAN/N issues] | Unaccounted [CLEAN/N files] | VERDICT`

---

## Commit Strategy

- **Wave 1**: `chore(sync): scaffold foundation (remote/pat/mermaid/tool-schema)` - 多个独立 commit，每个 task 一个
- **Wave 2**: `feat(sync): core primitives (parser/llm/image/git-client/pr)` - 每个 task 独立 commit
- **Wave 3**: `feat(sync): orchestrator + state manager + CLI + workflow`
- **Wave 4**: `feat(sync): hardening (errors/gc/batch/docs)`
- **Final**: 仅在用户明确批准后 merge/squash

每个 task 完成时单独 commit，便于回滚。Cross-repo: 笔记仓库改动提交到笔记仓库，博客仓库改动提交到博客仓库。

---

## Success Criteria

### Verification Commands

```bash
# 笔记仓库 sync 工具存在
Test-Path "F:\MarkDown\Markdown_Repository\scripts\sync-to-blog\index.js"

# 工作流存在且含 concurrency group
Select-String -Path "F:\MarkDown\Markdown_Repository\.github\workflows\sync-to-blog.yml" -Pattern "concurrency:"

# Manifest schema 含 version 字段
Select-String -Path "F:\MarkDown\Markdown_Repository\.blog-sync\manifest.json" -Pattern "version"  # (after first sync)

# 博客仓库有 remote
git -C "F:\MyProjects\blog-Azx616\blog-refactor" remote -v  # Expected: origin <github-url>

# 博客仓库 mermaid 已接入
Select-String -Path "F:\MyProjects\blog-Azx616\blog-refactor\astro.config.mjs" -Pattern "mermaid"

# Dry-run 模式可执行
node "F:\MarkDown\Markdown_Repository\scripts\sync-to-blog\index.js" --dry-run --verbose

# Dry-run 不产生 git 改动
git -C "F:\MarkDown\Markdown_Repository" status --short  # Expected: empty

# 跨仓库 PR 创建（手动触发后）
gh pr list --repo <blog-repo> --state open --search "sync"  # Expected: 1 PR

# 博客内容通过类型检查
pnpm astro check  # Expected: 0 errors
```

### Final Checklist
- [ ] All "Must Have" present
- [ ] All "Must NOT Have" absent
- [ ] Dry-run 模式可独立运行且不修改任何仓库
- [ ] 跨仓库 PR 流程跑通（含 LLM 推断 + 图片迁移 + wikilink 转换）
- [ ] 取消发布 → 自动删除验证通过
- [ ] 幂等性验证通过（同状态二次同步零 diff）
- [ ] Mermaid 在博客渲染验证通过
- [ ] PR body 含同步摘要 + deploy gap 警告
