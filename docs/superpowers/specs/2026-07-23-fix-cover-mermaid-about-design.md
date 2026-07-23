# 设计文档：修复封面/流程图/关于页渲染问题

**日期**: 2026-07-23
**分支**: restructure-posts-directories
**状态**: 已确认，待写实施计划

## 背景

线上发现三个独立的渲染问题，都集中在文章阅读与展示链路：

1. 无封面文章详情页（如 `https://www.azxblog.cc/articles/bi-bao-2`）标题、简介为白色文字，直接压在白日模式的米白背景 `#fffeee` 上，几乎看不见。列表页同类文章的封面也是一张写死兜底的 `404` 图。
2. Markdown 中的 flowchart / mermaid 流程图不渲染，仍显示为纯文字。
3. `/about` 页面在黑暗模式下文字与背景混淆（深色背景上深色字）。

## 根因

经代码核查，三个问题各自有明确的根因，互不依赖：

### 根因 1：无封面 header 文字依赖遮罩

`src/components/content/ArticleCoverImage.astro` 中，渐变遮罩 `bg-gradient-to-b from-black/20 via-black/60 to-black/80` 只在 `coverImage` 存在时才渲染。无封面时，`<header>` 背景透出页面的 `bg-background`（白日模式 `#fffeee`），而标题、描述被写死为 `text-white`。白字压米白底，导致隐形。黑暗模式因底色为 `#0a0a1a` 恰好不暴露。

### 根因 2：列表页兜底图为 404

`src/components/content/BlogItem.astro` 和 `src/components/layout/ImageHeaderBar.astro` 的兜底图都是 `/imgs/404.jpg`。当前 12 篇文章中 7 篇无封面（`bi-bao-2`、`da-shu-ju-ji-shu-fu-xi-wen-dang-2`、`event-loop-2`、`fang-dou-he-jie-liu-2`、`gao-jie-han-shu-he-ke-li-hua-2`、`hooks-2`、`tcp-2`），因此列表大量出现 `404` 图，观感像坏了。

### 根因 3：mermaid 插件未作用于 .md 文章

`astro.config.mjs` 把 `rehypeMermaidLite` 连同整套 remark/rehype 插件都挂在了 `mdx()` 集成里，而非全局 `markdown` 配置。在 Astro 中，`mdx()` 的插件只作用于 `.mdx`，`.md` 走全局 `markdown` 配置。所有文章均为 `.md`，因此 mermaid 代码块从未被改写成 `<pre class="mermaid">`，`src/layouts/Layout.astro` 里加载的客户端 mermaid 脚本找不到元素可渲染，最终只显示纯文字。

更深层隐患：整套管线（`remarkGfm`、`remarkCallout`、`katex`、`rehypeSlug`、`rehypeAutolinkHeadings`、`rehypeCodeHeader` 等）都被放进 `mdx()` 而非全局 `markdown`。这意味着 `.md` 文章很可能连 GFM 表格、callout、标题锚点、代码复制按钮都没有正常生效，只是这些不如流程图变文字那么显眼。

此外，`Layout.astro` 中 mermaid 主题被写死为 `'dark'`，白日模式下流程图会是暗色，不跟随主题。

### 根因 4：/about 页用写死色值

`src/pages/about/index.astro` 全页使用写死的 Tailwind 色（`text-slate-900`、`bg-white/80`、`border-slate-200` 等），完全不随主题变化。黑暗模式下深底 `#0a0a1a` 配 `text-slate-900`（接近黑），导致文字隐形。

## 范围

本次只修复上述三个问题及其同类隐患，不做无关重构。涉及文件：

- `astro.config.mjs`
- `src/layouts/Layout.astro`
- `src/components/content/ArticleCoverImage.astro`
- `src/components/content/BlogItem.astro`
- `src/components/layout/ImageHeaderBar.astro`
- `src/pages/about/index.astro`
- 新增 `src/lib/utils/placeholder.ts`
- 新增 `src/components/content/CoverPlaceholder.astro`
- 新增 `src/styles/components/placeholders.css`（并在 `src/styles/global.css` 引入）

## 设计决策

### 决策 1：Markdown 插件管线迁移到全局配置（选 A）

采用「把整条 remark/rehype 管线统一迁到全局 `markdown` 配置」的方案。理由：

- 这是 Astro 惯用法：共享插件放 `markdown`，`.mdx` 专属的才放 `mdx()`。
- 一次修复 mermaid，同时消除 callout/katex/锚点/复制按钮在 `.md` 上失效的同类隐患。
- `mdx()` 集成会自动继承全局 `markdown` 的插件配置，`.mdx` 仍正常工作，无需重复声明。

`mdx()` 里当前的同名插件将被移除以避免 `.mdx` 重复处理；`syntaxHighlight.excludeLangs: ['mermaid']` 保留。

### 决策 2：无封面详情页用紧凑型 header（用户选定 B）

无封面时渲染紧凑 header：

- 高度降为 `h-48 md:h-64`（有封面时维持 `h-96`）。
- 背景改用主题变量 `bg-card-background`，底部加 `border-b border-border`。
- 文字改为主题色：标题 `text-foreground`、描述 `text-muted`。
- 完全不依赖遮罩，两种主题都成立。

### 决策 3：列表页主题化渐变占位（用户选定 A）

无封面卡片左侧图区改用基于标题/分类的渐变占位：

- 新增 `src/lib/utils/placeholder.ts`：字符串哈希 → 渐变 key（`0..7`）。
- 新增 `src/styles/components/placeholders.css`：8 套预调好的渐变类（`.placeholder-grad-0 … .placeholder-grad-7`），每套都带 `.dark` 覆盖，主题切换自动适配、无需 JS。
- 新增 `src/components/content/CoverPlaceholder.astro`（props：`seed` 文本 + 可选图标名），渲染渐变块 + 居中文档图标。
- `BlogItem.astro` 和 `ImageHeaderBar.astro` 在无封面时改用 `CoverPlaceholder` 取代 `404.jpg` 兜底。

### 决策 4：mermaid 主题联动（用户选定 A）

`Layout.astro` 内联脚本改造：

- 初始化时读 `document.documentElement.classList.contains('dark')` 决定 `theme: 'dark' | 'default'`。
- 首次渲染前把每个 `pre.mermaid` 的原文存进 `data-src` 属性。
- 用 `MutationObserver` 监听 `<html>` 的 `class` 变化；主题切换时把 `pre` 内容还原成 `data-src`、清掉 mermaid 加的 `data-processed`，再 `mermaid.initialize`（新主题）+ `mermaid.run()` 重渲。
- 与现有「React 靠观察 DOM class 同步主题」的模式一致，不引入新的状态桥。

### 决策 5：/about 页主题适配

把 `about/index.astro` 写死的 Tailwind 色换成主题 token：

- `text-slate-900 → text-foreground`
- `text-slate-600 / text-slate-700 → text-muted`
- `bg-white/80 → bg-card-background`
- `border-slate-200 → border-border`

装饰性彩色点（`bg-blue-500` 等）和图标芯片底（`bg-blue-100`）保留色彩但补 `dark:` 变体（如 `bg-blue-100 dark:bg-blue-900/40`），保证两种主题下都清晰。

## 组件设计

### `src/lib/utils/placeholder.ts`

职责：把任意文本映射到固定数量的渐变 key。

- 输入：`seed: string`（标题或分类 slug）。
- 输出：数字 `0..7`，共 8 套渐变（`N=8`）。
- 算法：简单确定性字符串哈希取模，无随机性（同一文章始终同色）。
- 纯函数，无副作用，可在 Astro frontmatter 中调用。

### `src/styles/components/placeholders.css`

职责：提供主题感知的渐变背景类。

- 定义 `.placeholder-grad-0 … .placeholder-grad-7`（共 8 套），每个类含两个 `linear-gradient` 声明（亮色对）。
- 用 `.dark .placeholder-grad-X` 提供 darkness 覆盖。
- 与现有 `--background`、`--primary` 等变量保持配色协调（不抢正文视觉）。

### `src/components/content/CoverPlaceholder.astro`

职责：渲染一个渐变占位图区。

Props：

- `seed: string`（必填，用于选渐变）
- `icon?: string`（可选，默认文档图标）
- `className?: string`（可选，外层 class 透传）

渲染：一个固定比例的渐变容器，居中放一个文档图标（`opacity-80`）。无文字。两种主题下都成立。

### `ArticleCoverImage.astro` 改造

在 frontmatter 判断 `hasCover = Boolean(coverImage)`。模板按 `hasCover` 分两支：

- 有封面：现有 hero（遮罩 + 白字），不变。
- 无封面：紧凑 header（主题色文字 + `bg-card-background`）。

两支共用标题/描述/元数据的内部结构，仅外层容器与配色不同，避免重复。

### `BlogItem.astro` / `ImageHeaderBar.astro` 改造

无封面时用 `CoverPlaceholder` 取代 `fallbackSrc`。`ImageHeaderBar` 的 `@error` 兜底逻辑保留（图片 404 时仍回退到占位组件，而非 404 图）。

## 数据流

```
文章 .md (含 mermaid 代码块)
  → astro markdown 全局管线 (含 rehypeMermaidLite)
  → <pre class="mermaid">原文</pre>
  → Layout.astro 客户端脚本
  → 读取主题 → mermaid.initialize(theme) → mermaid.run()
  → 渲染 SVG 流程图
  → 主题切换 → MutationObserver → 还原 pre 内容 → 重渲
```

```
BlogItem.astro
  → post.data.coverImage 为空?
    → 是: placeholder.ts(seed=title) → grad-key → CoverPlaceholder
    → 否: 用 coverImage
```

## 错误处理

- mermaid 渲染失败（语法错误等）：`mermaid.run()` 本身会在 `pre` 里渲染错误提示，不阻塞页面。客户端脚本用 `try/catch` 包裹，控制台报错但不抛白屏。
- 占位哈希空字符串：`placeholder.ts` 对空 seed 返回固定 `0`，不抛异常。
- `MutationObserver` 不支持的环境：用 `if` 守卫，降级为只初始化一次、不跟随主题（不阻塞首渲）。

## 验证

项目无测试框架（Vitest 未安装），采用手动验证：

1. `/articles/bi-bao-2`（无封面）：明/暗主题下紧凑 header 文字都清晰，无隐形。
2. `/articles` 列表页：含无封面项时显示主题化渐变占位而非 404 图，主题切换时占位配色跟随。
3. 含 flowchart 的 `.md` 文章：流程图在明/暗两种主题下都渲染，且切换主题时图重渲为对应主题。
4. `/about`：明/暗主题下文字与背景对比度均正常，彩色装饰点两种主题都清晰。
5. 抽查一篇 `.md` 文章确认 callout / 标题锚点 / 代码复制按钮也随管线迁移恢复生效（同类隐患验证）。

## 非目标

- 不重构其它页面的配色（首页、links 页等）。
- 不引入测试框架。
- 不改动主题切换机制本身（复用现有 Alpine `appState` / DOM class 方案）。
- 不为有封面的文章改变 hero 行为。
- 不批量给缺封面文章补真实封面图（由作者后续自行补充）。
