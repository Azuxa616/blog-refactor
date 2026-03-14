# 文章管理系统快速实施指南

> 本指南基于方案一（轻量级方案）的实施步骤，适用于快速修复当前文章管理系统。

## 前置要求

- 已完成 `git checkout -b fix-content-system`
- 当前项目可以正常构建 (`pnpm build` 成功)

## 实施步骤

### 步骤 1：安装依赖

```bash
pnpm add @astrojs/mdx
pnpm add -D rehype-slug rehype-autolink-headings rehype-preset-minify remark-toc remark-gfm
```

### 步骤 2：更新 astro.config.mjs

读取并修改 `astro.config.mjs` 文件：

```javascript
// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import node from '@astrojs/node';
import alpinejs from '@astrojs/alpinejs';
import mdx from '@astrojs/mdx';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import rehypePresetMinify from 'rehype-preset-minify';
import remarkToc from 'remark-toc';
import remarkGfm from 'remark-gfm';

export default defineConfig({
  output: 'server',
  adapter: node({
    mode: 'standalone'
  }),
  integrations: [
    alpinejs(),
    mdx({
      // 代码高亮配置
      syntaxHighlight: 'shiki',
      shikiConfig: {
        theme: 'github-dark',
        langs: [
          'javascript',
          'typescript',
          'tsx',
          'jsx',
          'python',
          'bash',
          'css',
          'html',
          'json',
          'markdown',
        ],
      },
      // remark 插件配置
      remarkPlugins: [
        remarkGfm,  // GitHub Flavored Markdown 支持
        [remarkToc, {
          heading: '目录',  // 目录标题
          maxDepth: 3,      // 最大深度
          tight: true,      // 紧凑模式
        }],
      ],
      // rehype 插件配置
      rehypePlugins: [
        rehypeSlug,  // 为标题添加 id
        [rehypeAutolinkHeadings, {
          behavior: 'append',  // 在标题后添加链接
          properties: {
            className: ['anchor-link'],
            ariaLabel: '跳转到此章节',
          },
        }],
        rehypePresetMinify,  // 压缩 HTML
      ],
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
    server: {
      middlewareMode: false
    }
  }
});
```

### 步骤 3：更新 content.config.ts

修改 `src/content.config.ts`，支持 `.mdx` 文件：

```typescript
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// 文章集合
const posts = defineCollection({
  // 修改：同时支持 .md 和 .mdx 文件
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/posts' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    publishDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    category: z.string(),
    tags: z.array(z.string()).default([]),
    coverImage: z.string().optional(),
    isRepost: z.boolean().default(false),
    originalAuthor: z.string().optional(),
    originalLink: z.string().optional(),
  }),
});

// 分类集合
const categories = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/categories' }),
  schema: z.object({
    name: z.string(),
    slug: z.string(),
    description: z.string().optional(),
    color: z.string(),
  }),
});

export const collections = { posts, categories };
```

### 步骤 4：添加样式支持

在 `src/styles/global.css` 中添加样式：

```css
/* 目录样式 */
.toc {
  background: var(--card-background);
  border: 1px solid var(--border-color);
  border-radius: 0.5rem;
  padding: 1rem;
  margin-bottom: 2rem;
}

.toc h2 {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 1rem;
  color: var(--foreground);
}

.toc ul {
  list-style: none;
  padding-left: 0;
  margin: 0;
}

.toc ul li {
  margin-bottom: 0.5rem;
}

.toc a {
  color: var(--muted);
  text-decoration: none;
  transition: color 0.2s;
}

.toc a:hover {
  color: var(--primary);
}

/* 锚点链接样式 */
.anchor-link {
  opacity: 0;
  margin-left: 0.5rem;
  color: var(--muted);
  text-decoration: none;
  transition: opacity 0.2s, color 0.2s;
}

.anchor-link:hover {
  color: var(--primary);
}

h1:hover .anchor-link,
h2:hover .anchor-link,
h3:hover .anchor-link,
h4:hover .anchor-link,
h5:hover .anchor-link,
h6:hover .anchor-link {
  opacity: 1;
}

/* GitHub Flavored Markdown 表格样式 */
table {
  width: 100%;
  border-collapse: collapse;
  margin: 1.5rem 0;
  overflow: hidden;
}

table th,
table td {
  padding: 0.75rem 1rem;
  border: 1px solid var(--border-color);
  text-align: left;
}

table th {
  background: var(--muted);
  font-weight: 600;
}

table tr:nth-child(even) {
  background: var(--card-background);
}

/* 任务列表样式 */
input[type='checkbox'] {
  margin-right: 0.5rem;
}

/* 删除线样式 */
del {
  text-decoration: line-through;
  color: var(--muted);
}
```

### 步骤 5：更新文章详情页（可选）

如果需要显示目录，修改 `src/pages/articles/[id].astro`：

```astro
---
import { getCollection } from 'astro:content';
import Layout from '../../layouts/Layout.astro';

const { id } = Astro.params;
const posts = await getCollection('posts');
const post = posts.find(p => p.id === `${id}.md` || p.id === `${id}.mdx`);

if (!post) {
  return Astro.redirect('/404');
}

const { Content, headings } = post.rendered ?? {} as any;

// 生成目录（过滤掉 h1，保留 h2-h3）
const tocHeadings = headings?.filter((h: any) => h.depth >= 2 && h.depth <= 3) || [];
---

<Layout title={post.data.title}>
  <article class="min-h-screen bg-background">
    <!-- 文章头部 -->
    <header class="relative h-64 overflow-hidden">
      <div class="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600"></div>
      <div class="absolute inset-0 bg-black/30"></div>
      <div class="relative z-10 h-full flex items-center justify-center">
        <div class="text-center px-4">
          {post.data.coverImage && (
            <img
              src={post.data.coverImage}
              alt={post.data.title}
              class="w-32 h-32 object-cover rounded-full border-4 border-white/20 mb-6 mx-auto shadow-2xl"
            />
          )}
          <h1 class="text-4xl md:text-5xl font-bold text-white mb-4">
            {post.data.title}
          </h1>
          <div class="flex items-center justify-center gap-4 text-white/90">
            <span class="text-sm">
              {post.data.publishDate.toLocaleDateString('zh-CN')}
            </span>
            {post.data.updatedDate && (
              <span class="text-sm">
                · 更新于 {post.data.updatedDate.toLocaleDateString('zh-CN')}
              </span>
            )}
          </div>
        </div>
      </div>
    </header>

    <!-- 文章内容 -->
    <div class="max-w-4xl mx-auto px-4 py-12">
      <div class="flex gap-8">
        <!-- 左侧：文章内容 -->
        <div class="flex-1">
          <div class="prose prose-lg dark:prose-invert max-w-none">
            <Content />
          </div>

          <!-- 文章元数据 -->
          {post.data.tags && post.data.tags.length > 0 && (
            <div class="mt-8 pt-8 border-t">
              <h3 class="text-lg font-semibold mb-3">标签</h3>
              <div class="flex flex-wrap gap-2">
                {post.data.tags.map(tag => (
                  <span class="px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-sm">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* 转载信息 */}
          {post.data.isRepost && (
            <div class="mt-8 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <p class="text-sm text-yellow-800 dark:text-yellow-200">
                <strong>转载声明：</strong> 本文转载自 {post.data.originalAuthor || '原作者'}
                {post.data.originalLink && (
                  <a href={post.data.originalLink} target="_blank" rel="noopener noreferrer" class="ml-2 hover:underline">
                    查看原文
                  </a>
                )}
              </p>
            </div>
          )}
        </div>

        <!-- 右侧：目录（如果有） -->
        {tocHeadings.length > 0 && (
          <aside class="hidden lg:block w-64 flex-shrink-0">
            <div class="sticky top-24">
              <div class="toc">
                <h2>目录</h2>
                <ul>
                  {tocHeadings.map((heading: any) => (
                    <li>
                      <a
                        href={`#${heading.slug}`}
                        class={heading.depth === 3 ? 'pl-4' : ''}
                      >
                        {heading.text}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </aside>
        )}
      </div>
    </div>
  </article>
</Layout>
```

### 步骤 6：创建示例 MDX 文章

创建 `src/content/posts/mdx-example.mdx`：

```mdx
---
title: "MDX 示例文章"
description: "展示 MDX 的各种功能"
publishDate: 2026-03-14
category: tech
tags: ["MDX", "Astro"]
---

# MDX 功能演示

这是一篇使用 MDX 的示例文章，展示各种功能。

## 基础功能

### 文本样式

- **粗体**
- *斜体*
- ~~删除线~~
- `行内代码`

### 列表

#### 无序列表

- 项目一
- 项目二
  - 子项目一
  - 子项目二

#### 有序列表

1. 第一项
2. 第二项
3. 第三项

### 任务列表

- [x] 已完成的任务
- [ ] 未完成的任务

### 表格

| 功能 | Markdown | MDX |
|------|----------|-----|
| 纯文本 | ✅ | ✅ |
| 组件 | ❌ | ✅ |
| 交互 | ❌ | ✅ |

## 代码块

### JavaScript

```javascript
function hello() {
  console.log('Hello, MDX!');
}
```

### TypeScript

```typescript
interface Post {
  title: string;
  content: string;
}

const post: Post = {
  title: 'MDX 示例',
  content: '这是一篇示例文章',
};
```

## 引用

> 这是一个引用块。
> 可以有多行内容。

## 分隔线

---

## 链接

[访问 Astro 文档](https://docs.astro.build)

## 自动生成目录

这篇文章会自动生成目录，包含所有 h2 和 h3 标题。

## 总结

MDX 让你可以在 Markdown 中使用 JSX 组件，提供更强大的内容创作能力。
```

### 步骤 7：测试验证

```bash
# 启动开发服务器
pnpm dev

# 访问以下页面进行测试
# 1. 首页
http://localhost:4321

# 2. 文章列表页
http://localhost:4321/articles

# 3. 文章详情页（测试现有的 Markdown 文章）
http://localhost:4321/articles/hello-world

# 4. 文章详情页（测试新的 MDX 示例文章）
http://localhost:4321/articles/mdx-example
```

### 步骤 8：验证清单

- [ ] 开发服务器正常启动
- [ ] 现有 Markdown 文章正常渲染
- [ ] 新的 MDX 示例文章正常渲染
- [ ] 代码高亮正常显示
- [ ] 表格样式正确
- [ ] 任务列表正常显示
- [ ] 删除线正常显示
- [ ] 目录自动生成（如果实现了）
- [ ] 标题有锚点链接
- [ ] 点击锚点链接能正确跳转

### 步骤 9：构建测试

```bash
# 生产构建
pnpm build

# 预览构建结果
pnpm preview
```

### 步骤 10：提交代码

```bash
git add .
git commit -m "feat: 添加 MDX 支持和 remark/rehype 插件

- 安装 @astrojs/mdx 集成
- 添加 remark 插件：GFM、TOC
- 添加 rehype 插件：slug、autolink-headings、minify
- 配置 Shiki 代码高亮
- 更新 content.config.ts 支持 .mdx 文件
- 添加相关样式
- 创建 MDX 示例文章"
```

## 常见问题

### Q1: 构建时报错 "Cannot find module 'xxx'"

**原因**: 依赖未正确安装

**解决**:
```bash
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

### Q2: MDX 文件中的组件无法渲染

**原因**: MDX 组件需要正确导入

**解决**: 确保在文章开头正确导入组件

### Q3: 代码高亮不生效

**原因**: Shiki 配置问题

**解决**: 检查 `shikiConfig` 中的 `langs` 是否包含你使用的语言

### Q4: 目录不显示

**原因**: 文章标题层级不匹配

**解决**: 确保文章中有 h2 或 h3 标题

### Q5: 样式异常

**原因**: CSS 未正确加载

**解决**: 确保 `src/styles/global.css` 在 `Layout.astro` 中正确导入

## 下一步

实施完成后，可以考虑以下增强功能：

1. **添加阅读时间估算**
2. **添加字数统计**
3. **添加分享按钮**
4. **添加评论功能**
5. **添加相关文章推荐**

## 回滚方案

如果实施过程中遇到问题，可以回滚：

```bash
git checkout backup-before-content-fix
```

---

**文档版本**：1.0
**创建日期**：2026-03-14
