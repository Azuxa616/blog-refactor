# 设计文档：文章图片点击放大预览

**日期：** 2026-07-24
**状态：** 已确认
**分支：** restructure-posts-directories

## 背景与目标

当前博客文章正文中的图片（Markdown 中通过 `![](xxx)` 写入、渲染进 `.prose` 容器的 `<img>`）缺少点击放大预览功能。用户阅读技术文章时无法看清截图、流程图等配图的细节。

**目标：** 为 `.prose` 容器内的正文图片提供「灯箱 + 缩放 + 拖拽」的放大预览能力，覆盖桌面端和移动端。

## 需求决策（已与用户确认）

| 维度 | 决策 |
|------|------|
| 交互模型 | 灯箱 + 缩放 + 拖拽（非简单灯箱，非画廊模式） |
| 实现技术 | Alpine.js（复用项目现有 `Modal.astro` 模式） |
| 作用范围 | 仅 `.prose` 容器内的正文图片（不含文章封面 `ArticleCoverImage`） |
| 缩放手势 | 桌面：滚轮缩放 + 按住拖拽；移动端：双指捏合 + 单指拖拽；双击切换 1x/2.5x |

## 方案选型

**选定方案 A：Rehype 插件标记图片 + 独立 Alpine 灯箱组件**

构建时用 rehype 插件声明式标记哪些图片可缩放，运行时用 Alpine 管理灯箱状态。复刻项目现有的「`rehype-code-header.ts`（构建时加属性）+ `Modal.astro`（Alpine 状态驱动）」成熟组合。

**未选方案及理由：**

- **方案 B（纯运行时，无 rehype 插件）：** 放弃构建时声明式标记，"哪些图片可缩放"的决策散落在运行时脚本里，与项目现有模式不一致。
- **方案 C（复用现有 `Modal.astro`）：** `Modal.astro` 为卡片式内容设计（固定尺寸、居中 top-20），把缩放/拖拽逻辑塞进去会让通用组件承担过多职责，违反单一职责。

## 架构设计

### 文件布局（新增 3 个关注点，改动 2 处现有文件）

#### 1. `src/lib/rehype/rehype-image-zoom.ts`（新增）

Rehype 插件，与 `src/lib/rehype/rehype-code-header.ts` 同目录、同模式（`visit` + 改 `properties`）。

职责：遍历 AST 中的 `img` 元素，给它加上 `data-zoomable="true"` 属性和 `zoomable-img` class。纯声明式标记，不含任何交互逻辑。

接口约定：
- 输入：rehype AST（HAST `Root`）。
- 行为：对每个 `tagName === 'img'` 的 `Element` 节点，在其 `properties` 上追加 `dataZoomable: true`，并在 `className` 数组中加入 `'zoomable-img'`（保留已有 class）。
- 输出：修改后的 tree（无返回值，就地修改，与 `rehype-code-header.ts` 一致）。

依赖：`unist-util-visit`、`hast` 类型（`Root`、`Element`）。

#### 2. `src/components/content/ImageLightbox.astro`（新增）

Alpine.js 灯箱组件，参考 `src/components/interactions/Modal.astro` 的 `x-show`/`@keydown.escape.window`/`@click.self` 模式。

职责：全屏遮罩 + 居中 `<img>`，用 `x-data` 管理开关、缩放、平移状态，缩放拖拽手势在 Alpine 事件绑定中完成。

依赖：无外部依赖；使用 Tailwind class 与 `src/styles/components/image-lightbox.css` 中的样式。

#### 3. `src/styles/components/image-lightbox.css`（新增）

灯箱相关样式，在 `src/styles/global.css` 中引入。

#### 4. `astro.config.mjs`（改动）

在 MDX 集成的 `rehypePlugins` 数组中注册 `rehypeImageZoom`，位置放在 `rehypePresetMinify` **之前**（minify 不应破坏插件添加的属性）。建议放在 `rehypeCodeHeader` 之后、`rehypeKatex` 之前。

#### 5. `src/pages/articles/[slug].astro`（改动）

在 `<article>` 末尾（现有代码复制 `<script>` 旁）引入 `<ImageLightbox />`，并新增一小段内联脚本：查询所有 `[data-zoomable]` 图片，点击时把 `src/alt` 写入 Alpine 灯箱并打开。

### 数据流

```
Markdown ![](img.png)
  → MDX rehype 管道
  → rehype-image-zoom.ts 标记 <img data-zoomable class="zoomable-img">
  → 浏览器渲染 .prose 内带标记的图片
  → [slug].astro 内联脚本：click → 设置灯箱 src/alt + open=true
  → ImageLightbox.astro Alpine 接管缩放/拖拽/关闭
```

## 灯箱状态与交互逻辑

### `x-data` 核心状态

```js
{
  open: false,
  src: '',
  alt: '',
  scale: 1,        // 当前缩放倍数，初始 1，范围 [1, 5]
  x: 0, y: 0,      // 平移偏移（translate）
  // 拖拽临时状态
  dragging: false,
  startX: 0, startY: 0,   // pointerdown 时的指针位置
  baseX: 0, baseY: 0      // pointerdown 时已存在的 x/y
}
```

### 交互行为

- **打开：** 图片点击 → 内联脚本设置 `src/alt`、`scale=1`、`x=y=0`、`open=true`。图片从原尺寸淡入放大到适应屏幕（CSS 过渡）。
- **滚轮缩放（桌面）：** `@wheel.prevent` 以光标位置为锚点缩放，范围 `1x ~ 5x`，每次步进约 15%。缩放时同步调整 `x/y` 以保持锚点稳定。
- **双指捏合（移动端）：** 监听 `touchmove` 的两指距离变化，按比例调整 `scale`，范围同样 `[1, 5]`。
- **拖拽平移：** 仅 `scale > 1` 时启用。`pointerdown` 记录 `startX/Y` 与 `baseX/Y`；`pointermove` 更新 `x = baseX + (currentX - startX)`、`y` 同理；`pointerup/leave` 置 `dragging=false`。`scale === 1` 时禁用拖拽（原图无平移意义）。
- **双击切换：** 双击在 `1x` 和 `2.5x` 之间切换，并重置 `x=y=0`。
- **关闭：** 点击遮罩空白处（`@click.self`）、按 `Esc`（`@keydown.escape.window`）、或点击右上角关闭按钮。关闭时重置 `scale=1`、`x=y=0`、`src=''`。

## 样式设计

新增 `src/styles/components/image-lightbox.css`：

- **遮罩：** `position: fixed; inset: 0; z-index: 50`（与 `Modal.astro` 一致），半透明黑底 `background: rgba(0,0,0,0.8)`，`backdrop-filter: blur(4px)`。
- **图片变换：** `transform: translate(var(--x), var(--y)) scale(var(--scale))`，配合 `transition: transform 0.2s ease`（拖拽进行中时移除过渡以保证跟手）。
- **光标：** `.zoomable-img { cursor: zoom-in }`；灯箱内 `scale===1` 时 `cursor: zoom-out`，`scale>1` 拖拽时 `cursor: grab` / `grabbing`。
- **关闭按钮：** 右上角，复用 `/svgs/close.svg`（与 `Modal.astro` 一致），`width/height: 24px`。
- **响应式：** 图片最大尺寸 `max-width: 90vw; max-height: 90vh`，保持比例 `object-fit: contain`。

## 边界情况与错误处理

- **图片加载失败：** 灯箱 `<img>` 加 `@error` 回退关闭并 `console.error`（遵循项目"不空 catch"约定）。
- **缩放越界：** `scale` 钳制在 `[1, 5]`，低于 1 时归 1 并重置偏移。
- **平移越界：** 拖拽偏移限制在图片放大部分的可视范围内，避免拖出屏幕。边界计算公式：`maxOffset = (scale - 1) * imageSize / 2`，钳制 `x/y` 在 `[-maxOffset, maxOffset]`。
- **移动端手势冲突：** 仅在 `touches.length === 2` 时走捏合逻辑，`touches.length === 1` 走拖拽，避免冲突。
- **body 滚动锁定：** 灯箱打开时设 `document.body.style.overflow = 'hidden'`，关闭时恢复原值。
- **可访问性：** 灯箱根容器加 `role="dialog"`、`aria-modal="true"`、`aria-label="图片预览"`；图片保留 `alt` 文本。键盘可用 `Esc` 关闭。

## 测试策略

项目当前无测试框架（未安装 Vitest）。采用手动验证清单：

1. 桌面端：点击 `.prose` 内图片 → 灯箱打开、滚轮缩放、按住拖拽、双击切换、Esc/点击空白/按钮关闭。
2. 移动端：点击图片 → 双指捏合、单指拖拽、双击切换。
3. 边界：加载失败回退、缩放/平移钳制、body 滚动锁定与恢复。
4. 范围确认：文章封面 `ArticleCoverImage` 点击无反应；`.prose` 内图片有 `cursor: zoom-in`。
5. 深色模式：遮罩、按钮、光标在 `dark` 主题下表现正常。

## 不在范围内（YAGNI）

- 画廊模式（多图 prev/next 切换）。
- 全屏下载按钮。
- 图片标注/批注。
- 文章封面图 `ArticleCoverImage` 的放大。
- 非 `.prose` 容器、非文章详情页的图片放大。
