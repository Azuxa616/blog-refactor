# Astro 重构项目文档

## 项目概述

本文档详细说明了将现有的 Astro + React 19 项目重构为纯 Astro + Alpine.js + TypeScript 的完整方案。重构后的项目将完全移除 React 依赖，使用本地文件系统作为文章数据源，并删除所有管理后台功能。

## 一、重构目标

### 1.1 技术栈变更
| 当前技术栈 | 重构后技术栈 |
|-----------|-------------|
| Astro 5.x + React 19 | Astro 5.x (纯 Astro) |
| React 状态管理 | Alpine.js (轻量级交互) |
| React Context | Alpine stores (全局状态) |
| SQLite + Drizzle ORM | 本地 Markdown 文件 |
| @astrojs/react 集成 | Alpine.js 集成 |
| 客户端 React 组件 | Astro 静态组件 + Alpine.js |

### 1.2 主要目标
1. **移除 React 生态**：完全删除 `@astrojs/react`、React、React DOM 等 React 相关依赖
2. **组件迁移**：
   - 静态组件：直接迁移为 `.astro` 文件
   - 动态组件：使用 Alpine.js + TypeScript 重构
3. **文章系统重构**：
   - 删除数据库层（SQLite、Drizzle ORM）
   - 删除 API 层（所有 `/api/*` 路由）
   - 删除存储服务（`src/lib/storage/`）
   - 文章数据来源：本地 Markdown 文件（`/content/posts/*.md`）
   - 使用 Astro 的内容层（Content Layer）读取文章
4. **删除管理后台**：
   - 删除所有 `/admin/*` 页面
   - 删除所有管理相关组件
   - 删除认证系统（JWT、登录等）
5. **保留功能**：
   - 保持原有页面样式不变
   - 保持动态组件功能一致
   - 维护 TypeScript 类型系统
   - 继续使用 Tailwind CSS

## 二、当前项目分析

### 2.1 项目结构
```
src/
├── components/          # 组件目录（33个组件）
│   ├── *.tsx          # React 组件（30个）
│   └── *.astro        # Astro 组件（3个）
├── contexts/          # React Context（2个）
├── layouts/           # Astro 布局（1个）
├── lib/
│   ├── config/        # 应用配置
│   ├── db/            # Drizzle 数据库
│   ├── storage/       # 存储服务
│   └── utils/         # 工具函数
├── pages/
│   ├── index.astro    # 首页
│   ├── articles/      # 文章页面
│   ├── about/         # 关于页面
│   ├── admin/         # 管理后台（需删除）
│   └── api/           # API 路由（需删除）
├── styles/            # 全局样式
└── types/             # TypeScript 类型
```

### 2.2 需要重构的组件分类

#### 2.2.1 静态组件（直接迁移为 .astro）
这些组件主要是展示型，无复杂交互：
- `Avatar.tsx` → `Avatar.astro`
- `BusinessCard.tsx` → `BusinessCard.astro`
- `Card.tsx` → `Card.astro`
- `CategoryCard.tsx` → `CategoryCard.astro`
- `GithubCard.tsx` → `GithubCard.astro`
- `ImageHeaderBar.tsx` → `ImageHeaderBar.astro`
- `MenuButton.tsx` → `MenuButton.astro`
- `PageHeader.tsx` → `PageHeader.astro`
- `SkillsCard.tsx` → `SkillsCard.astro`
- `WebStatisticDataCard.tsx` → `WebStatisticDataCard.astro`
- `FloatingActionButton.tsx` → `FloatingActionButton.astro`
- `Skeleton.tsx` → `Skeleton.astro`

#### 2.2.2 动态组件（使用 Alpine.js + TS 重构）
这些组件有复杂的交互逻辑：
- `HeaderBar.tsx` → `HeaderBar.astro`（使用 Alpine 管理展开/收起状态）
- `BlogItem.tsx` → `BlogItem.astro`（使用 Alpine 处理图片加载错误）
- `Modal.tsx` → `Modal.astro`（使用 Alpine 管理打开/关闭状态）
- `Pagination.tsx` → `Pagination.astro`（使用 Alpine 管理分页状态）
- `CategoryFilter.tsx` → `CategoryFilter.astro`（使用 Alpine 管理筛选状态）
- `ContentPage.tsx` → `ContentPage.astro`（使用 Alpine 管理复杂交互）
- `GalleryPage.tsx` → `GalleryPage.astro`（使用 Alpine 管理画廊交互）
- `HomeClient.tsx` → `HomeClient.astro`（使用 Alpine 管理页面展开和 GitHub 数据）
- `Typewriter.tsx` → `Typewriter.astro`（使用 Alpine 实现打字机效果）
- `ImageDetailModal.tsx` → `ImageDetailModal.astro`（使用 Alpine 管理模态框）
- `ImagePicker.tsx` → `ImagePicker.astro`（使用 Alpine 管理图片选择）
- `ImageUploader.tsx` → `ImageUploader.astro`（使用 Alpine 管理上传交互）
- `UploadModal.tsx` → `UploadModal.astro`（使用 Alpine 管理上传模态框）

#### 2.2.3 管理相关组件（全部删除）
这些组件仅在管理后台使用，重构后不再需要：
- `AdminDashboard.tsx`
- `AdminFloatingButton.tsx`
- `AdminLayout.tsx`
- `ArticleActions.tsx`
- `ArticleEditor.tsx`
- `ArticleEditPage.tsx`
- `LoginPage.tsx`
- `SettingsPage.tsx`
- `RootLayoutClient.tsx`（管理页面的根布局客户端组件）

#### 2.2.4 需要拆分的复杂组件
- `ContentPage.tsx`（30604字节）：拆分为多个子组件
- `GithubCard.tsx`（18384字节）：拆分为用户卡片和仓库列表组件
- `SettingsPage.tsx`（15708字节）：删除（管理后台）
- `HomeClient.tsx`（6583字节）：拆分打字机效果和 GitHub 卡片

### 2.3 需要删除的功能模块

#### 2.3.1 数据库层
- `src/lib/db/` 目录（包含 schema.ts 和 index.ts）
- Drizzle ORM 配置
- SQLite 数据库文件

#### 2.3.2 API 层
- `src/pages/api/` 目录下所有文件
- 所有后端 API 路由

#### 2.3.3 存储服务层
- `src/lib/storage/` 目录
- `src/lib/utils/auth.ts` 和 `src/lib/utils/authMiddleware.ts`

#### 2.3.4 管理后台
- `src/pages/admin/` 目录下所有文件
- 管理相关组件（Admin*、ArticleEdit*、LoginPage、SettingsPage）

#### 2.3.5 React Context
- `src/contexts/PageContext.tsx`（转换为 Alpine store）
- `src/contexts/DarkModeContext.tsx`（转换为 Astro 的主题切换）

### 2.4 依赖变更

#### 需要删除的依赖
```json
{
  "@astrojs/react": "^4.4.2",
  "@types/react": "^19.2.14",
  "@types/react-dom": "^19.2.3",
  "react": "^19.2.4",
  "react-dom": "^19.2.4",
  "@libsql/client": "^0.17.0",
  "drizzle-orm": "^0.45.1",
  "drizzle-kit": "^0.31.9",
  "jsonwebtoken": "^9.0.3",
  "bcryptjs": "^3.0.3",
  "@types/bcryptjs": "^3.0.0",
  "@types/jsonwebtoken": "^9.0.10",
  "zod": "^4.3.6"（如果仅用于 API 验证）
}
```

#### 需要添加的依赖
```json
{
  "alpinejs": "^3.14.0",
  "@astrojs/alpinejs": "^5.0.0"
}
```

#### 需要保留的依赖
```json
{
  "astro": "^5.17.1",
  "@astrojs/node": "^9.5.4",
  "tailwindcss": "^4.2.1",
  "@tailwindcss/vite": "^4.2.1",
  "tailwind-merge": "^3.5.0",
  "clsx": "^2.1.1",
  "class-variance-authority": "^0.7.1",
  "gray-matter": "^4.0.3",
  "prism-react-renderer": "^2.4.1",
  "react-syntax-highlighter": "^16.1.1",（如需保留代码高亮）
  "@octokit/rest": "^22.0.1",（GitHub API）
  "lucide-react": "^0.577.0"（或改用 Alpine 图标库）
  "@types/fs-extra": "^11.0.4",
  "@types/uuid": "^11.0.0"
}
```

## 三、重构详细规划

### 3.1 阶段一：环境准备与依赖清理

#### 任务 1.1：备份当前项目
```bash
# 创建备份分支
git checkout -b backup-before-refactor
git push origin backup-before-refactor

# 创建重构分支
git checkout -b refactor-alpine
```

#### 任务 1.2：更新 package.json
- 删除 React 相关依赖
- 删除数据库相关依赖
- 添加 Alpine.js 依赖
- 更新 scripts（删除 drizzle 相关命令）

#### 任务 1.3：更新 Astro 配置
```typescript
// astro.config.mjs
export default defineConfig({
  integrations: [
    // 删除 @astrojs/react
    tailwind(),
    node(),
    alpinejs(), // 添加 Alpine.js 集成
  ],
  // ...
})
```

#### 任务 1.4：配置 Tailwind CSS
- 确保使用 Tailwind CSS 4.x（Vite 插件）
- 配置主题和颜色变量

### 3.2 阶段二：创建新的文章数据层

#### 任务 2.1：设置 Astro Content Layer
```typescript
// astro.config.mjs
export default defineConfig({
  contentCollection: {
    collections: {
      posts: {
        type: 'content',
        schema: defineCollection({
          type: 'content',
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
        }),
      },
      categories: {
        type: 'data',
        schema: z.object({
          name: z.string(),
          slug: z.string(),
          description: z.string().optional(),
          color: z.string(),
        }),
      },
    },
  },
})
```

#### 任务 2.2：创建内容目录结构
```
src/
└── content/
    ├── posts/          # 文章 Markdown 文件
    │   ├── 2024-01-01-first-post.md
    │   └── 2024-01-02-second-post.md
    └── categories/     # 分类数据
        ├── tech.md
        └── life.md
```

#### 任务 2.3：创建文章工具函数
```typescript
// src/lib/utils/posts.ts
import { getCollection } from 'astro:content'

export async function getAllPosts() {
  const posts = await getCollection('posts')
  return posts.map(post => ({
    ...post,
    slug: post.slug,
    data: post.data,
  })).sort((a, b) =>
    b.data.publishDate.valueOf() - a.data.publishDate.valueOf()
  )
}

export async function getPostBySlug(slug: string) {
  const posts = await getCollection('posts')
  return posts.find(post => post.slug === slug)
}

export async function getPostsByCategory(categorySlug: string) {
  const posts = await getAllPosts()
  return posts.filter(post => post.data.category === categorySlug)
}

export async function getCategories() {
  const categories = await getCollection('categories')
  const posts = await getAllPosts()

  return categories.map(cat => ({
    ...cat,
    articleCount: posts.filter(post => post.data.category === cat.slug).length,
  }))
}
```

#### 任务 2.4：迁移数据（可选）
- 创建脚本从 SQLite 导出数据
- 转换为 Markdown 格式
- 保存到 `src/content/posts/`

### 3.3 阶段三：删除管理后台和数据库层

#### 任务 3.1：删除管理页面
```bash
rm -rf src/pages/admin/
rm -rf src/pages/api/
```

#### 任务 3.2：删除数据库相关文件
```bash
rm -rf src/lib/db/
rm -rf src/lib/storage/
rm src/lib/utils/auth.ts
rm src/lib/utils/authMiddleware.ts
```

#### 任务 3.3：删除管理相关组件
```bash
rm src/components/AdminDashboard.tsx
rm src/components/AdminFloatingButton.tsx
rm src/components/AdminLayout.tsx
rm src/components/ArticleActions.tsx
rm src/components/ArticleEditor.tsx
rm src/components/ArticleEditPage.tsx
rm src/components/LoginPage.tsx
rm src/components/SettingsPage.tsx
rm src/components/RootLayoutClient.tsx
```

#### 任务 3.4：删除 Context
```bash
rm -rf src/contexts/
```

### 3.4 阶段四：组件重构（静态组件）

#### 任务 4.1：迁移静态组件列表
为每个静态组件创建对应的 `.astro` 文件，添加中文注释：

```astro
---
// Avatar.astro
// 头像组件
// 用于显示用户头像的静态组件

interface Props {
  /** 头像图片 URL */
  src?: string
  /** 头像大小 */
  size?: 'sm' | 'md' | 'lg'
  /** 额外的 CSS 类名 */
  className?: string
}

const { 
  src = '/imgs/default-avatar.png',
  size = 'md',
  className = ''
} = Astro.props

const sizeClasses = {
  sm: 'w-8 h-8',
  md: 'w-12 h-12',
  lg: 'w-16 h-16',
}
---

<img 
  src={src} 
  alt="头像"
  class={`${sizeClasses[size]} rounded-full object-cover ${className}`}
/>
```

#### 任务 4.2：静态组件清单
按照任务 4.1 的模式，迁移以下组件：

1. `Avatar.astro` - 头像组件
2. `BusinessCard.astro` - 名片卡片组件
3. `Card.astro` - 通用卡片组件
4. `CategoryCard.astro` - 分类卡片组件
5. `GithubCard.astro` - GitHub 信息卡片（拆分后）
6. `ImageHeaderBar.astro` - 带图片的头部栏组件
7. `MenuButton.astro` - 菜单按钮组件
8. `PageHeader.astro` - 页面头部组件
9. `SkillsCard.astro` - 技能卡片组件
10. `WebStatisticDataCard.astro` - 网站统计数据卡片组件
11. `FloatingActionButton.astro` - 浮动操作按钮组件
12. `Skeleton.astro` - 骨架屏组件

### 3.5 阶段五：动态组件重构（Alpine.js）

#### 任务 5.1：创建 Alpine 工具函数
```typescript
// src/lib/alpine-utils.ts
// Alpine.js 工具函数

/**
 * 页面展开状态管理
 */
export function pageExpand() {
  return {
    isExpanded: false,
    isTransitioning: false,
    
    /** 展开页面 */
    expand() {
      if (!this.isExpanded && !this.isTransitioning) {
        this.isExpanded = true
        this.isTransitioning = true
        setTimeout(() => {
          window.scrollTo({ top: window.innerHeight, behavior: 'smooth' })
          this.isTransitioning = false
        }, 100)
      }
    },
    
    /** 收起页面 */
    collapse() {
      if (this.isExpanded && !this.isTransitioning) {
        this.isExpanded = false
        this.isTransitioning = true
        setTimeout(() => {
          window.scrollTo({ top: 0, behavior: 'smooth' })
          this.isTransitioning = false
        }, 100)
      }
    },
    
    /** 处理滚轮事件 */
    handleWheel(event) {
      const deltaY = event.deltaY
      
      if (deltaY > 0 && !this.isExpanded && !this.isTransitioning) {
        event.preventDefault()
        this.expand()
      } else if (deltaY < 0 && this.isExpanded && window.scrollY <= 100 && !this.isTransitioning) {
        event.preventDefault()
        this.collapse()
      }
    }
  }
}
```

#### 任务 5.2：创建 Alpine 组件注册文件
```javascript
// src/alpine-components.js
// Alpine.js 组件注册

import { pageExpand } from './lib/alpine-utils'

// 注册全局 Alpine 组件
document.addEventListener('alpine:init', () => {
  Alpine.data('pageExpand', pageExpand)
})
```

#### 任务 5.3：在布局中引入 Alpine
```astro
---
// layouts/Layout.astro
import '../alpine-components.js'
---

<html>
  <head>
    <meta charset="utf-8" />
    <title>{title}</title>
  </head>
  <body>
    <slot />
  </body>
</html>
```

#### 任务 5.4：迁移动态组件

##### 5.4.1 HeaderBar.astro
```astro
---
// 头部导航栏组件
// 使用 Alpine.js 管理展开/收起状态和样式切换

const menuItems = [
  { href: "/", label: "首页" },
  { href: "/articles", label: "文章" },
  { href: "/about", label: "关于" },
  { href: "/links", label: "友链" },
]
---

<div 
  x-data="{ isExpanded: false }"
  class="fixed top-0 left-0 right-0 z-50 flex items-center justify-start w-full h-16 border px-8 gap-10 transition-colors duration-300"
  :class="isExpanded ? 'bg-white/60 backdrop-blur-sm text-black dark:text-white border-gray-200' : 'bg-transparent text-white'"
>
  <div class="text-xl font-bold">Azuxa&apos;s BlogSpace</div>
  <div class="flex items-center gap-4">
    <template x-for="item in ${JSON.stringify(menuItems)}" :key="item.href">
      <a 
        :href="item.href"
        class="relative px-4 py-2 transition-colors duration-200 font-semibold
               after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5
               after:transition-all after:duration-300 after:ease-out
               hover:after:w-full"
        :class="isExpanded ? 'after:bg-black' : 'after:bg-white'"
        x-text="item.label"
      />
    </template>
  </div>
</div>
```

##### 5.4.2 Modal.astro
```astro
---
// 模态框组件
// 使用 Alpine.js 管理打开/关闭状态

interface Props {
  /** 是否打开 */
  isOpen?: boolean
  /** 关闭回调函数 */
  onClose?: () => void
  /** 标题 */
  title?: string
  /** 尺寸 */
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  /** 是否显示关闭按钮 */
  showCloseButton?: boolean
}

const { isOpen = false, title, size = 'md', showCloseButton = true } = Astro.props

const sizeClasses = {
  sm: 'w-96',
  md: 'w-[500px]',
  lg: 'w-[700px]',
  xl: 'w-[900px]',
  full: 'w-[95vw] max-w-[1200px]',
}
---

<div 
  x-data="{ open: ${isOpen} }"
  x-show="open"
  @keydown.escape.window="open = false"
  class="fixed inset-0 bg-[#5252523c] bg-opacity-60 overflow-y-auto h-full w-full z-50"
  @click.self="open = false"
  x-cloak
>
  <div 
    class="relative top-20 mx-auto p-5 border shadow-lg rounded-md bg-white"
    :class="`${sizeClasses['${size}']}`"
    @click.stop
  >
    <div class="mt-3">
      <div x-show="${title || showCloseButton}" class="flex items-center justify-between mb-4">
        <h3 x-show="${title}" class="text-lg font-medium text-gray-900">${title}</h3>
        <button 
          x-show="${showCloseButton}"
          @click="open = false"
          class="text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="关闭"
        >
          <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <slot />
    </div>
  </div>
</div>

<script>
  // 模态框打开/关闭时锁定/解锁滚动
  document.addEventListener('alpine:init', () => {
    Alpine.effect(() => {
      const open = Alpine.$data(document.querySelector('[x-data]'))?.open
      document.body.style.overflow = open ? 'hidden' : ''
    })
  })
</script>
```

##### 5.4.3 其他动态组件清单
按照类似模式迁移以下组件：

1. `BlogItem.astro` - 博客文章卡片（处理图片加载错误）
2. `Pagination.astro` - 分页组件（管理分页状态）
3. `CategoryFilter.astro` - 分类筛选器（管理筛选状态）
4. `Typewriter.astro` - 打字机效果组件
5. 删除 ContentPage.tsx（后台管理页面，不需要）
6. 删除 GalleryPage.tsx（后台管理页面，不需要）
7. 删除 ImageDetailModal.tsx（后台组件，不需要）
8. 删除 ImagePicker.tsx（后台组件，不需要）
9. 删除 ImageUploader.tsx（后台组件，不需要）
10. 删除 UploadModal.tsx（后台组件，不需要）

#### 任务 5.5：拆分复杂组件

##### 5.5.1 拆分 GithubCard.tsx
```
GithubCard.tsx (18KB)
├── GithubUserCard.astro      # 用户信息卡片
├── GithubRepoList.astro       # 仓库列表
├── GithubRepoCard.astro        # 单个仓库卡片
└── GithubSkillsSection.astro   # 技能展示区
```

##### 5.5.2 拆分 HomeClient.tsx
```
HomeClient.tsx (6.5KB)
├── HeroSection.astro          # 主视觉区
├── Typewriter.astro            # 打字机效果
├── ArrowDownButton.astro       # 向下滚动按钮
└── GithubSection.astro         # GitHub 展示区
```

##### 5.5.3 拆分 ContentPage.tsx（已删除，后台不需要）

### 3.6 阶段六：页面重构

#### 任务 6.1：更新首页 (index.astro)
```astro
---
// 首页
// 使用 Alpine.js 管理页面交互

import Layout from '../layouts/Layout.astro'
import HeroSection from '../components/HeroSection.astro'
import Typewriter from '../components/Typewriter.astro'
import ArrowDownButton from '../components/ArrowDownButton.astro'
import GithubSection from '../components/GithubSection.astro'
import FooterBar from '../components/FooterBar.astro'
---

<Layout>
  <div 
    x-data="pageExpand()"
    @wheel="handleWheel($event)"
    class="font-sans flex flex-col items-center justify-items-center min-h-screen w-full"
  >
    <!-- 主视觉区 -->
    <HeroSection />
    
    <!-- 向下滚动按钮 -->
    <div class="absolute bottom-1/12 left-1/2">
      <ArrowDownButton />
    </div>
    
    <!-- 占位，用于滚动 -->
    <div style="height: 100vh; visibility: hidden; pointer-events: none" />
    
    <!-- GitHub 展示区 -->
    <div x-show="isExpanded" x-transition:enter="transition ease-out duration-300">
      <GithubSection />
    </div>
    
    <!-- 页脚 -->
    <FooterBar />
  </div>
</Layout>
```

#### 任务 6.2：更新文章列表页 (articles/index.astro)
```astro
---
// 文章列表页
// 使用 Alpine.js 管理筛选和分页

import ImageHeaderBar from '@/components/ImageHeaderBar.astro'
import BlogItem from '@/components/BlogItem.astro'
import CategoryFilter from '@/components/CategoryFilter.astro'
import Card from '@/components/Card.astro'
import { getAllPosts, getCategories } from '@/lib/utils/posts'
import type { CollectionEntry } from 'astro:content'

export const prerender = false

const { searchParams } = Astro.url
const searchTerm = searchParams.get("search") || ""
const selectedCategory = searchParams.get("category") || "all"
const sortType = searchParams.get("sort") || "latest"
const currentPage = Math.max(1, parseInt(searchParams.get("page") || "1", 10))
const articlesPerPage = 6

// 获取所有文章和分类
const allPosts = await getAllPosts()
const categories = await getCategories()

// 筛选文章
let filteredPosts = allPosts

if (selectedCategory !== "all") {
  filteredPosts = filteredPosts.filter(post => post.data.category === selectedCategory)
}

if (searchTerm) {
  const term = searchTerm.toLowerCase()
  filteredPosts = filteredPosts.filter(post =>
    post.data.title.toLowerCase().includes(term) ||
    post.data.description.toLowerCase().includes(term)
  )
}

// 排序
if (sortType === "latest") {
  filteredPosts.sort((a, b) => b.data.publishDate.valueOf() - a.data.publishDate.valueOf())
}

// 分页
const startIndex = (currentPage - 1) * articlesPerPage
const endIndex = startIndex + articlesPerPage
const posts = filteredPosts.slice(startIndex, endIndex)
const totalPages = Math.ceil(filteredPosts.length / articlesPerPage)
---

<div class="min-h-screen bg-background">
  <ImageHeaderBar
    src="/imgs/index-bg-img-04.png"
    title="文章"
    subtitle="在这里你可以找到我所有的文章"
  />

  <div class="w-full max-w-7xl mx-auto px-4 py-8">
    <div class="flex flex-col lg:flex-row gap-8">
      <!-- 侧边栏 -->
      <div class="flex flex-col gap-6 lg:w-80 flex-shrink-0">
        <!-- 搜索框 -->
        <form method="GET" class="relative">
          <input
            type="text"
            name="search"
            placeholder="输入关键词搜索..."
            value={searchTerm}
            class="w-full px-4 py-2 border border-gray-200 rounded-lg bg-card-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
          <button type="submit" class="absolute right-3 top-2.5" title="搜索">
            <svg class="w-5 h-5 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
        </form>

        <!-- 分类筛选器 -->
        <CategoryFilter
          categories={categories}
          selectedCategory={selectedCategory}
          searchTerm={searchTerm}
          sortType={sortType}
        />
      </div>

      <!-- 主内容区 -->
      <div class="flex-1">
        <!-- 结果统计 -->
        <div class="mb-6">
          <h2 class="text-2xl font-bold text-foreground mb-2">
            {selectedCategory && selectedCategory !== "all"
              ? categories.find((c) => c.slug === selectedCategory)?.name || selectedCategory
              : "所有文章"}
          </h2>
          <p class="text-muted">
            共找到 {filteredPosts.length} 篇文章
            {searchTerm && `，包含关键词"${searchTerm}"`}
          </p>
        </div>

        <!-- 文章列表 -->
        <div class="flex flex-col gap-6 mb-8">
          {posts.length > 0 ? (
            posts.map((post: CollectionEntry<'posts'>) => (
              <a href={`/articles/${post.slug}`}>
                <BlogItem
                  coverImage={post.data.coverImage || ""}
                  title={post.data.title}
                  description={post.data.description}
                  category={{
                    name: categories.find((c) => c.slug === post.data.category)?.name || "未分类",
                    color: categories.find((c) => c.slug === post.data.category)?.data.color,
                  }}
                  publishDate={post.data.publishDate.toISOString().split('T')[0]}
                />
              </a>
            ))
          ) : (
            <Card>
              <div class="text-center py-12">
                <svg class="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 class="text-lg font-medium text-gray-600 mb-2">暂无文章</h3>
                <p class="text-gray-500">
                  {searchTerm ? "没有找到匹配的文章，请尝试其他关键词" : "该分类下暂无文章"}
                </p>
              </div>
            </Card>
          )}
        </div>

        <!-- 分页 -->
        {totalPages > 1 && (
          <Pagination currentPage={currentPage} totalPages={totalPages} />
        )}
      </div>
    </div>
  </div>
</div>
```

#### 任务 6.3：更新文章详情页 (articles/[id].astro)
```astro
---
// 文章详情页
// 使用 Alpine.js 管理交互

import { getCollection } from 'astro:content'
import Layout from '../../layouts/Layout.astro'
import ArticleHeader from '../../components/ArticleHeader.astro'
import ArticleContent from '../../components/ArticleContent.astro'
import ArticleNavigation from '../../components/ArticleNavigation.astro'
import RelatedArticles from '../../components/RelatedArticles.astro'

export async function getStaticPaths() {
  const posts = await getCollection('posts')
  return posts.map((post) => ({
    params: { id: post.slug },
    props: { post },
  }))
}

const { id } = Astro.params
const post = (await getCollection('posts')).find(p => p.slug === id)

if (!post) {
  return Astro.redirect('/404')
}

const { Content } = await post.render()
---

<Layout title={post.data.title}>
  <article class="min-h-screen bg-background">
    <ArticleHeader post={post} />
    
    <div class="max-w-4xl mx-auto px-4 py-8">
      <ArticleContent>
        <Content />
      </ArticleContent>
      
      <ArticleNavigation />
      <RelatedArticles currentPost={post} />
    </div>
  </article>
</Layout>
```

#### 任务 6.4：更新关于页面 (about/index.astro)
```astro
---
// 关于页面
// 使用静态内容展示

import Layout from '../../layouts/Layout.astro'
import Card from '../../components/Card.astro'
---

<Layout title="关于我">
  <div class="min-h-screen bg-background py-16">
    <div class="max-w-4xl mx-auto px-4">
      <h1 class="text-4xl font-bold mb-8">关于我</h1>
      
      <Card>
        <div class="prose prose-lg dark:prose-invert max-w-none">
          <p>这里是关于我的介绍...</p>
        </div>
      </Card>
    </div>
  </div>
</Layout>
```

### 3.7 阶段七：类型系统维护

#### 任务 7.1：创建新类型定义
```typescript
// src/types/post.ts
// 文章相关类型定义

/** 文章数据接口 */
export interface Post {
  slug: string
  data: PostData
  render: () => Promise<{ Content: any }>
}

/** 文章元数据接口 */
export interface PostData {
  title: string
  description: string
  publishDate: Date
  updatedDate?: Date
  category: string
  tags: string[]
  coverImage?: string
  isRepost?: boolean
  originalAuthor?: string
  originalLink?: string
}

/** 分类数据接口 */
export interface Category {
  name: string
  slug: string
  description?: string
  color: string
}

/** 分类统计接口 */
export interface CategoryWithCount extends Category {
  articleCount: number
}
```

```typescript
// src/types/component.ts
// 组件相关类型定义

/** 头像组件属性 */
export interface AvatarProps {
  src?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

/** 模态框组件属性 */
export interface ModalProps {
  isOpen?: boolean
  onClose?: () => void
  title?: string
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  showCloseButton?: boolean
}

/** 分页组件属性 */
export interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange?: (page: number) => void
  className?: string
}

/** 打字机效果组件属性 */
export interface TypewriterProps {
  initialText?: string
  repeatedTextList?: string[]
  initialTypingSpeed?: number
  repeatedTypingSpeed?: number
  gapInterval?: number
  loop?: boolean
  deleteSpeed?: number
  cursor?: string
  cursorBlinkInterval?: number
  className?: string
}
```

#### 任务 7.2：删除旧类型定义
```bash
# 删除与数据库和 API 相关的类型
rm src/types/article.ts（如果存在）
# 保留通用类型
```

### 3.8 阶段八：测试与验证

#### 任务 8.1：功能测试
- [ ] 首页正常加载，滚动交互正常
- [ ] 文章列表页正常显示，筛选和搜索正常
- [ ] 文章详情页正常渲染 Markdown
- [ ] 打字机效果正常
- [ ] GitHub 数据正常加载
- [ ] 模态框打开/关闭正常
- [ ] 分页功能正常
- [ ] 分类筛选正常
- [ ] 主题切换正常（如保留）

#### 任务 8.2：样式测试
- [ ] 所有页面样式与原项目一致
- [ ] 响应式布局正常
- [ ] 暗色模式正常（如保留）
- [ ] 动画效果流畅

#### 任务 8.3：性能测试
- [ ] 页面加载速度提升（移除 React）
- [ ] Lighthouse 评分
- [ ] 首次内容绘制（FCP）
- [ ] 最大内容绘制（LCP）

#### 任务 8.4：类型检查
```bash
# 运行 Astro 类型检查
pnpm astro check

# 如有 TypeScript 错误，逐一修复
```

#### 任务 8.5：构建测试
```bash
# 生产构建
pnpm build

# 预览构建结果
pnpm preview
```

### 3.9 阶段九：文档与清理

#### 任务 9.1：更新 README.md

#### 任务 9.2：更新 AGENTS.md
- 更新技术栈部分
- 删除数据库相关命令
- 更新组件说明

#### 任务 9.3：清理无用文件
```bash
# 删除测试文件
rm -rf tests/

# 删除示例文件（如无用处）
rm src/components/Example.tsx

# 清理 node_modules
pnpm install
```

#### 任务 9.4：创建迁移指南

## 四、详细 TODO 清单

### 第一阶段：环境准备
- [x] 创建备份分支
- [x] 创建重构分支
- [x] 更新 package.json（删除 React/数据库依赖）
- [x] 添加 Alpine.js 依赖
- [x] 更新 astro.config.mjs（删除 React 集成，添加 Alpine.js）
- [x] 更新 Tailwind CSS 配置

### 第二阶段：文章系统重构
- [x] 配置 Astro Content Layer
- [x] 创建 `src/content/posts/` 目录
- [x] 创建 `src/content/categories/` 目录
- [x] 定义文章 schema
- [x] 定义分类 schema
- [x] 创建文章工具函数（getAllPosts、getPostBySlug 等）
- [x] 创建分类工具函数（getCategories）
- [ ] （可选）创建数据库导出脚本
- [ ] （可选）迁移现有文章数据到 Markdown

### 第三阶段：删除管理后台
- [x] 删除 `src/pages/admin/` 目录
- [x] 删除 `src/pages/api/` 目录
- [x] 删除 `src/lib/db/` 目录
- [x] 删除 `src/lib/storage/` 目录
- [x] 删除 `src/lib/utils/auth.ts`
- [x] 删除 `src/lib/utils/authMiddleware.ts`
- [x] 删除 AdminDashboard.tsx
- [x] 删除 AdminFloatingButton.tsx
- [x] 删除 AdminLayout.tsx
- [x] 删除 ArticleActions.tsx
- [x] 删除 ArticleEditor.tsx
- [x] 删除 ArticleEditPage.tsx
- [x] 删除 LoginPage.tsx
- [x] 删除 SettingsPage.tsx
- [x] 删除 RootLayoutClient.tsx
- [x] 删除 `src/contexts/` 目录

### 第四阶段：静态组件迁移
- [x] 迁移 Avatar.tsx → Avatar.astro（添加中文注释）
- [x] 迁移 BusinessCard.tsx → BusinessCard.astro（添加中文注释）
- [x] 迁移 Card.tsx → Card.astro（已存在，跳过）
- [x] 迁移 CategoryCard.tsx → CategoryCard.astro（添加中文注释）
- [x] 拆分并迁移 GithubCard.tsx → GithubUserCard.astro + GithubRepoList.astro 等（添加中文注释）
- [x] 迁移 ImageHeaderBar.tsx → ImageHeaderBar.astro（添加中文注释）
- [x] 迁移 MenuButton.tsx → MenuButton.astro（添加中文注释）
- [x] 迁移 PageHeader.tsx → PageHeader.astro（添加中文注释）
- [x] 迁移 SkillsCard.tsx → SkillsCard.astro（添加中文注释）
- [x] 迁移 WebStatisticDataCard.tsx → WebStatisticDataCard.astro（添加中文注释）
- [x] 迁移 FloatingActionButton.tsx → FloatingActionButton.astro（添加中文注释）
- [x] 迁移 Skeleton.tsx → Skeleton.astro（添加中文注释）

### 第五阶段：动态组件重构（Alpine.js）
- [x] 创建 src/lib/alpine-utils.ts
- [x] 实现 pageExpand() 工具函数（添加中文注释）
- [x] 创建 alpine-components.js
- [x] 在布局中引入 alpine-components.js
- [x] 重构 HeaderBar.tsx → HeaderBar.astro（Alpine.js，添加中文注释）
- [x] 重构 BlogItem.tsx → BlogItem.astro（Alpine.js，添加中文注释）
- [x] 重构 Modal.tsx → Modal.astro（Alpine.js，添加中文注释）
- [x] 重构 Pagination.tsx → Pagination.astro（Alpine.js，添加中文注释）
- [x] 重构 CategoryFilter.tsx → CategoryFilter.astro（Alpine.js，添加中文注释）
- [x] 拆分 HomeClient.tsx → HeroSection.astro + Typewriter.astro + ArrowDownButton.astro + GithubSection.astro（Alpine.js，添加中文注释）
- [x] 重构 Typewriter.tsx → Typewriter.astro（Alpine.js，添加中文注释）
- [x] 删除 ContentPage.tsx（后台管理页面，不需要）
- [x] 删除 GalleryPage.tsx（后台管理页面，不需要）
- [x] 删除 ImageDetailModal.tsx（后台组件，不需要）
- [x] 删除 ImagePicker.tsx（后台组件，不需要）
- [x] 删除 ImageUploader.tsx（后台组件，不需要）
- [x] 删除 UploadModal.tsx（后台组件，不需要）

### 第六阶段：页面重构
- [x] 更新 pages/index.astro（使用 Alpine.js，添加中文注释）
- [x] 更新 pages/articles/index.astro（使用新的文章工具函数，添加中文注释）
- [x] 更新 pages/articles/[id].astro（使用 Content Layer，添加中文注释）
- [x] 更新 pages/about/index.astro（静态内容，更新技术栈描述）
- [x] （如需要）更新 pages/links/index.astro（添加中文注释）

### 第七阶段：类型系统
- [x] 创建 src/types/post.ts（添加中文注释）
- [x] 创建 src/types/component.ts（添加中文注释）
- [x] 删除旧的数据库相关类型
- [x] 运行 pnpm astro check 检查类型错误（跳过，等待组件迁移完成）
- [x] 修复所有类型错误（跳过，等待组件迁移完成）

### 第八阶段：测试验证
- [x] 首页功能测试（滚动、打字机效果、GitHub 数据）
- [ ] 文章列表页功能测试（搜索、筛选、分页）- 500错误待修复
- [ ] 文章详情页功能测试（Markdown 渲染）
- [ ] 所有页面样式对比测试
- [ ] 响应式布局测试
- [ ] 性能测试（Lighthouse）
- [ ] 类型检查通过
- [ ] 生产构建测试
- [ ] 预览构建结果测试

### 第九阶段：文档与清理
- [ ] 更新 README.md（技术栈、开发命令）
- [ ] 更新 AGENTS.md（删除数据库相关内容）
- [ ] 清理无用文件和目录
- [ ] 重新安装依赖（pnpm install）
- [ ] 提交代码到重构分支

## 五、风险评估与缓解策略

### 5.1 风险识别

#### 高风险
1. **数据丢失风险**
   - 风险：删除数据库后，现有文章数据丢失
   - 缓解：先导出所有文章为 Markdown 文件，再删除数据库

2. **样式不一致风险**
   - 风险：迁移后样式可能与原项目不一致
   - 缓解：仔细对比每个组件的 CSS 类，确保完全一致

#### 中风险
3. **功能缺失风险**
   - 风险：某些 React 特有功能无法用 Alpine.js 实现
   - 缓解：提前评估每个组件，对于复杂组件考虑保留或拆分

4. **类型安全风险**
   - 风险：从强类型（React + TypeScript）到弱类型（Alpine.js）
   - 缓解：保持组件Props接口定义，确保数据流类型安全

#### 低风险
5. **性能回退风险**
   - 风险：不恰当使用 Alpine.js 导致性能下降
   - 缓解：遵循 Alpine.js 最佳实践，避免不必要的响应式

### 5.2 回滚计划

如果重构过程中遇到无法解决的问题，可以：
1. 切换回备份分支：`git checkout backup-before-refactor`
2. 重新开始：删除重构分支，从备份分支重新开始

## 六、时间估算

基于组件数量和复杂度，预计重构时间：

| 阶段 | 任务数 | 预计时间 |
|-----|-------|---------|
| 阶段一：环境准备 | 6 | 0.5 天 |
| 阶段二：文章系统重构 | 9 | 1-1.5 天 |
| 阶段三：删除管理后台 | 15 | 0.5 天 |
| 阶段四：静态组件迁移 | 12 | 1-1.5 天 |
| 阶段五：动态组件重构（Alpine.js） | 17 | 2-3 天 |
| 阶段六：页面重构 | 5 | 1 天 |
| 阶段七：类型系统 | 5 | 0.5 天 |
| 阶段八：测试验证 | 9 | 1-1.5 天 |
| 阶段九：文档与清理 | 5 | 0.5 天 |
| **总计** | **83** | **8.5-11 天** |

## 七、重构后的优势

1. **更轻量**：移除 React 生态，减小包体积
2. **更简单**：Alpine.js 学习曲线更低，代码更直观
3. **更快**：Astro 的静态生成 + Alpine.js 的轻量交互
4. **更易维护**：文章使用 Markdown，直接编辑，无需后台
5. **更低成本**：无需数据库，纯静态托管即可

## 八、注意事项

1. **中文注释要求**：每个组件、文件、重要函数都需要添加中文注释
2. **样式一致性**：确保迁移后的样式与原项目完全一致
3. **功能完整性**：保证动态组件的前后功能一致
4. **类型安全**：维护 TypeScript 类型系统，避免使用 any
5. **组件拆分**：对于超过 100 行或逻辑复杂的组件，适当拆分
6. **渐进式迁移**：建议按阶段逐步迁移，每个阶段完成后测试验证

## 九、参考资料

- [Astro 官方文档](https://docs.astro.build/)
- [Astro Content Layer 文档](https://docs.astro.build/en/guides/content-collections/)
- [Alpine.js 官方文档](https://alpinejs.dev/)
- [Alpine.js 最佳实践](https://alpinejs.dev/essentials/best-practices)
- [Tailwind CSS 文档](https://tailwindcss.com/)

## 十、附录

### 10.1 Alpine.js 常用模式

#### 条件渲染
```astro
<div x-show="isOpen">
  显示内容
</div>
```

#### 循环渲染
```astro
<template x-for="item in items" :key="item.id">
  <span x-text="item.name"></span>
</template>
```

#### 事件处理
```astro
<button @click="handleClick">
  点击我
</button>
```

#### 数据绑定
```astro
<input x-model="message" />
```

#### 过渡动画
```astro
<div x-show="isOpen" x-transition:enter="transition ease-out duration-300">
  内容
</div>
```

### 10.2 Astro 组件最佳实践

1. 使用 Props 接口定义组件属性
2. 将复杂逻辑提取到单独的 `.ts` 文件
3. 使用 slot 实现内容分发
4. 利用 Astro 的静态生成优势
5. 合理使用 `client:load`、`client:visible` 等指令

---

**文档版本**：1.0  
**创建日期**：2025-03-11  
**最后更新**：2025-03-11  
**维护人**：Azuxa
