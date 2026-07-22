# 丰富博客首页 (Enrich Homepage)

## TL;DR

> **Quick Summary**: 当前首页只有全屏 Hero（"Welcome" + 打字机）+ 固定背景图，折叠下方零内容。本计划将其重构为内容丰富、暗色毛玻璃风格、中等密度的落地页——挂载多个已存在但未启用的组件（GithubSection、BlogItem、BusinessCard、SkillsCard、WebStatisticDataCard、CategoryCard、ArrowDownButton），并新建少量配套区块组件（SectionHeader、ViewAllButton、FeaturedPostCard）与区块组装组件，保证排版美观、响应式、双主题可用。
>
> **Deliverables**:
> - 重构后的 `src/pages/index.astro`（组合所有区块）
> - 3 个新建小型展示组件：`SectionHeader`、`ViewAllButton`、`FeaturedPostCard`
> - 3 个新建区块组装组件：`LatestPostsSection`、`ProfileSection`、`CategoriesSection`
> - 启用 `ArrowDownButton` 滚动引导 + 全屏固定背景的可读性遮罩
> - （条件性）更新 `src/data/github.ts` 占位数据 — 见 Decisions Needed
>
> **Estimated Effort**: Medium
> **Parallel Execution**: YES - 3 waves
> **Critical Path**: Task 1/2/3 (helpers) → Task 5/6/7/8 (sections) → Task 9 (integrate index.astro) → F1-F4

---

## Context

### Original Request
用户认为当前首页"有点空"，要求计划如何丰富。允许结合已有未挂载组件与新建组件，但须保证排版合理美观，并要求通过 Playwright 自行查看效果。

### Interview Summary
**Key Discussions**:
- 内容板块（用户全选）：最新文章 + GitHub 展示区 + 分类导航 + 网站统计 + 个人名片+技能
- 我补充并默认纳入：精选文章高亮卡、滚动引导过渡（ArrowDownButton）
- 视觉风格：暗色延续 + 毛玻璃卡片（与现有 Card 组件一致）
- 内容密度：中等（双列布局组合相关内容，留白舒适）
- 新建组件：允许按需新建小区块组件

**Research Findings (Playwright 实测 + 源码核查)**:
- 当前首页：单屏视口，`hasContentBelowFold: false`，`<main>` 仅 1 子元素（hero），scrollHeight ≈ 视口高度
- 未挂载组件清单：GithubSection（index.astro 中被注释）、BlogItem、BusinessCard、SkillsCard、WebStatisticDataCard、CategoryCard、CategoryBadge、Tag、ArrowDownButton（也被注释）
- 工具函数就绪：`getLatestPosts(limit)`（src/lib/utils/posts.ts:78，按 publishDate 降序）、`getCategories()`
- 内容现状：4 篇文章（hello-world / example-post-with-images / astro-alpine-best-practices / 2024-review），**均有 coverImage 与完整 frontmatter**（title/slug/description/publishDate/category/tags）
- `githubData`（src/data/github.ts）为**占位示例数据**（login "azuxa" 小写、avatar ".../u/example"、demo repos）— BLOCKER
- 背景图为 `position: fixed` 全屏（`fixed inset-0 z-0`）→ 新增内容区需遮罩/不透明面以保证可读性
- 默认暗色主题 `<html class="dark">`，但 FAB 有主题切换 → 需双主题支持
- 无测试基础设施（AGENTS.md 明确），验证 100% 靠 Playwright agent QA

### Metis Review
**Identified Gaps (addressed)**:
- Featured/Latest 语义重复 → 默认：Featured=最新一篇，Latest Posts 排除该篇显示后 3 篇（恰好 4 篇）
- githubData 占位 → 标记为 Decisions Needed（BLOCKER），GithubSection 任务条件化
- 全屏固定背景可读性 → 采用半透明遮罩策略
- 浅色模式 → 所有新组件提供 dark:/light: 双变体
- 动画机制 → 仅用 CSS transition + 现有 Alpine，不引入新依赖
- 框架隔离 → 每个新组件单一框架（均为 Astro）
- 文件放置 → 区块组装组件置顶（仿 GithubSection.astro 顶层惯例），展示辅助件入 layout/ 或 content/
- 空状态 → 数据缺失时整段隐藏，不渲染空壳

---

## Work Objectives

### Core Objective
将空荡的单屏首页重构为内容丰富、视觉统一（暗色毛玻璃）、中等密度、响应式且双主题可用的落地页，最大化复用已有未挂载组件。

### Concrete Deliverables
- `src/pages/index.astro` 重构（组合所有区块）
- 新建：`src/components/layout/SectionHeader.astro`、`src/components/layout/ViewAllButton.astro`
- 新建：`src/components/content/FeaturedPostCard.astro`
- 新建：`src/components/LatestPostsSection.astro`、`src/components/ProfileSection.astro`、`src/components/CategoriesSection.astro`
- 启用 `ArrowDownButton` + 背景遮罩 + 滚动锚点
- （条件）`src/data/github.ts` 数据更新

### Definition of Done
- [ ] `pnpm astro check` exit 0
- [ ] `pnpm lint` exit 0
- [ ] `pnpm build` exit 0
- [ ] Playwright 验证：首页折叠下方出现 5+ 区块，3 视口响应式无溢出，双主题可读，零 console error

### Must Have
- 暗色毛玻璃视觉一致性（复用 Card.astro 风格 token：backdrop-blur + border-white/20 + shadow-xl + rounded-2xl）
- 响应式：375px 单列 / 768px 过渡 / 1280px+ 双列
- 双主题（dark 默认 + light 可用）
- 每个区块有语义 `<section>` + `data-section` + `aria-labelledby`
- 单一 `<h1>`（hero），区块标题为 `<h2>`，卡片标题为 `<h3>`
- 中文区块标题（与项目惯例一致）

### Must NOT Have (Guardrails)
- **不得**修改 `HeroSection.astro` 行为（打字机动画、背景）
- **不得**修改 `src/layouts/Layout.astro`
- **不得**修改 `src/components/react/AppLayout.tsx` 或 FAB
- **不得**修改 `content/` 内容（只读消费）
- **不得**修改 `src/content.config.ts` schema
- **不得**引入新 npm 依赖（无 motion/icon 库）
- **不得**修复 `/links` 404（超出范围）
- **不得**修复 `HeaderBar.astro:15` 的 `@ts-ignore`（无关技术债）
- **不得**添加测试基础设施
- **不得**在挂载时顺手重构已有组件
- **不得**创建通用抽象组件（如 GenericSection）
- **不得**使用 `TODO`/`FIXME`/`@ts-ignore`/`as any`（项目反模式）
- **不得**给琐碎组件加 JSDoc
- **不得**触碰其他路由（/about、/articles/*）
- **不得**在数据缺失时渲染空区块壳（需条件隐藏）
- **不得**在 githubData 为占位数据时上线 GithubSection 假数据

---

## Verification Strategy (MANDATORY)

> **ZERO HUMAN INTERVENTION** - 全部由 agent 通过 Playwright + shell 验证。禁止"用户手动确认"类验收标准。

### Test Decision
- **Infrastructure exists**: NO
- **Automated tests**: None（项目无测试基础设施，AGENTS.md 明确）
- **Framework**: none
- **验证方式**: 100% Playwright agent QA + shell 构建门禁

### QA Policy
每个任务 MUST 含 agent 执行的 QA 场景（见 TODO 模板）。
证据存至 `.sisyphus/evidence/task-{N}-{scenario-slug}.{ext}`。

- **Frontend/UI**: Playwright（playwright skill）— 导航、交互、断言 DOM、截图
- **构建门禁**: Bash（`pnpm astro check` / `pnpm lint` / `pnpm build`）
- **响应式**: Playwright resize 至 375/768/1280 三视口截图

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Start Immediately - 共享辅助件 + 数据决策):
├── Task 1: SectionHeader.astro [quick]
├── Task 2: ViewAllButton.astro [quick]
├── Task 3: FeaturedPostCard.astro [quick]
└── Task 4: githubData 占位数据处理 [quick] (条件性，依赖用户决策)

Wave 2 (After Wave 1 - 区块组装，MAX PARALLEL):
├── Task 5: LatestPostsSection.astro (depends: 1, 2) [unspecified-high]
├── Task 6: ProfileSection.astro (depends: 1) [visual-engineering]
├── Task 7: CategoriesSection.astro (depends: 1, 2) [unspecified-high]
└── Task 8: GithubSection 启用验证 (depends: 4) [quick]

Wave 3 (After Wave 2 - 集成):
└── Task 9: 重构 index.astro 组合所有区块 + ArrowDownButton + 遮罩 + 锚点 (depends: 1-8) [deep]

Wave FINAL (After Task 9 — 4 parallel reviews, then user okay):
├── Task F1: Plan compliance audit (oracle)
├── Task F2: Code quality review (unspecified-high)
├── Task F3: Real manual QA via Playwright (unspecified-high + playwright)
└── Task F4: Scope fidelity check (deep)
-> Present results -> Get explicit user okay

Critical Path: Task 1 → Task 5 → Task 9 → F1-F4 → user okay
Parallel Speedup: ~65% faster than sequential
Max Concurrent: 4 (Wave 1 & 2)
```

### Dependency Matrix
| Task | Depends On | Blocks |
|------|-----------|--------|
| 1 SectionHeader | - | 5, 6, 7 |
| 2 ViewAllButton | - | 5, 7 |
| 3 FeaturedPostCard | - | 9 |
| 4 githubData | (user decision) | 8 |
| 5 LatestPostsSection | 1, 2 | 9 |
| 6 ProfileSection | 1 | 9 |
| 7 CategoriesSection | 1, 2 | 9 |
| 8 GithubSection enable | 4 | 9 |
| 9 index.astro | 1-8 | F1-F4 |

### Agent Dispatch Summary
- **Wave 1**: 4 tasks — T1/T2/T3 → `quick`, T4 → `quick`
- **Wave 2**: 4 tasks — T5 → `unspecified-high`, T6 → `visual-engineering`, T7 → `unspecified-high`, T8 → `quick`
- **Wave 3**: 1 task — T9 → `deep`
- **FINAL**: 4 — F1 → `oracle`, F2 → `unspecified-high`, F3 → `unspecified-high` (+playwright), F4 → `deep`

---

## TODOs

> 每个 TODO = 实现 + QA。无 QA 场景的任务 = 不完整。

- [ ] 1. SectionHeader.astro — 可复用区块标题组件

  **What to do**:
  - 新建 `src/components/layout/SectionHeader.astro`
  - Props: `title: string`（主标题）、`subtitle?: string`（副标题）、`id?: string`（用于 aria-labelledby 绑定的标题元素 id）、`align?: 'left' | 'center'`（默认 center）、`class?: string`
  - 渲染：`<div>` 包裹 `<h2 id={id}>`（主标题，大号加粗）+ 可选 `<p>`（副标题，muted）。标题用中文
  - 样式：文字色支持双主题（`text-foreground` / dark 已默认）；副标题 `text-muted`；标题下方可选渐变分隔线（`h-1 w-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mx-auto`，align=center 时居中）
  - 纯展示组件，无客户端 JS

  **Must NOT do**:
  - 不引入客户端交互/Alpine/React
  - 不加 JSDoc 过度注释
  - 不创建通用 "Section" 包装器（本组件仅做标题）

  **Recommended Agent Profile**:
  - **Category**: `quick` — 单文件纯展示组件，逻辑简单
  - **Skills**: [`Frontend Components Standards`]
    - 组件单一职责、清晰 props 接口、最小 props

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1（与 Task 2, 3, 4 并行）
  - **Blocks**: Task 5, 6, 7（区块组装组件依赖它）
  - **Blocked By**: None（立即可开始）

  **References**:
  - `src/components/layout/Card.astro` — 同目录 Astro 展示组件的写法惯例（Props interface + 解构 + class 模板字符串）。模仿其简洁风格
  - `src/components/layout/HeroSection.astro` — 同类"区块级"展示组件参考（标题层级、布局）
  - `src/styles/` 下 theme/typography CSS — 颜色 token（`text-foreground`、`text-muted`）来源。读 `src/styles/global.css` 确认 token 名
  - `tailwind-patterns` skill — 标题排版与分隔线模式

  **WHY Each Reference Matters**:
  - Card.astro: 学习本目录组件的 props 解构与 class 拼接惯例，保持一致
  - HeroSection: 参考区块标题的字号/层级处理
  - global.css: 确认实际可用的颜色 token 名，避免硬编码色值

  **Acceptance Criteria**:
  - [ ] 文件 `src/components/layout/SectionHeader.astro` 存在
  - [ ] `pnpm astro check` exit 0
  - [ ] Props 类型完整（title 必填，其余可选）

  **QA Scenarios (MANDATORY)**:

  ```
  Scenario: SectionHeader 渲染主副标题（happy path）
    Tool: Bash (临时验证页) 或 Playwright
    Preconditions: dev server 运行于 localhost:4321
    Steps:
      1. 在 index.astro 临时加入 `<SectionHeader id="t" title="最新文章" subtitle="最近的思考与记录" />`（本任务可临时验证，Task 9 正式接入）
      2. Playwright navigate http://localhost:4321
      3. 定位 `h2#t`，断言 textContent === "最新文章"
      4. 断言同级 p textContent === "最近的思考与记录"
    Expected Result: h2 与 p 均存在且文本正确
    Failure Indicators: h2 缺失、文本为空、props 未渲染
    Evidence: .sisyphus/evidence/task-1-section-header-render.png

  Scenario: 仅 title 时副标题不渲染（edge case）
    Tool: Playwright
    Steps:
      1. 临时 `<SectionHeader id="t2" title="分类" />`
      2. 断言 `h2#t2` 存在
      3. 断言 `#t2` 兄弟节点中无 `<p>` 副标题
    Expected Result: 仅 h2，无空 p
    Evidence: .sisyphus/evidence/task-1-section-header-no-subtitle.png
  ```

  **Commit**: YES（与 Task 2, 3 合并）
  - Message: `feat(home): add section header, view-all button, featured post card helpers`
  - Files: `src/components/layout/SectionHeader.astro`
  - Pre-commit: `pnpm astro check`

---

- [ ] 2. ViewAllButton.astro — 可复用"查看全部"链接按钮

  **What to do**:
  - 新建 `src/components/layout/ViewAllButton.astro`
  - Props: `href: string`（链接目标）、`label?: string`（默认"查看全部 →"）、`class?: string`
  - 渲染为 `<a>`，毛玻璃 pill 风格：`inline-flex items-center gap-2 px-5 py-2 rounded-full border border-white/20 backdrop-blur-sm bg-white/5 hover:bg-white/10 text-foreground transition-all duration-300 hover:-translate-y-0.5`
  - 双主题：文字 `text-foreground`；hover 态双主题均可读
  - 纯展示，无 JS

  **Must NOT do**:
  - 不加客户端逻辑
  - 不用 window.open（用标准 `<a target="_blank" rel="noopener noreferrer">` 若外链；本场景内链用普通 `<a>`）

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: [`Frontend Components Standards`, `tailwind-patterns`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1
  - **Blocks**: Task 5, 7
  - **Blocked By**: None

  **References**:
  - `src/components/content/BusinessCard.astro:30-44` — 现有 `<a>` 按钮的样式写法（gradient + hover + transition），参考其交互态处理
  - `src/components/layout/Card.astro` — 毛玻璃 token 惯例（border-white/20、backdrop-blur-sm）
  - `tailwind-patterns` skill — pill 按钮模式

  **WHY Each Reference Matters**:
  - BusinessCard 的 GitHub 按钮：学习本项目按钮 hover/transition 写法，保持视觉语言一致
  - Card.astro：毛玻璃 surface token 一致性

  **Acceptance Criteria**:
  - [ ] 文件存在，Props 含必填 href
  - [ ] `pnpm astro check` exit 0

  **QA Scenarios**:

  ```
  Scenario: ViewAllButton 渲染正确链接（happy path）
    Tool: Playwright
    Steps:
      1. 临时加入 `<ViewAllButton href="/articles" />`
      2. 定位 `a[href="/articles"]`，断言存在
      3. 断言文本含"查看全部"
    Expected Result: a 标签 href=/articles，文本正确
    Evidence: .sisyphus/evidence/task-2-view-all-button.png

  Scenario: 自定义 label 生效（edge case）
    Tool: Playwright
    Steps:
      1. `<ViewAllButton href="/x" label="更多分类" />`
      2. 断言文本 === "更多分类"
    Expected Result: 自定义 label 覆盖默认
    Evidence: .sisyphus/evidence/task-2-view-all-button-custom.png
  ```

  **Commit**: YES（合并于 Wave 1）
  - Files: `src/components/layout/ViewAllButton.astro`

---

- [ ] 3. FeaturedPostCard.astro — 精选文章高亮卡

  **What to do**:
  - 新建 `src/components/content/FeaturedPostCard.astro`
  - Props: `post: { slug: string; title: string; description: string; coverImage?: string; publishDate: string; category?: { name: string; color?: string } }`（直接接收 PostWithSlug 子集）
  - 渲染为整张可点击 `<a href="/articles/{slug}">` 大卡片，左右分栏：左 60% 封面图（`bg-cover bg-center`，无图时用确定性渐变 fallback：`bg-gradient-to-br from-blue-900 to-purple-900`），右 40% 文字（CategoryBadge + h3 大标题 line-clamp-2 + 描述 line-clamp-3 + 日期 + "阅读全文 →"）
  - 容器：`min-h-80 rounded-3xl overflow-hidden border border-white/20 shadow-2xl backdrop-blur-sm hover:shadow-3xl hover:-translate-y-1 transition-all duration-300`
  - 双主题：文字 `text-foreground`；封面区始终深色渐变保证白字可读
  - 纯 Astro，无 JS

  **Must NOT do**:
  - 不修改 BlogItem.astro（FeaturedPostCard 是独立的大卡片变体）
  - 不引入图片处理库
  - 无 coverImage 时用 CSS 渐变，不加外部默认图

  **Recommended Agent Profile**:
  - **Category**: `quick`（单文件展示组件，但视觉细节较多，给 quick 足够）
  - **Skills**: [`Frontend Components Standards`, `tailwind-patterns`, `frontend-design`]
    - frontend-design: 视觉精致度（渐变、阴影、hover 态）

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1
  - **Blocks**: Task 9（index.astro 集成）
  - **Blocked By**: None

  **References**:
  - `src/components/content/BlogItem.astro` — 文章卡片的字段消费方式（coverImage/title/description/category/publishDate），FeaturedPostCard 是其"放大精选"变体
  - `src/components/content/CategoryBadge.astro` — 复用此组件显示分类徽章（支持 color + 暗色模式）
  - `src/components/content/ArticleCoverImage.astro` — 封面图处理惯例（如存在 fallback 逻辑可参考）
  - `content/posts/2024-review/index.md:1-11` — 真实 frontmatter 形状（coverImage 字段确认存在）
  - `tailwind-patterns` + `frontend-design` skill — 大卡片排版、渐变 fallback

  **WHY Each Reference Matters**:
  - BlogItem: 学习本项目文章卡片的字段映射，FeaturedPostCard 复用相同数据契约
  - CategoryBadge: 直接复用以保持分类徽章视觉一致，勿重造
  - 真实 frontmatter: 确认 coverImage 字段存在且为字符串路径，设计 fallback 仅在缺图时触发

  **Acceptance Criteria**:
  - [ ] 文件存在，Props 接收 post 对象
  - [ ] 整卡为 `<a>` 可点击跳转
  - [ ] 无 coverImage 时渲染渐变 fallback（不报错、不显示 broken image）
  - [ ] `pnpm astro check` exit 0

  **QA Scenarios**:

  ```
  Scenario: 有封面图的精选卡渲染（happy path）
    Tool: Playwright
    Preconditions: 用 2024-review（有 coverImage）作为 featured 数据
    Steps:
      1. 临时渲染 `<FeaturedPostCard post={latestPost} />`，latestPost = getLatestPosts(1)[0]
      2. 定位卡片 `a[href^="/articles/2024-review"]`
      3. 断言内含 h3 文本含"2024年回顾"
      4. 断言封面区 div 有 background-image 样式（含 coverImage 路径）
    Expected Result: 大卡片正确渲染，链接/标题/封面齐全
    Failure Indicators: 链接 404、标题空、封面区无背景图
    Evidence: .sisyphus/evidence/task-3-featured-with-cover.png

  Scenario: 无封面图时渐变 fallback（edge case）
    Tool: Playwright
    Steps:
      1. 传入 post 对象，coverImage 设为空字符串
      2. 断言封面区有 gradient class（from-blue-900）
      3. 断言无 broken <img>（无 onerror 控制台错误）
    Expected Result: 渐变背景，无错误
    Evidence: .sisyphus/evidence/task-3-featured-no-cover.png
  ```

  **Commit**: YES（合并于 Wave 1）
  - Files: `src/components/content/FeaturedPostCard.astro`

---

- [ ] 4. 处理 githubData 占位数据 [DECISION NEEDED — 见下方]

  **⚠️ BLOCKER**: `src/data/github.ts` 当前为**占位示例数据**（`login: "azuxa"` 小写、`avatar_url: ".../u/example"`、demo repos "awesome-project"）。直接挂载 GithubSection 会在首页展示假信息。本任务行为取决于用户决策（见本计划末 "Decisions Needed"）。

  **What to do (根据用户决策分支)**:
  - **若用户选 A（更新为真实静态数据）**: 修改 `src/data/github.ts`，将 user.login 改为 `Azuxa616`、avatar_url 改为真实头像 URL（`https://avatars.githubusercontent.com/Azuxa616`）、repos 改为真实仓库（至少保留 blog-refactor 对应真实仓库）、skills 保持或按用户实际更新。**不得引入新依赖，不得加 live API fetch（保持静态）**
  - **若用户选 B（构建时拉取真实公开数据）**: 在 `src/data/github.ts` 导出一个 `async function getGithubData()`，用原生 `fetch('https://api.github.com/users/Azuxa616')` + `/repos` 在 Astro frontmatter（SSR/build）拉取，带 try/catch fallback 到静态值。注意 SSR 每次请求拉取有速率限制风险 → 建议加简单内存缓存或 `prerender`
  - **若用户选 C（跳过 GithubSection）**: 不改 github.ts；Task 8 标记为 SKIPPED；index.astro 不含 GithubSection

  **Must NOT do**:
  - 不在未决策前挂载假数据
  - 不引入 GitHub SDK/认证（仅公开只读数据）
  - 选 B 时不阻塞构建（fetch 失败须 fallback）

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES（与其他 Wave 1 任务并行，但需用户先决策）
  - **Parallel Group**: Wave 1
  - **Blocks**: Task 8（GithubSection 启用依赖此数据正确）
  - **Blocked By**: 用户对 githubData 的决策

  **References**:
  - `src/data/github.ts:1-51` — 当前占位数据全貌，需修改的字段清单
  - `src/components/content/BusinessCard.astro:31` — 真实 GitHub 链接 `https://github.com/Azuxa616`（确认真实用户名）
  - `src/components/GithubSection.astro:6-18` — GithubSection 消费 githubData 的方式（直接传入 user/repos/skills）

  **WHY Each Reference Matters**:
  - github.ts: 明确哪些字段是占位、需替换
  - BusinessCard: 交叉验证真实用户名是 Azuxa616（非 azuxa）
  - GithubSection: 确认数据契约，确保更新后字段匹配

  **Acceptance Criteria** (决策后确定):
  - [ ] 若选 A/B：`githubData`/`getGithubData()` 返回的 user.login === "Azuxa616"（真实用户名）
  - [ ] 若选 A/B：avatar_url 指向真实头像（非 ".../u/example"）
  - [ ] 若选 B：fetch 失败时 fallback 到静态值，构建不崩
  - [ ] 若选 C：本任务与 Task 8 标记 SKIPPED
  - [ ] `pnpm astro check` + `pnpm build` exit 0

  **QA Scenarios** (决策后确定):

  ```
  Scenario: githubData 用户名为真实值（happy path, 选 A/B 时）
    Tool: Bash (node/astro REPL)
    Steps:
      1. 运行 `pnpm exec astro check`（验证类型）
      2. 临时脚本 import githubData，断言 githubData.user.login === 'Azuxa616'
      3. 断言 avatar_url 不含 'example'
    Expected Result: 真实用户名与头像
    Evidence: .sisyphus/evidence/task-4-githubdata-real.txt

  Scenario: fetch 失败 fallback（edge case, 选 B 时）
    Tool: Bash
    Steps:
      1. 临时断网或 mock fetch reject
      2. 运行构建，断言不抛错，返回静态 fallback
    Expected Result: 优雅降级
    Evidence: .sisyphus/evidence/task-4-githubdata-fallback.txt
  ```

  **Commit**: YES（单独）
  - Message: `fix(data): replace placeholder github data with real Azuxa616 profile`
  - Files: `src/data/github.ts`

---

- [ ] 5. LatestPostsSection.astro — 最新文章区块

  **What to do**:
  - 新建 `src/components/LatestPostsSection.astro`
  - 内部 `await getLatestPosts()` 获取文章，**排除第一篇**（第一篇用于 FeaturedPostCard，避免重复）。取后续 3 篇。若总数 ≤1，整段不渲染（返回 null）
  - 组合：`SectionHeader`（title="最新文章"，subtitle="最近的思考与记录"）+ `ViewAllButton`（href="/articles"）放右上角 + 文章列表（3×`BlogItem`，每张包 `<a href="/articles/{slug}">`）
  - 需要 `getCategories()` 来把 category slug 映射成 {name,color}（参考 articles/index.astro:61-67, 137-145 的映射逻辑）
  - 布局：单列堆叠（`flex flex-col gap-6`），宽度 `max-w-4xl mx-auto`
  - 外层 `<section data-section="latest-posts" aria-labelledby="latest-posts-title">`，SectionHeader 的 id 绑定到此

  **Must NOT do**:
  - 不修改 BlogItem.astro
  - 不实现分页（固定 3 篇）
  - 文章数 ≤1 时返回 null，不渲染空壳

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high` — 含数据获取 + 组件组合 + 分类映射逻辑
  - **Skills**: [`Frontend Components Standards`, `tailwind-patterns`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2
  - **Blocks**: Task 9
  - **Blocked By**: Task 1（SectionHeader）, Task 2（ViewAllButton）

  **References**:
  - `src/pages/articles/index.astro:60-67, 128-151` — **关键参考**：getLatestPosts/getCategories 用法、分类 slug→{name,color} 映射、BlogItem props 传法（coverImage/title/description/category/publishDate）。直接复用此模式
  - `src/lib/utils/posts.ts:78-81` — getLatestPosts 实现（按 publishDate 降序，slice limit）
  - `src/lib/utils/categories.ts` — getCategories 实现（确认返回结构与 articleCount 字段）
  - `src/components/content/BlogItem.astro:6-34` — BlogItem 的 Props 契约（确认字段名）
  - Task 1 产出的 `SectionHeader.astro`、Task 2 产出的 `ViewAllButton.astro`

  **WHY Each Reference Matters**:
  - articles/index.astro: 本项目已验证的文章列表渲染模式（数据获取+映射+传 props），复制即可避免重造
  - posts.ts: 确认排序与 slice 行为，确保"排除第一篇"逻辑正确
  - BlogItem: 确认 props 字段名，避免传错

  **Acceptance Criteria**:
  - [ ] 文件存在，内部 await getLatestPosts()
  - [ ] 渲染 ≤3 篇（排除 featured 那篇）；4 篇时显示 3 篇
  - [ ] 文章数 ≤1 时整段不渲染
  - [ ] `pnpm astro check` exit 0

  **QA Scenarios**:

  ```
  Scenario: 4 篇文章时渲染 3 篇最新（happy path）
    Tool: Playwright
    Preconditions: content/posts 有 4 篇
    Steps:
      1. 临时在 index.astro 渲染 `<LatestPostsSection />`
      2. navigate localhost:4321
      3. 定位 `[data-section="latest-posts"]`
      4. 断言内部 `.blog-item` 或 BlogItem 根节点数量 === 3
      5. 断言 ViewAllButton a[href="/articles"] 存在
      6. 断言 3 篇标题均与 getLatestPosts()[1..3] 对应（排除最新那篇）
    Expected Result: 3 张文章卡 + 查看全部按钮，无重复 featured
    Failure Indicators: 数量≠3、含 featured 那篇、链接错误
    Evidence: .sisyphus/evidence/task-5-latest-posts-3.png

  Scenario: 仅 1 篇文章时不渲染（edge case）
    Tool: Playwright
    Preconditions: 临时让 getLatestPosts 仅返回 1 篇（mock 或临时过滤）
    Steps:
      1. 渲染 `<LatestPostsSection />`
      2. 断言 `[data-section="latest-posts"]` 不存在
    Expected Result: 区块整体隐藏
    Evidence: .sisyphus/evidence/task-5-latest-posts-hidden.txt
  ```

  **Commit**: YES（Wave 2 合并）
  - Message: `feat(home): compose latest posts, profile, categories sections`
  - Files: `src/components/LatestPostsSection.astro`

---

- [ ] 6. ProfileSection.astro — 个人名片 + 统计 + 技能（双列）

  **What to do**:
  - 新建 `src/components/ProfileSection.astro`
  - 组合现有组件为双列布局（`grid md:grid-cols-2 gap-8 max-w-5xl mx-auto`）：
    - **左列**（窄）：`BusinessCard`（顶部）+ `WebStatisticDataCard`（底部，堆叠 `flex flex-col gap-6`）
    - **右列**（宽）：`SkillsCard`（占满）
  - 顶部 `SectionHeader`（title="关于我"，subtitle="技术与我"）
  - WebStatisticDataCard 数据：articleCount 用 `getLatestPosts()` 全量 length；其余字段先用合理静态值或留默认（totalWords 可后续算，本任务用占位如 "—" 或计算总字数若简单）。**优先用真实可算值（articleCount），无法算的保留组件默认**
  - SkillsCard 数据：从 `githubData.skills` 取 learned/practicing 传入
  - 外层 `<section data-section="profile" aria-labelledby="profile-title">`
  - 移动端（<768px）双列堆叠为单列

  **Must NOT do**:
  - 不修改 BusinessCard/SkillsCard/WebStatisticDataCard 内部
  - 不引入字数统计依赖（若算总字数复杂，用占位）
  - skills 数据为空时 SkillsCard 仍渲染（组件内部已处理空数组）

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering` — 双列视觉平衡 + 现有组件组合，排版美感要求高
  - **Skills**: [`Frontend Components Standards`, `tailwind-patterns`, `frontend-design`]
    - frontend-design: 双列视觉平衡、左右等高处理

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2
  - **Blocks**: Task 9
  - **Blocked By**: Task 1（SectionHeader）

  **References**:
  - `src/components/content/BusinessCard.astro` — 名片组件（无 props，内部硬编码 Azuxa616 信息）。直接 `<BusinessCard />`
  - `src/components/content/SkillsCard.astro:17-24` — SkillsCard Props（learned: Skill[], practicing: Skill[]）。从 githubData.skills 传入
  - `src/components/content/WebStatisticDataCard.astro:8-23` — WebStatisticDataCard Props（articleCount/totalWords/visitorCount/totalViews/lastUpdatedDays）
  - `src/data/github.ts:37-50` — skills.learned / skills.practicing 数据源
  - `src/lib/utils/posts.ts:13-22` — getAllPosts 用于算 articleCount
  - `tailwind-patterns` skill — 双列 grid + 移动端堆叠（md:grid-cols-2）

  **WHY Each Reference Matters**:
  - BusinessCard: 确认无 props 直接用
  - SkillsCard/WebStatisticDataCard: 确认 props 契约，正确传值
  - github.ts: skills 数据来源，避免重造

  **Acceptance Criteria**:
  - [ ] 文件存在，双列布局（md:grid-cols-2）
  - [ ] 左列含 BusinessCard + WebStatisticDataCard；右列含 SkillsCard
  - [ ] articleCount 为真实文章数（4）
  - [ ] 移动端单列堆叠
  - [ ] `pnpm astro check` exit 0

  **QA Scenarios**:

  ```
  Scenario: 双列布局桌面端渲染（happy path）
    Tool: Playwright
    Steps:
      1. resize 1280x800
      2. 临时渲染 `<ProfileSection />`
      3. 定位 `[data-section="profile"]`
      4. 断言含 BusinessCard（头像 img[src*="avatar"]）、SkillsCard（"技术力雷达" 文本）、WebStatisticDataCard（"网站统计" 文本）
      5. 断言 articleCount 显示 "4"
    Expected Result: 三组件齐全，统计数真实
    Evidence: .sisyphus/evidence/task-6-profile-desktop.png

  Scenario: 移动端单列堆叠（responsive）
    Tool: Playwright
    Steps:
      1. resize 375x667
      2. 断言 `[data-section="profile"]` 内 grid 为单列（无横向溢出：scrollWidth <= innerWidth）
    Expected Result: 单列，无溢出
    Evidence: .sisyphus/evidence/task-6-profile-mobile.png
  ```

  **Commit**: YES（Wave 2 合并）
  - Files: `src/components/ProfileSection.astro`

---

- [ ] 7. CategoriesSection.astro — 分类导航区块

  **What to do**:
  - 新建 `src/components/CategoriesSection.astro`
  - `await getCategories()` 获取分类；为空时整段不渲染（返回 null）
  - 组合：`SectionHeader`（title="探索分类"，subtitle="按主题浏览"）+ 分类网格
  - **分类卡片简化**：现有 `CategoryCard.astro` 含拖放上传 + onExpand 回调（面向管理后台），首页不宜直接用。本任务**新建一个轻量展示用分类卡**或直接用 `<a>` + CategoryBadge 风格的网格。**推荐**：用 `CategoryBadge` 或简单的彩色卡片（显示分类名 + 文章数 + 颜色条），链接到 `/articles?category={slug}`
  - 布局：`grid grid-cols-2 md:grid-cols-3 gap-4`，每卡 `rounded-2xl border border-white/20 backdrop-blur-sm p-5 hover:-translate-y-1 transition`，左侧颜色条（category.color），分类名 + "{articleCount} 篇"
  - 外层 `<section data-section="categories" aria-labelledby="categories-title">`

  **⚠️ 注意**：`CategoryCard.astro` 是后台管理用（拖放上传），**首页不直接复用**。需新建轻量展示卡或内联渲染。本任务因此从 `unspecified-high` 而非 `quick`。

  **Must NOT do**:
  - 不复用后台版 CategoryCard（拖放/onExpand 不适合首页）
  - 不修改 CategoryCard.astro
  - 分类为空时返回 null

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high` — 需判断是否新建轻量分类卡组件 + 网格排版
  - **Skills**: [`Frontend Components Standards`, `tailwind-patterns`, `frontend-design`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2
  - **Blocks**: Task 9
  - **Blocked By**: Task 1（SectionHeader）

  **References**:
  - `src/components/content/CategoryBadge.astro` — 彩色分类徽章（支持 color + 暗色模式），可作为分类卡的核心元素复用
  - `src/pages/articles/index.astro:60-67` — getCategories 返回结构（含 data.name/slug/description/color + articleCount），分类数据形状参考
  - `src/lib/utils/categories.ts` — getCategories 实现（确认 articleCount 字段存在）
  - `tailwind-patterns` skill — 响应式 grid（grid-cols-2 md:grid-cols-3）

  **WHY Each Reference Matters**:
  - CategoryBadge: 复用以保持分类视觉语言一致
  - articles/index.astro: 分类数据契约与 articleCount 字段确认

  **Acceptance Criteria**:
  - [ ] 文件存在，await getCategories()
  - [ ] 每分类卡链接到 `/articles?category={slug}`
  - [ ] 显示分类名 + 文章数
  - [ ] 分类为空时整段不渲染
  - [ ] `pnpm astro check` exit 0

  **QA Scenarios**:

  ```
  Scenario: 分类网格渲染（happy path）
    Tool: Playwright
    Steps:
      1. 临时渲染 `<CategoriesSection />`
      2. 定位 `[data-section="categories"]`
      3. 断言分类卡数量 >= 1（与 getCategories 长度一致）
      4. 断言每卡 a[href^="/articles?category="]
      5. 断言每卡含分类名文本
    Expected Result: 分类卡网格，链接正确
    Evidence: .sisyphus/evidence/task-7-categories.png

  Scenario: 无分类时隐藏（edge case）
    Tool: Playwright
    Steps:
      1. mock getCategories 返回 []
      2. 断言 `[data-section="categories"]` 不存在
    Expected Result: 区块隐藏
    Evidence: .sisyphus/evidence/task-7-categories-hidden.txt

  Scenario: 点击分类卡跳转（integration）
    Tool: Playwright
    Steps:
      1. 点击第一个分类卡
      2. 断言 URL 含 ?category=
      3. 断言 /articles 页加载（HTTP 200，无 404）
    Expected Result: 正确跳转到分类筛选页
    Evidence: .sisyphus/evidence/task-7-category-click.png
  ```

  **Commit**: YES（Wave 2 合并）
  - Files: `src/components/CategoriesSection.astro`

---

- [ ] 8. GithubSection 启用验证（条件性，依赖 Task 4 决策）

  **What to do**:
  - **前提**：Task 4 已决策。若选 C（跳过），本任务 SKIPPED
  - 若 Task 4 选 A/B：在 index.astro 集成阶段（Task 9）启用 `<GithubSection />`（取消现有注释）。本任务负责**独立验证** GithubSection 在真实/更新后的 githubData 下正确渲染：
    1. 临时创建验证：确认 GithubUserCard 渲染真实用户名（非 example）、GithubRepoList 显示真实仓库、GithubSkillsSection 显示 skills
    2. 检查 GithubHeatmap 在静态数据下不报错（buildContributionSnapshot 逻辑）
    3. 确认骨架屏逻辑（isLoading 默认 false）不卡在加载态
  - 本任务不新建文件，仅验证 + 必要时在 index.astro 取消注释（实际集成在 Task 9）

  **Must NOT do**:
  - 不修改 GithubSection 内部组件（除非发现真实 bug，则单独标记）
  - 不在数据未决策前启用

  **Recommended Agent Profile**:
  - **Category**: `quick` — 验证为主
  - **Skills**: [`playwright`]

  **Parallelization**:
  - **Can Run In Parallel**: YES（Wave 2，但须 Task 4 完成）
  - **Parallel Group**: Wave 2
  - **Blocks**: Task 9
  - **Blocked By**: Task 4

  **References**:
  - `src/components/GithubSection.astro` — 顶层封装，消费 githubData
  - `src/components/github/GithubCard.astro` — 主组合件（user/repos/learned/practicing/isLoading/error）
  - `src/components/github/GithubUserCard.astro:92-234` — 用户卡渲染（头像/名/统计/热力图）。**注意 L101-187 的布局可能较宽**，验证桌面/移动端表现
  - `src/components/github/GithubRepoList.astro:34-38` — 取前 3 仓库逻辑
  - `src/components/github/GithubUtils.astro` — buildContributionSnapshot（热力图数据，静态 repos 下应正常）

  **WHY Each Reference Matters**:
  - GithubUserCard: 该组件布局复杂（4 区域横向），验证响应式是否溢出
  - GithubUtils: 确认静态数据下热力图不崩

  **Acceptance Criteria**:
  - [ ] 若 SKIPPED：标记完成，index.astro 不含 GithubSection
  - [ ] 若启用：用户名显示真实值（非 example/azuxa 小写）
  - [ ] 热力图渲染无 console error
  - [ ] 移动端无横向溢出

  **QA Scenarios**:

  ```
  Scenario: GithubSection 真实数据渲染（happy path, 启用时）
    Tool: Playwright
    Steps:
      1. 临时渲染 `<GithubSection />`（Task 4 已更新数据）
      2. 定位 GitHub 用户名文本，断言 === "Azuxa616"（真实）
      3. 断言无 console error
      4. resize 375x667，断言无横向溢出
    Expected Result: 真实数据，无错误，响应式正常
    Evidence: .sisyphus/evidence/task-8-github-real.png

  Scenario: SKIPPED 时 index 无 github 区块（edge case, 选 C）
    Tool: Playwright
    Steps:
      1. 确认 index.astro 不含 GithubSection import
    Expected Result: 无 github 区块
    Evidence: .sisyphus/evidence/task-8-skipped.txt
  ```

  **Commit**: NO（集成在 Task 9 合并）
  - Files: （无新文件）

---

- [ ] 9. 重构 index.astro — 组合所有区块 + 滚动引导 + 背景遮罩 [CRITICAL INTEGRATION]

  **What to do**:
  - 重构 `src/pages/index.astro`，保留现有 HeroSection + 背景图 + FooterBar，**新增**：
  - **背景遮罩**：在固定背景图上层、内容下层加一个全屏半透明遮罩 `<div class="fixed inset-0 z-[1] bg-slate-950/60 backdrop-blur-[2px] pointer-events-none" />`，保证折叠下方内容可读（暗色毛玻璃在遮罩上仍有效）。**仅遮罩内容区，hero 区保持现状**
  - **ArrowDownButton 启用**：取消注释，定位在 hero 底部居中（`absolute bottom-8 left-1/2 -translate-x-1/2 z-20`），点击平滑滚动到 `#featured` 锚点。修改其 onClick 为 `document.getElementById('featured')?.scrollIntoView({behavior:'smooth'})` 或保持默认 scrollTo(innerHeight)
  - **内容区结构**（在 hero `</div>` 之后，FooterBar 之前）：
    ```
    <main>（现有 hero 区）
    <div id="featured-anchor" class="relative z-10">  ← 内容区容器
      <FeaturedPostCard post={latestPost} />  ← id="featured"
      <LatestPostsSection />
      <ProfileSection />
      <GithubSection />  ← 仅 Task 4 非 C 时
      <CategoriesSection />
    </div>
    ```
  - 数据获取：在 index.astro frontmatter `const latestPost = (await getLatestPosts(1))[0]`
  - 每个内容区块用 `<section>` 包裹 + 上下 padding（`py-16`）+ `max-w-*` 容器居中
  - 区块间用分隔（`<div class="h-px bg-white/10 my-8">` 或自然留白）
  - **FeaturedPostCard 容器**：`max-w-5xl mx-auto px-4 py-16`，给 `id="featured"` 与 `scroll-margin-top`（`scroll-mt-20`）确保锚点滚动不被遮挡
  - 确保整页 `pnpm astro check` / `pnpm lint` / `pnpm build` 通过

  **Must NOT do**:
  - 不改 HeroSection.astro 内部
  - 不改 Layout.astro / AppLayout / FAB
  - 不引入新依赖
  - githubData 未决策时不挂 GithubSection

  **Recommended Agent Profile**:
  - **Category**: `deep` — 关键集成任务，涉及全局布局/遮罩/锚点/数据流/响应式协调，需反复 Playwright 调试
  - **Skills**: [`Frontend Components Standards`, `tailwind-patterns`, `frontend-design`, `playwright`]
    - playwright: 必须反复浏览器验证排版效果
    - frontend-design: 区块间距/视觉节奏/遮罩透明度调优

  **Parallelization**:
  - **Can Run In Parallel**: NO（最终集成，串行）
  - **Parallel Group**: Wave 3（单独）
  - **Blocks**: F1-F4
  - **Blocked By**: Task 1, 2, 3, 5, 6, 7, 8（全部区块就绪）

  **References**:
  - `src/pages/index.astro`（现有）— 当前结构（HeroSection + 注释的 GithubSection/ArrowDownButton + FooterBar）。在此基础上重构
  - `src/pages/articles/index.astro:70-76` — ImageHeaderBar + max-w 容器 + padding 的页面布局惯例
  - `src/components/layout/ArrowDownButton.astro:14-16` — onClick 机制（默认 scrollTo），需改为锚点滚动
  - Task 3/5/6/7/8 产出的所有区块组件
  - `src/components/layout/Card.astro` — 毛玻璃 token（border-white/20 等）保持一致
  - `tailwind-patterns` skill — 区块间距、容器居中、响应式

  **WHY Each Reference Matters**:
  - 现有 index.astro: 重构基线，保留 hero/footer 结构
  - articles/index.astro: 本项目页面级布局（容器宽度、padding）惯例
  - ArrowDownButton: 修改滚动目标的依据

  **Acceptance Criteria**:
  - [ ] index.astro 含全部区块（Featured/Latest/Profile/[Github]/Categories）
  - [ ] ArrowDownButton 启用且滚动到 featured 锚点
  - [ ] 背景遮罩存在（折叠下方内容可读）
  - [ ] 单 `<h1>`，区块标题 `<h2>`
  - [ ] `pnpm astro check` + `pnpm lint` + `pnpm build` 全 exit 0
  - [ ] 零 console error

  **QA Scenarios (详尽 — 本任务是最终交付)**:

  ```
  Scenario: 首页折叠下方出现所有区块（happy path）
    Tool: Playwright
    Steps:
      1. navigate http://localhost:4321
      2. 断言初始视口含 h1 "Welcome to Azuxa's Blog"
      3. page.evaluate('window.scrollTo(0, document.body.scrollHeight)')
      4. 断言 [data-section="latest-posts"]、[data-section="profile"]、[data-section="categories"] 均存在
      5. 断言 FeaturedPostCard（a[href^="/articles/"]，大卡片）存在
      6. 断言 ArrowDownButton（img[alt*="滚动"] 或 .animate-bounce）在 hero 区可见
    Expected Result: 完整内容页，所有区块就位
    Failure Indicators: 缺区块、h1 多于一个、ArrowDownButton 缺失
    Evidence: .sisyphus/evidence/task-9-full-page.png（fullPage 截图）

  Scenario: ArrowDownButton 点击平滑滚动（interaction）
    Tool: Playwright
    Steps:
      1. 定位 ArrowDownButton
      2. click
      3. wait 1000ms
      4. 断言 window.scrollY > 500（已离开 hero）
      5. 断言 #featured 在视口内（getBoundingClientRect top 在 0~innerHeight）
    Expected Result: 点击后滚动到 featured 区
    Evidence: .sisyphus/evidence/task-9-arrow-scroll.png

  Scenario: 桌面端双主题可读（visual）
    Tool: Playwright
    Steps:
      1. resize 1280x800
      2. 截图（dark 默认）→ 滚动到底再截图
      3. 点击 FAB 主题切换（定位 button 含"切换主题"）
      4. 断言 html.classList 不含 'dark'
      5. 截图 light 模式顶部 + 底部
      6. 断言所有区块文字可读（无低对比度：抽检 SkillsCard/统计卡文字）
    Expected Result: 双主题均可读
    Evidence: .sisyphus/evidence/task-9-dark-top.png, task-9-dark-bottom.png, task-9-light-top.png, task-9-light-bottom.png

  Scenario: 三视口响应式无溢出（responsive）
    Tool: Playwright
    Steps:
      1. 依次 resize 375x667 / 768x1024 / 1280x800 / 1920x1080
      2. 每视口断言 document.documentElement.scrollWidth <= window.innerWidth（无横向溢出）
      3. 每视口 fullPage 截图
    Expected Result: 全视口无横向滚动条
    Failure Indicators: scrollWidth > innerWidth
    Evidence: .sisyphus/evidence/task-9-responsive-{375,768,1280,1920}.png

  Scenario: 构建门禁通过（build）
    Tool: Bash
    Steps:
      1. pnpm astro check → 断言 exit 0
      2. pnpm lint → 断言 exit 0
      3. pnpm build → 断言 exit 0，dist/ 存在
    Expected Result: 全绿
    Evidence: .sisyphus/evidence/task-9-build.txt

  Scenario: 零 console error / 零 404（hygiene）
    Tool: Playwright
    Steps:
      1. 注册 pageerror + console.error + requestfailed 监听
      2. navigate + 滚动 + 点击 ArrowDownButton + 主题切换
      3. 断言三个监听数组均空
    Expected Result: 无错误无失败请求
    Evidence: .sisyphus/evidence/task-9-console-clean.txt
  ```

  **Commit**: YES（单独）
  - Message: `feat(home): rebuild index page with enriched sections and scroll guidance`
  - Files: `src/pages/index.astro`
  - Pre-commit: `pnpm astro check && pnpm lint`

---

## Final Verification Wave (MANDATORY — after ALL implementation tasks)

> 4 个 review agent 并行。ALL must APPROVE。汇总结果给用户，获取明确 "okay" 后才算完成。
> **不要在验证后自动推进。等待用户明确批准。**

- [ ] F1. **Plan Compliance Audit** — `oracle`
  通读计划。逐项 "Must Have"：读文件/curl/运行命令验证实现存在。逐项 "Must NOT Have"：搜索禁止模式 — 发现则 file:line 拒绝。检查 .sisyphus/evidence/ 证据文件。对比交付物与计划。
  Output: `Must Have [N/N] | Must NOT Have [N/N] | Tasks [N/N] | VERDICT: APPROVE/REJECT`

- [ ] F2. **Code Quality Review** — `unspecified-high`
  运行 `pnpm astro check` + `pnpm lint` + `pnpm build`。审查所有改动文件：`as any`/`@ts-ignore`、空 catch、prod console.log、注释代码、未用 import。检查 AI slop：过度注释、过度抽象、泛型名（data/result/item/temp）。
  Output: `Build [PASS/FAIL] | Lint [PASS/FAIL] | Tasks [N/N] | Files [N clean/N issues] | VERDICT`

- [ ] F3. **Real Manual QA** — `unspecified-high` (+ `playwright` skill)
  从干净状态启动。执行**每个任务**的每个 QA 场景 — 按精确步骤，捕获证据。测试跨任务集成（区块协同）。测试边缘：空状态、无效输入、快速操作。3 视口（375/768/1280）截图 + 双主题截图。存至 `.sisyphus/evidence/final-qa/`。
  Output: `Scenarios [N/N pass] | Integration [N/N] | Edge Cases [N tested] | VERDICT`

- [ ] F4. **Scope Fidelity Check** — `deep`
  逐任务：读 "What to do"，读实际 diff（git log/diff）。1:1 验证 — 计划内的都建了（无遗漏），计划外未建（无蔓延）。检查 "Must NOT do" 合规。检测跨任务污染：Task N 动 Task M 的文件。标记未说明改动。
  Output: `Tasks [N/N compliant] | Contamination [CLEAN/N issues] | Unaccounted [CLEAN/N files] | VERDICT`

---

## Commit Strategy

- **Wave 1 后**: `feat(home): add section header, view-all button, featured post card helpers`
- **Wave 2 后**: `feat(home): compose latest posts, profile, categories sections`
- **Task 9 后**: `feat(home): rebuild index page with enriched sections and scroll guidance`
- 每个 commit 前: `pnpm astro check && pnpm lint`

---

## Success Criteria

### Verification Commands
```bash
pnpm astro check    # Expected: exit 0, 无错误
pnpm lint           # Expected: exit 0
pnpm build          # Expected: exit 0, dist/ 生成
```

### Final Checklist
- [ ] 所有 "Must Have" 存在
- [ ] 所有 "Must NOT Have" 缺席
- [ ] `pnpm astro check` / `pnpm lint` / `pnpm build` 全 exit 0
- [ ] Playwright: 首页折叠下方 5+ 区块可见，3 视口无横向溢出，双主题可读
- [ ] 零 console error / 零 404 资源
- [ ] 单 `<h1>`，标题层级 h1→h2→h3 无跳级
