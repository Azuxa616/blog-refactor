# 修复封面/流程图/关于页渲染问题 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 修复无封面文章标题隐形、列表页 404 兜底图、mermaid 流程图不渲染、/about 黑暗模式文字隐形四个问题。

**Architecture:** mermaid 修复走「插件管线从 `mdx()` 迁到全局 `markdown` + 客户端主题联动重渲」；封面问题走「详情页紧凑 header + 列表页哈希渐变占位组件」；about 走主题 token 替换。各任务彼此独立、可单独验证。

**Tech Stack:** Astro 6.x (SSR + Vercel)、Tailwind CSS 4.x、Alpine.js、rehype-mermaid-lite（客户端渲染）、原生 CSS 变量主题系统。

## Global Constraints

- 代码风格：无分号、单引号、中文注释、`import type` 用于纯类型导入（Prettier `semi: false, singleQuote: true`）。
- 路径别名：`@/` 映射到 `./src/`。
- **本项目无测试框架**（Vitest 未安装）。所有任务的「验证」步骤通过 `pnpm dev`（localhost:4321）手动核对明/暗两种主题，不写自动化测试。
- 颜色一律走主题变量（`text-foreground` / `bg-card-background` / `border-border` 等）或 `.dark` 变体，禁止再新增写死 Tailwind 色（除非是保留的装饰性彩色点，需补 `dark:` 变体）。
- 主键配置：`syntaxHighlight.excludeLangs: ['mermaid']` 必须保留。
- 占位渐变固定 8 套（`N=8`，编号 `0..7`）。
- 实施文档前提修正：`ImageHeaderBar` 的 `mode === 'article'` 分支是死代码（全项目无调用），文章详情页用 `ArticleCoverImage`、列表卡片用 `BlogItem`。ImageHeaderBar 仅做一行兜底图安全替换。

---

### Task 1: 占位渐变工具 `placeholder.ts`

**Files:**
- Create: `src/lib/utils/placeholder.ts`

**Interfaces:**
- Produces: `getPlaceholderGradient(seed: string): number`（返回 `0..7`），`PLACEHOLDER_GRADIENT_COUNT = 8`。后续 Task 3 `CoverPlaceholder.astro` 消费 `getPlaceholderGradient`。

- [ ] **Step 1: 创建工具文件**

创建 `src/lib/utils/placeholder.ts`（放在已有的 `src/lib/utils/` 目录，与 `color.ts`、`helpers.ts` 同级）：

```ts
/**
 * 占位渐变生成工具
 * 根据文本种子确定性映射到固定数量的渐变 key
 */

/** 预定义渐变数量 */
export const PLACEHOLDER_GRADIENT_COUNT = 8

/**
 * 字符串哈希（确定性，无随机性）
 * 同一篇文章始终映射到同一渐变
 */
export function hashSeed(seed: string): number {
  const text = seed || ''
  let hash = 0
  for (let i = 0; i < text.length; i++) {
    hash = (hash << 5) - hash + text.charCodeAt(i)
    hash |= 0 // 转为 32 位整数
  }
  return Math.abs(hash)
}

/**
 * 根据种子返回渐变 key（0..N-1）
 * 空 seed 返回固定 0，不抛异常
 */
export function getPlaceholderGradient(seed: string): number {
  if (!seed) return 0
  return hashSeed(seed) % PLACEHOLDER_GRADIENT_COUNT
}
```

- [ ] **Step 2: 验证（类型检查）**

Run: `pnpm astro check`
Expected: 无新增错误（`placeholder.ts` 为纯函数，无依赖）。

- [ ] **Step 3: Commit**

```bash
git add src/lib/utils/placeholder.ts
git commit -m "feat(placeholder): add deterministic gradient key utility"
```

---

### Task 2: 占位渐变样式 `placeholders.css`

**Files:**
- Create: `src/styles/components/placeholders.css`
- Modify: `src/styles/global.css`（在 `@import './components/callouts.css';` 之后新增一行 import）

**Interfaces:**
- Produces: `.placeholder-grad`（基础渐变声明）+ `.placeholder-grad-0 … .placeholder-grad-7`（每套一对 CSS 变量，`.dark` 覆盖）。Task 3 消费这些类名。

- [ ] **Step 1: 创建样式文件**

创建 `src/styles/components/placeholders.css`：

```css
/* 占位封面渐变 - 8 套主题感知渐变 */
/* 每个 .placeholder-grad-X 定义 --grad-from / --grad-to，.dark 覆盖提供暗色对 */

.placeholder-grad {
  background-image: linear-gradient(135deg, var(--grad-from), var(--grad-to));
}

/* 0: 翠绿 → 青色 */
.placeholder-grad-0 { --grad-from: #6ee7b7; --grad-to: #5eead4; }
.dark .placeholder-grad-0 { --grad-from: #047857; --grad-to: #0f766e; }

/* 1: 天蓝 → 靛蓝 */
.placeholder-grad-1 { --grad-from: #7dd3fc; --grad-to: #818cf8; }
.dark .placeholder-grad-1 { --grad-from: #0369a1; --grad-to: #4338ca; }

/* 2: 玫红 → 粉色 */
.placeholder-grad-2 { --grad-from: #fda4af; --grad-to: #f472b6; }
.dark .placeholder-grad-2 { --grad-from: #be123c; --grad-to: #9d174d; }

/* 3: 琥珀 → 橙色 */
.placeholder-grad-3 { --grad-from: #fcd34d; --grad-to: #fb923c; }
.dark .placeholder-grad-3 { --grad-from: #b45309; --grad-to: #9a3412; }

/* 4: 紫罗兰 → 品红 */
.placeholder-grad-4 { --grad-from: #c4b5fd; --grad-to: #e879f9; }
.dark .placeholder-grad-4 { --grad-from: #6d28d9; --grad-to: #a21caf; }

/* 5: 青色 → 蓝色 */
.placeholder-grad-5 { --grad-from: #67e8f9; --grad-to: #60a5fa; }
.dark .placeholder-grad-5 { --grad-from: #0e7490; --grad-to: #1d4ed8; }

/* 6: 青柠 → 绿色 */
.placeholder-grad-6 { --grad-from: #bef264; --grad-to: #4ade80; }
.dark .placeholder-grad-6 { --grad-from: #4d7c0f; --grad-to: #15803d; }

/* 7: 品红 → 紫色 */
.placeholder-grad-7 { --grad-from: #f0abfc; --grad-to: #a78bfa; }
.dark .placeholder-grad-7 { --grad-from: #a21caf; --grad-to: #6d28d9; }
```

- [ ] **Step 2: 在 global.css 引入**

修改 `src/styles/global.css`，在 `@import './components/callouts.css';` 这一行之后新增：

```css
@import './components/placeholders.css';
```

- [ ] **Step 3: 验证**

Run: `pnpm dev`
Expected: dev server 正常启动，控制台无 CSS import 报错。

- [ ] **Step 4: Commit**

```bash
git add src/styles/components/placeholders.css src/styles/global.css
git commit -m "style(placeholder): add 8 theme-aware cover gradient classes"
```

---

### Task 3: 渐变占位组件 `CoverPlaceholder.astro`

**Files:**
- Create: `src/components/content/CoverPlaceholder.astro`

**Interfaces:**
- Consumes: `getPlaceholderGradient` from `@/lib/utils/placeholder`（Task 1）；`.placeholder-grad` / `.placeholder-grad-N` 类名（Task 2）。
- Produces: `<CoverPlaceholder seed="..." />` Astro 组件，props `{ seed: string, icon?: string, className?: string }`。Task 4 消费。

- [ ] **Step 1: 创建组件文件**

创建 `src/components/content/CoverPlaceholder.astro`：

```astro
---
// CoverPlaceholder.astro
// 无封面文章的渐变占位图区
// 根据种子文本确定性选择渐变，主题感知（.dark 覆盖）

import { getPlaceholderGradient } from '@/lib/utils/placeholder'

interface Props {
  /** 用于生成渐变的种子文本（标题或分类） */
  seed: string
  /** 图标路径，默认文档图标 */
  icon?: string
  /** 外层 class 透传 */
  className?: string
}

const { seed, icon = '/svgs/file-text.svg', className = '' } = Astro.props
const gradKey = getPlaceholderGradient(seed)
---

<div
  class={`placeholder-grad placeholder-grad-${gradKey} w-full h-full flex items-center justify-center ${className}`}
>
  <img src={icon} width="48" height="48" alt="" class="opacity-80" />
</div>
```

- [ ] **Step 2: 验证（类型检查）**

Run: `pnpm astro check`
Expected: 无新增错误。

- [ ] **Step 3: Commit**

```bash
git add src/components/content/CoverPlaceholder.astro
git commit -m "feat(content): add CoverPlaceholder gradient component"
```

---

### Task 4: 列表卡片 `BlogItem.astro` 用占位组件替换 404 兜底

**Files:**
- Modify: `src/components/content/BlogItem.astro`

**Interfaces:**
- Consumes: `<CoverPlaceholder />`（Task 3）。

- [ ] **Step 1: 引入组件并替换无封面分支**

修改 `src/components/content/BlogItem.astro`。在 frontmatter 顶部 import 区新增：

```astro
import CoverPlaceholder from '@/components/content/CoverPlaceholder.astro'
```

删除 frontmatter 末尾的 `const fallbackSrc = '/imgs/404.jpg'` 这一行（不再使用）。

将「封面图片」那个 `<div>` 区块整体替换。原代码：

```astro
  <!-- 灏侀潰鍥剧墖 -->
  <div 
    class="w-full sm:w-1/3 sm:h-60 overflow-hidden relative rounded-lg bg-cover bg-center"
    style={`background-image: url(${coverImage || fallbackSrc})`}
  >
    <img
      src={coverImage || fallbackSrc}
      alt={title}
      class="w-full h-full opacity-0"
    />
  </div>
```

替换为：

```astro
  {/* 鏂囩珷灏侀潰锛氭湁鍥捐嚜鍔ㄥ姞杞斤紝鏃犲浘鐢ㄦ笎鍙樺崰浣 */}
  {coverImage ? (
    <div
      class="w-full sm:w-1/3 sm:h-60 overflow-hidden relative rounded-lg bg-cover bg-center"
      style={`background-image: url(${coverImage})`}
    >
      <img src={coverImage} alt={title} class="w-full h-full opacity-0" />
    </div>
  ) : (
    <div class="w-full sm:w-1/3 sm:h-60 overflow-hidden rounded-lg">
      <CoverPlaceholder seed={title || 'untitled'} />
    </div>
  )}
```

- [ ] **Step 2: 验证（手动）**

Run: `pnpm dev`，打开 `http://localhost:4321/articles`。
Expected: 7 篇无封面文章（如 bi-bao-2、event-loop-2、hooks-2）的卡片左侧显示彩色渐变 + 文档图标，而非 404 图；不同标题呈现不同但稳定的渐变色；切换明/暗主题时占位配色跟随变化（亮色柔和、暗色加深）。

- [ ] **Step 3: Commit**

```bash
git add src/components/content/BlogItem.astro
git commit -m "fix(content): replace 404 fallback with gradient placeholder in BlogItem"
```

---

### Task 5: 无封面详情页紧凑型 header（`ArticleCoverImage.astro`）

**Files:**
- Modify: `src/components/content/ArticleCoverImage.astro`

**Interfaces:**
- 无新增对外接口；仅内部按 `coverImage` 是否存在分支渲染。

- [ ] **Step 1: frontmatter 增加 hasCover 判断**

在 `src/components/content/ArticleCoverImage.astro` 的 frontmatter，`} = Astro.props` 之后新增一行：

```astro
const hasCover = Boolean(coverImage)
```

- [ ] **Step 2: 模板按 hasCover 分两支**

把现有 `<header class="relative h-96 overflow-hidden">…</header>` 整体替换为下面的分支结构。有封面分支保持原 hero（遮罩 + 白字）不变；无封面分支改用主题色紧凑 header：

```astro
{hasCover && (
  <header class="relative h-96 overflow-hidden">
    <div class="absolute inset-0">
      <img src={coverImage} alt={title} class="w-full h-full object-cover" />
      <div class="absolute inset-0 bg-gradient-to-b from-black/20 via-black/60 to-black/80" />
    </div>
    <div
      class="relative z-10 h-full flex flex-col items-center justify-center text-center px-4"
    >
      <h1 class="text-3xl md:text-5xl font-bold text-white mb-4 leading-tight">
        {title}
      </h1>
      {description && (
        <p class="text-base md:text-lg text-white/80 mb-6 max-w-2xl">
          {description}
        </p>
      )}
      <div
        class="flex flex-wrap items-center justify-center gap-4 text-white/90 text-sm"
      >
        {category && (
          <>
            <CategoryBadge title={category} color="#ffffff" />
            <span class="text-white/40">|</span>
          </>
        )}
        <span class="flex items-center gap-1.5">
          <img src="/svgs/calendar.svg" width="14" height="14" alt="鍙戝竷鏃ユ湡" loading="eager" />
          {updatedDate ? (
            <span>路 鏇存柊浜?{updatedDate.toLocaleDateString('zh-CN')}</span>
          ) : (
            <span>{publishDate.toLocaleDateString('zh-CN')}</span>
          )}
        </span>
        {tags && tags.length > 0 && (
          <>
            <span class="text-white/40">|</span>
            <div class="flex flex-wrap items-center justify-center gap-2">
              {tags.map((tag) => (
                <Tag label={tag} bgColor="#ffffff" size="sm" />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  </header>
)}

{!hasCover && (
  <header class="h-48 md:h-64 bg-card-background border-b border-border">
    <div
      class="h-full max-w-4xl mx-auto px-4 flex flex-col items-center justify-center text-center"
    >
      <h1 class="text-3xl md:text-4xl font-bold text-foreground mb-3 leading-tight">
        {title}
      </h1>
      {description && (
        <p class="text-base md:text-lg text-muted mb-4 max-w-2xl">
          {description}
        </p>
      )}
      <div class="flex flex-wrap items-center justify-center gap-4 text-muted text-sm">
        {category && (
          <>
            <CategoryBadge title={category} color="#ffffff" />
            <span class="text-border">|</span>
          </>
        )}
        <span class="flex items-center gap-1.5">
          <img src="/svgs/calendar.svg" width="14" height="14" alt="鍙戝竷鏃ユ湡" loading="eager" />
          {updatedDate ? (
            <span>路 鏇存柊浜?{updatedDate.toLocaleDateString('zh-CN')}</span>
          ) : (
            <span>{publishDate.toLocaleDateString('zh-CN')}</span>
          )}
        </span>
        {tags && tags.length > 0 && (
          <>
            <span class="text-border">|</span>
            <div class="flex flex-wrap items-center justify-center gap-2">
              {tags.map((tag) => (
                <Tag label={tag} bgColor="#f1f5f9" size="sm" />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  </header>
)}
```

说明：无封面分支文字用 `text-foreground`（标题）/ `text-muted`（描述、元数据），背景 `bg-card-background` + 底部 `border-b border-border`，完全不依赖遮罩，两种主题都成立。Tag 在无封面分支用浅灰 `#f1f5f9` 背景便于阅读。

- [ ] **Step 3: 验证（手动）**

Run: `pnpm dev`，打开 `http://localhost:4321/articles/bi-bao-2`。
Expected:
- 白日模式：header 高度变小（约 `h-48`/`h-64`），背景为卡片色，标题深色清晰可读，无白字隐形。
- 黑暗模式：标题浅色清晰，背景深色卡片色，对比正常。
- 切换主题文字都清晰。

- [ ] **Step 4: Commit**

```bash
git add src/components/content/ArticleCoverImage.astro
git commit -m "fix(content): add compact theme-aware header for coverless articles"
```

---

### Task 6: Markdown 插件管线迁移到全局 `markdown` 配置（修复 mermaid 核心问题）

**Files:**
- Modify: `astro.config.mjs`

**Interfaces:**
- 修改 Astro 构建配置，使所有 remark/rehype 插件（含 `rehypeMermaidLite`）作用于 `.md` 文章。

- [ ] **Step 1: 把插件管线从 mdx() 移到 markdown**

修改 `astro.config.mjs`。当前的 `markdown` 配置只有：

```js
  markdown: {
    syntaxHighlight: {
      excludeLangs: ['mermaid'],
    },
  },
```

把 `mdx({ … })` 里的 `remarkPlugins` 和 `rehypePlugins` 数组整体移到 `markdown` 下（保留 `syntaxHighlight.excludeLangs`）。`mdx()` 集成会自动继承全局 `markdown` 插件，因此 `.mdx` 不受影响，无需重复声明。`mdx()` 里保留其独立的 `syntaxHighlight: 'shiki'` + `shikiConfig`（不改动 .mdx 高亮行为），仅移除 `remarkPlugins` / `rehypePlugins`。

修改后 `markdown` 配置：

```js
  markdown: {
    syntaxHighlight: {
      excludeLangs: ['mermaid'],
    },
    remarkPlugins: [
      remarkMath,
      remarkGfm,
      remarkEmoji,
      remarkCallout,
      [
        remarkToc,
        {
          heading: '鐩綍',
          maxDepth: 3,
          tight: true,
        },
      ],
    ],
    rehypePlugins: [
      rehypeMermaidLite,
      rehypeSlug,
      [
        rehypeAutolinkHeadings,
        {
          behavior: 'append',
          properties: {
            className: ['anchor-link'],
            ariaLabel: '璺宠浆鍒版绔犺妭',
          },
        },
      ],
      [
        rehypeExternalLinks,
        {
          target: '_blank',
          rel: ['noopener', 'noreferrer'],
        },
      ],
      rehypeCodeHeader,
      rehypeKatex,
      rehypePresetMinify,
    ],
  },
```

`mdx()` 集成简化为（移除 remarkPlugins/rehypePlugins）：

```js
    mdx({
      syntaxHighlight: 'shiki',
      shikiConfig: {
        theme: 'github-dark',
      },
    }),
```

- [ ] **Step 2: 验证（dev server + 流程图结构）**

Run: `pnpm dev`，找一篇含 mermaid 代码块的 `.md` 文章（或临时在一篇 `.md` 里加一段测试流程图）。
Expected: dev server 正常启动；查看该文章页源码，`mermaid` 代码块已被转成 `<pre class="mermaid">…</pre>`（而非 `<code class="language-mermaid">`）。此时图尚未渲染（需 Task 7 客户端脚本），但结构已就绪。

- [ ] **Step 3: Commit**

```bash
git add astro.config.mjs
git commit -m "fix(markdown): move remark/rehype pipeline to global config for .md"
```

---

### Task 7: mermaid 客户端主题联动重渲（`Layout.astro`）

**Files:**
- Modify: `src/layouts/Layout.astro`（替换 `<head>` 里的 mermaid `<script type="module">`）

**Interfaces:**
- 消费 Task 6 产出的 `<pre class="mermaid">` 元素；与现有「React 靠观察 `<html>` class 同步主题」的机制对齐（不引入新状态桥）。

- [ ] **Step 1: 替换 mermaid 内联脚本**

在 `src/layouts/Layout.astro` 的 `<head>` 中，当前脚本为：

```astro
    <script type="module">
      import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs'
      mermaid.initialize({
        startOnLoad: true,
        theme: 'dark',
      })
    </script>
```

替换为（读主题、缓存原文、首渲、MutationObserver 监听 `<html>` class 变化时重渲）：

```astro
    <script type="module">
      import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs'

      // 鎸夊綋鍓嶄富棰樺喅瀹?mermaid 涓婚
      const getTheme = () =>
        document.documentElement.classList.contains('dark') ? 'dark' : 'default'

      // 缂撳瓨姣忎釜 mermaid 鍧楃殑鍘熸枃锛屼緵涓婚鍒囨崲鏃堕噸娲?
      function cacheSources() {
        document.querySelectorAll('pre.mermaid:not([data-processed])').forEach((el) => {
          if (!el.dataset.src) el.dataset.src = el.textContent || ''
        })
      }

      async function renderMermaid() {
        mermaid.initialize({ startOnLoad: false, theme: getTheme() })
        try {
          await mermaid.run()
        } catch (err) {
          console.error('Mermaid 娓℃煋澶辫触:', err)
        }
      }

      async function rerenderMermaid() {
        document.querySelectorAll('pre.mermaid').forEach((el) => {
          el.removeAttribute('data-processed')
          el.innerHTML = el.dataset.src || ''
        })
        await renderMermaid()
      }

      cacheSources()
      renderMermaid()

      // 涓婚鍒囨崲鏃堕噸娓诧紙鐩戝惉 html class锛屼笌 React 涓婚鍚屾鏂规涓€鑷达級
      if ('MutationObserver' in window) {
        const observer = new MutationObserver((mutations) => {
          for (const m of mutations) {
            if (m.attributeName === 'class') {
              rerenderMermaid()
              break
            }
          }
        })
        observer.observe(document.documentElement, {
          attributes: true,
          attributeFilter: ['class'],
        })
      }
    </script>
```

要点：`cacheSources()` 必须在首次 `renderMermaid()` 之前调用（`run()` 会替换 innerHTML）；`rerenderMermaid` 先还原 `data-src` 原文、清掉 `data-processed`，再以新主题重跑；`MutationObserver` 用 `if` 守卫降级。

- [ ] **Step 2: 验证（手动）**

Run: `pnpm dev`，打开含 mermaid 流程图的 `.md` 文章。
Expected:
- 流程图渲染为 SVG（不再是纯文字）。
- 暗色主题下图是深色风格；切换到白日主题后，图在 ~1 秒内重渲为浅色 `default` 风格；再切回暗色又变深。图始终跟随主题。
- 控制台无未捕获异常（语法错误的图 mermaid 自身会在 `pre` 内显示错误提示，不白屏）。

- [ ] **Step 3: Commit**

```bash
git add src/layouts/Layout.astro
git commit -m "feat(mermaid): theme-reactive re-render on theme switch"
```

---

### Task 8: `/about` 页主题 token 替换

**Files:**
- Modify: `src/pages/about/index.astro`

**Interfaces:**
- 无新增接口；纯样式 class 替换。

全局替换规则（在 `src/pages/about/index.astro` 内逐处替换）：

| 原值 | 新值 |
|------|------|
| `text-slate-900` | `text-foreground` |
| `text-slate-600` | `text-muted` |
| `text-slate-700` | `text-muted` |
| `text-slate-500` | `text-muted` |
| `bg-white/80` | `bg-card-background` |
| `border-slate-200` | `border-border` |

装饰性彩色点与图标芯片底保留色彩但补 `dark:` 变体：

| 原值 | 新值 |
|------|------|
| `bg-blue-500` | `bg-blue-500 dark:bg-blue-400` |
| `bg-green-500` | `bg-green-500 dark:bg-green-400` |
| `bg-purple-500` | `bg-purple-500 dark:bg-purple-400` |
| `bg-orange-500` | `bg-orange-500 dark:bg-orange-400` |
| `bg-red-500` | `bg-red-500 dark:bg-red-400` |
| `bg-blue-100` | `bg-blue-100 dark:bg-blue-900/40` |
| `bg-gray-100` | `bg-gray-100 dark:bg-gray-900/40` |
| `bg-green-100` | `bg-green-100 dark:bg-green-900/40` |
| `hover:text-blue-600` | `hover:text-blue-600 dark:hover:text-blue-400` |

- [ ] **Step 1: 执行替换**

按上表在 `src/pages/about/index.astro` 全文替换所有匹配项。注意彩色点有的带 `shrink-0`，替换时只替换颜色 class，保留 `shrink-0`。

- [ ] **Step 2: 验证（手动）**

Run: `pnpm dev`，打开 `http://localhost:4321/about`。
Expected:
- 白日模式：文字深色清晰，卡片浅底，彩色点明亮。
- 黑暗模式：标题/正文浅色清晰可读（不再隐形），卡片深色，彩色点稍亮（`*-400`）保持可辨，图标芯片底为半透明深色。
- 切换主题过渡正常。

- [ ] **Step 3: Commit**

```bash
git add src/pages/about/index.astro
git commit -m "fix(about): apply theme tokens and dark variants for dark mode"
```

---

### Task 9: `ImageHeaderBar.astro` 兜底图安全替换（修正 spec 前提）

**Files:**
- Modify: `src/components/layout/ImageHeaderBar.astro`

**背景**：核实发现 `ImageHeaderBar` 仅在 `articles/index.astro` 以默认模式（真实背景图 `index-bg-img-04.png`）使用，`mode === 'article'` 分支为死代码。因此本组件无「无封面占位」问题，仅把 `@error` 兜底图从观感差的 `404.jpg` 换成一张中性背景图，防止背景图真加载失败时显示 404。

- [ ] **Step 1: 替换 fallbackSrc**

在 `src/components/layout/ImageHeaderBar.astro` 的 frontmatter，将：

```astro
const fallbackSrc = '/imgs/404.jpg'
```

替换为：

```astro
const fallbackSrc = '/imgs/index-bg-img-01.png'
```

（用已有的一张中性背景图作为兜底，而非 404 图。）

- [ ] **Step 2: 验证（手动）**

Run: `pnpm dev`，打开 `http://localhost:4321/articles`。
Expected: 列表页顶部 header 背景图正常显示（默认 bg 未失败，无变化）。仅在 `src` 改成不存在路径临时测试时，才回退到中性背景图（非 404）。

- [ ] **Step 3: Commit**

```bash
git add src/components/layout/ImageHeaderBar.astro
git commit -m "fix(layout): use neutral fallback image instead of 404 in ImageHeaderBar"
```

---

## 自审记录（Self-Review）

- **Spec 覆盖**：决策1（管线迁移）→ Task 6；决策2（紧凑 header）→ Task 5；决策3（渐变占位）→ Task 1+2+3+4；决策4（mermaid 主题联动）→ Task 6+7；决策5（about tokens）→ Task 8。全部覆盖。
- **前提修正**：spec 把 ImageHeaderBar 列为封面兜底路径，核查后发现其 article 模式是死代码，故新增 Task 9 做最小安全替换，避免在死代码上构建占位逻辑。
- **类型一致**：`getPlaceholderGradient` 返回 `number`（Task 1 定义），`CoverPlaceholder`（Task 3）与 `BlogItem`（Task 4）均按此消费；类名 `.placeholder-grad-N`（Task 2 定义）与组件拼接（Task 3）一致。
- **占位符扫描**：无 TBD/TODO；每个改动步骤均含完整代码。
