# remark 和 rehype 插件详解

## 概述

本文档详细介绍了可用于 Astro MDX 的常用 remark 和 rehype 插件，帮助你根据需求选择合适的插件。

## 什么是 remark 和 rehype？

- **remark**: 解析 Markdown 的工具链，用于转换和增强 Markdown 语法
- **rehype**: 解析 HTML 的工具链，用于转换和增强 HTML 输出
- **处理流程**: Markdown → remark 插件 → rehype 插件 → HTML

## 插件分类

### remark 插件（Markdown 语法增强）

#### 1. remark-gfm

**全名**: GitHub Flavored Markdown

**功能**: 支持 GitHub 的 Markdown 扩展语法

**支持的特性**:
- 表格
- 删除线（`~~文本~~`）
- 任务列表（`- [ ]`）
- 自动链接（URL 自动识别）
- 定义列表

**示例**:
```markdown
| 功能 | Markdown | MDX |
|------|----------|-----|
| 组件 | ❌ | ✅ |

- [x] 已完成
- [ ] 未完成

~~删除的文本~~
```

**必要性**: ⭐⭐⭐⭐⭐ (强烈推荐)

**性能影响**: 低

---

#### 2. remark-toc

**全名**: Table of Contents

**功能**: 自动生成文章目录

**配置选项**:
```javascript
[remarkToc, {
  heading: '目录',        // 目录标题
  maxDepth: 3,           // 最大深度（1-6）
  tight: true,            // 紧凑模式（减少间距）
  ordered: false,         // 是否使用有序列表
  prefix: '',            // 添加到链接的前缀
  skip: 'Introduction',  // 跳过的标题
  parents: 'section',    // 父容器标签
}]
```

**示例**:
```markdown
# 标题一

## 标题二

### 标题三

<!-- 自动生成目录 -->
## 目录
- [标题二](#标题二)
  - [标题三](#标题三)
```

**必要性**: ⭐⭐⭐⭐ (推荐)

**性能影响**: 低

---

#### 3. remark-math

**全名**: Math Support

**功能**: 支持 LaTeX 数学公式语法

**支持的语法**:
- 行内公式: `$E=mc^2$`
- 块级公式: `$$\sum_{i=1}^{n} i = \frac{n(n+1)}{2}$$`

**示例**:
```markdown
行内公式：$E=mc^2$

块级公式：
$$
f(x) = \int_{-\infty}^{\infty} \hat{f}(\xi)\,e^{2\pi i \xi x} \,d\xi
$$
```

**注意**: 需要配合 `rehype-katex` 或 `rehype-katex` 使用

**必要性**: ⭐⭐ (需要数学公式时推荐)

**性能影响**: 中

---

#### 4. remark-callout

**全名**: Callout Blocks

**功能**: 支持 GitHub 风格的提示框（callouts）

**语法**:
```markdown
> [!NOTE]
> 这是一条提示信息

> [!TIP]
> 这是一条建议

> [!WARNING]
> 这是一条警告

> [!CAUTION]
> 这是一条注意事项
```

**输出效果**:
```html
<div class="callout-blue" data-callout="note">
  <p>这是一条提示信息</p>
</div>
```

**需要自定义样式**:
```css
.callout-blue {
  background: #e3f2fd;
  border-left: 4px solid #2196f3;
  padding: 1rem;
  border-radius: 4px;
}
```

**必要性**: ⭐⭐⭐ (喜欢 GitHub 风格时推荐)

**性能影响**: 低

---

#### 5. remark-emoji

**全名**: Emoji Support

**功能**: 支持 emoji 快捷码

**示例**:
```markdown
:smile: → 😊
:heart: → ❤️
:rocket: → 🚀
:zap: → ⚡
```

**必要性**: ⭐⭐ (需要 emoji 时推荐)

**性能影响**: 低

---

#### 6. remark-smartypants

**全名**: Smart Punctuation

**功能**: 智能标点符号转换

**转换规则**:
- `---` → em dash (—)
- `--` → en dash (–)
- `"` → "智能引号"
- `'` → '智能引号'
- `...` → ellipsis (…)

**示例**:
```markdown
输入: Hello--world! "Quote" 'Single'

输出: Hello–world! "Quote" 'Single'
```

**必要性**: ⭐⭐ (需要更好的排版时推荐)

**性能影响**: 低

---

### rehype 插件（HTML 输出增强）

#### 1. rehype-slug

**全名**: Add IDs to Headings

**功能**: 自动为标题（h1-h6）添加 id 属性

**示例**:
```markdown
## Hello World
```

**输出**:
```html
<h2 id="hello-world">Hello World</h2>
```

**配置选项**:
```javascript
[rehypeSlug, {
  prefix: '',        // 添加到 id 的前缀
  separator: '-',    // 分隔符
  removeAccents: true // 移除重音符号
}]
```

**必要性**: ⭐⭐⭐⭐⭐ (强烈推荐，配合锚点链接使用)

**性能影响**: 低

---

#### 2. rehype-autolink-headings

**全名**: Add Links to Headings

**功能**: 自动为标题添加可点击的锚点链接

**配置选项**:
```javascript
[rehypeAutolinkHeadings, {
  behavior: 'prepend',  // 'prepend' | 'append' | 'wrap' | 'before' | 'after'
  properties: {
    className: ['anchor-link'],
    ariaLabel: '跳转到此章节',
  },
  content: {
    type: 'element',
    tagName: 'span',
    properties: { className: ['icon'] },
    children: [{ type: 'text', value: '#' }],
  },
}]
```

**示例**:
```markdown
## 标题
```

**输出**:
```html
<h2 id="标题">
  标题
  <a class="anchor-link" aria-label="跳转到此章节" href="#标题">#</a>
</h2>
```

**必要性**: ⭐⭐⭐⭐ (推荐)

**性能影响**: 低

---

#### 3. rehype-katex

**全名**: KaTeX Support

**功能**: 将 LaTeX 数学公式渲染为 HTML

**依赖**:
- 需要配合 `remark-math` 使用
- 需要安装 `katex` 包

**配置选项**:
```javascript
[rehypeKatex, {
  strict: false,        // 严格模式
  throwOnError: false,  // 错误时抛出异常
  errorColor: '#cc0000', // 错误颜色
}]
```

**示例**:
```markdown
$$
\int_0^\infty e^{-x^2} dx = \frac{\sqrt{\pi}}{2}
$$
```

**输出**:
```html
<!-- KaTeX 渲染的 HTML -->
<span class="katex">...</span>
```

**注意**: 需要导入 KaTeX CSS:
```astro
---
import 'katex/dist/katex.min.css';
---
```

**必要性**: ⭐⭐ (需要数学公式时推荐)

**性能影响**: 中

---

#### 4. rehype-external-links

**全名**: Handle External Links

**功能**: 为外部链接自动添加 target="_blank" 和 rel 属性

**配置选项**:
```javascript
[rehypeExternalLinks, {
  target: '_blank',
  rel: ['noopener', 'noreferrer'],
  protocols: ['http', 'https'],
  test: (href) => {
    // 自定义判断逻辑
    return !href.startsWith('/');
  },
}]
```

**示例**:
```markdown
[外部链接](https://example.com)
[内部链接](/about)
```

**输出**:
```html
<a href="https://example.com" target="_blank" rel="noopener noreferrer">外部链接</a>
<a href="/about">内部链接</a>
```

**必要性**: ⭐⭐⭐ (推荐)

**性能影响**: 低

---

#### 5. rehype-preset-minify

**全名**: Minify HTML

**功能**: 压缩 HTML 输出，减少文件大小

**压缩效果**:
- 移除多余的空格和换行
- 移除不必要的引号
- 优化属性顺序
- 移除注释

**示例**:
```html
<!-- 压缩前 -->
<div class="container">
  <p>Hello</p>
</div>

<!-- 压缩后 -->
<div class="container"><p>Hello</p></div>
```

**必要性**: ⭐⭐⭐⭐ (推荐用于生产环境)

**性能影响**: 中（构建时间增加，运行时无影响）

---

#### 6. rehype-img-size

**全名**: Add Image Dimensions

**功能**: 自动为 `<img>` 标签添加 width 和 height 属性

**配置选项**:
```javascript
[rehypeImgSize, {
  size: 'real',     // 'real' | 'normal'
  dir: './public',  // 图片目录
}]
```

**示例**:
```markdown
![图片](/image.png)
```

**输出**:
```html
<img src="/image.png" alt="图片" width="800" height="600">
```

**必要性**: ⭐⭐⭐ (推荐用于图片优化)

**性能影响**: 中（需要读取图片文件）

---

#### 7. rehype-code-titles

**全名**: Add Titles to Code Blocks

**功能**: 为代码块添加标题（文件名）

**示例**:
```markdown
```javascript filename="app.js"
console.log('Hello');
```
```

**输出**:
```html
<div class="code-block">
  <div class="code-title">app.js</div>
  <pre><code>console.log('Hello');</code></pre>
</div>
```

**需要自定义样式**:
```css
.code-block {
  border-radius: 8px;
  overflow: hidden;
}

.code-title {
  background: #2d2d2d;
  color: #fff;
  padding: 8px 16px;
  font-size: 14px;
}
```

**必要性**: ⭐⭐ (需要显示文件名时推荐)

**性能影响**: 低

---

#### 8. rehype-pretty-code

**全名**: Pretty Code Blocks

**功能**: 美化代码块（替代 Shiki）

**特性**:
- 语法高亮
- 行号
- 高亮特定行
- 显示文件名
- 复制按钮

**配置选项**:
```javascript
[rehypePrettyCode, {
  theme: 'github-dark',
  onVisitLine(node) {
    // 自定义行处理
  },
  onVisitHighlightedLine(node) {
    // 高亮行处理
  },
  onVisitHighlightedChars(node) {
    // 高亮字符处理
  },
}]
```

**示例**:
```markdown
```js {2,4} filename="example.js" showLineNumbers
const a = 1;
const b = 2; // 高亮
const c = 3;
const d = 4; // 高亮
```
```

**必要性**: ⭐⭐⭐ (喜欢这个功能时推荐)

**性能影响**: 中

---

#### 9. rehype-wrap-all

**全名**: Wrap All Elements

**功能**: 将特定元素包裹在容器中

**配置选项**:
```javascript
[rehypeWrapAll, {
  'table': { properties: { className: ['table-container'] } },
  'pre': { properties: { className: ['code-container'] } },
}]
```

**示例**:
```markdown
| 表头 | 数据 |
|------|------|
| 内容 | 内容 |
```

**输出**:
```html
<div class="table-container">
  <table>...</table>
</div>
```

**必要性**: ⭐⭐ (需要添加容器时推荐)

**性能影响**: 低

---

#### 10. rehype-urls

**全名**: Transform URLs

**功能**: 转换 URL

**配置选项**:
```javascript
[rehypeUrls, (url, node) => {
  if (url.startsWith('/images/')) {
    return `https://cdn.example.com${url}`;
  }
  return url;
}]
```

**必要性**: ⭐⭐ (需要转换 URL 时推荐)

**性能影响**: 低

---

## 插件组合推荐

### 最小配置（基础博客）

```javascript
integrations: [
  mdx({
    remarkPlugins: [
      remarkGfm,
    ],
    rehypePlugins: [
      rehypeSlug,
      [rehypeAutolinkHeadings, { behavior: 'append' }],
    ],
  }),
],
```

**适用场景**: 简单博客，只需要基础功能

**功能**: ✅ GFM ✅ 标题链接

---

### 推荐配置（标准博客）

```javascript
integrations: [
  mdx({
    remarkPlugins: [
      remarkGfm,
      [remarkToc, { heading: '目录', maxDepth: 3 }],
    ],
    rehypePlugins: [
      rehypeSlug,
      [rehypeAutolinkHeadings, { behavior: 'append' }],
      rehypeExternalLinks,
      rehypePresetMinify,
    ],
  }),
],
```

**适用场景**: 标准博客，需要完整功能

**功能**: ✅ GFM ✅ 目录 ✅ 标题链接 ✅ 外部链接 ✅ HTML 压缩

---

### 技术博客配置

```javascript
integrations: [
  mdx({
    remarkPlugins: [
      remarkGfm,
      remarkMath,
      [remarkToc, { heading: '目录', maxDepth: 3 }],
    ],
    rehypePlugins: [
      rehypeSlug,
      [rehypeAutolinkHeadings, { behavior: 'append' }],
      rehypeExternalLinks,
      rehypeKatex,
      rehypePresetMinify,
    ],
  }),
],
```

**适用场景**: 技术博客，需要数学公式

**功能**: ✅ GFM ✅ 数学公式 ✅ 目录 ✅ 标题链接 ✅ 外部链接 ✅ HTML 压缩

---

### GitHub 风格配置

```javascript
integrations: [
  mdx({
    remarkPlugins: [
      remarkGfm,
      remarkCallout,
      [remarkToc, { heading: '目录', maxDepth: 3 }],
      remarkEmoji,
    ],
    rehypePlugins: [
      rehypeSlug,
      [rehypeAutolinkHeadings, { behavior: 'append' }],
      rehypeExternalLinks,
      rehypePresetMinify,
    ],
  }),
],
```

**适用场景**: 喜欢 GitHub 文档风格

**功能**: ✅ GFM ✅ Callouts ✅ Emoji ✅ 目录 ✅ 标题链接 ✅ 外部链接 ✅ HTML 压缩

---

### 完整配置（功能全面）

```javascript
integrations: [
  mdx({
    remarkPlugins: [
      remarkGfm,
      remarkMath,
      remarkCallout,
      [remarkToc, { heading: '目录', maxDepth: 3 }],
      remarkEmoji,
      remarkSmartypants,
    ],
    rehypePlugins: [
      rehypeSlug,
      [rehypeAutolinkHeadings, { behavior: 'append' }],
      rehypeExternalLinks,
      rehypeKatex,
      rehypeImgSize,
      rehypePresetMinify,
    ],
  }),
],
```

**适用场景**: 功能需求丰富的博客

**功能**: ✅ 所有上述功能

---

## 插件依赖关系

```
remark-math 必须配合 rehype-katex 使用
remark-toc 建议 rehype-slug 配合使用
rehype-autolink-headings 必须有 rehype-slug
```

## 性能优化建议

1. **生产环境使用 rehype-preset-minify**
2. **避免使用过多的自定义插件**
3. **缓存 Shiki 语法高亮结果**
4. **按需加载 Katex 样式**
5. **使用 CDN 加载 KaTeX 和 Mermaid**

## 常见问题

### Q1: rehype-katex 渲染失败

**原因**: 可能是 KaTeX CSS 未导入

**解决**:
```astro
---
import 'katex/dist/katex.min.css';
---
```

### Q2: rehype-img-size 报错

**原因**: 图片路径不正确或文件不存在

**解决**: 确保 `dir` 配置正确

### Q3: remark-toc 目录不显示

**原因**: 文章中没有符合 maxDepth 的标题

**解决**: 调整 maxDepth 或检查文章结构

### Q4: 代码高亮不生效

**原因**: Shiki 配置问题或语言不支持

**解决**: 检查 `shikiConfig.langs` 配置

## 参考资源

- [Remark 插件列表](https://github.com/remarkjs/remark/blob/main/doc/plugins.md)
- [Rehype 插件列表](https://github.com/rehypejs/rehype/blob/main/doc/plugins.md)
- [Unified 生态系统](https://unifiedjs.com/)

---

**文档版本**：1.0
**创建日期**：2026-03-14
