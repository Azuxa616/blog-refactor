# Blog Refactor - Astro 版本

这是从 Next.js 迁移到 Astro 的博客项目重构版本。

## 技术栈

- **框架**: Astro 5.x
- **包管理器**: pnpm
- **样式**: Tailwind CSS 4.x
- **UI 组件**: shadcn/ui (适配 Astro)
- **数据库**: SQLite (LibSQL/Turso)
- **ORM**: Drizzle ORM
- **字体**: Inter (Sans) + JetBrains Mono (Mono)
- **语言**: TypeScript

## 项目结构

```
blog-refactor/
├── src/
│   ├── components/     # 组件
│   ├── contexts/       # React Context
│   ├── layouts/        # 布局
│   ├── lib/            # 工具库
│   │   ├── config/     # 配置
│   │   ├── db/         # 数据库
│   │   ├── storage/    # 存储服务
│   │   └── utils/      # 工具函数
│   ├── pages/          # 页面路由
│   ├── styles/         # 样式
│   └── types/          # TypeScript 类型
├── public/             # 静态资源
├── data/               # 数据库文件
└── .env.example        # 环境变量模板
```

## 快速开始

### 1. 安装依赖

```bash
pnpm install
```

### 2. 配置环境变量

复制 `.env.example` 到 `.env` 并根据需要修改：

```bash
cp .env.example .env
```

### 3. 启动开发服务器

```bash
pnpm dev
```

访问 `http://localhost:4321`

### 4. 构建生产版本

```bash
pnpm build
```

### 5. 预览生产构建

```bash
pnpm preview
```

## 迁移进度

### 已完成 ✅

- [x] 初始化 Astro 项目，配置 pnpm
- [x] 安装和配置 Tailwind CSS
- [x] 安装 shadcn/ui 基础依赖
- [x] 迁移工具库和类型定义
- [x] 迁移数据库和存储系统
- [x] 复制 public 目录资源
- [x] 创建基础布局
- [x] 配置环境变量
- [x] 测试构建和运行

### 进行中 🚧

- [ ] 迁移原项目的公共组件到 Astro 组件
- [ ] 迁移主页面和路由
- [ ] 迁移 API 路由到 Astro endpoints

### 待完成 ⏳

- [ ] 迁移文章管理页面
- [ ] 迁移后台管理页面
- [ ] 迁移关于页面
- [ ] 迁移其他页面和功能

## 主要变更

### 从 Next.js 到 Astro

1. **路由系统**: 从 `src/app/` (App Router) 迁移到 `src/pages/` (File-based routing)
2. **API 路由**: 从 `src/app/api/` 迁移到 `src/pages/api/` (Astro endpoints)
3. **环境变量**: 从 `process.env` 迁移到 `import.meta.env`
4. **字体**: 从 Geist (Next.js) 迁移到 Fontsource (Astro)
5. **布局**: 从 `src/app/layout.tsx` 迁移到 `src/layouts/Layout.astro`

### 依赖变更

- 移除 `next`、`react-dom` 等 Next.js 专用依赖
- 移除 `geist` (Next.js 字体包)
- 添加 `@astrojs/react`、`@astrojs/tailwind` 等 Astro 集成
- 添加 `@fontsource-variable/inter`、`@fontsource-variable/jetbrains-mono`

## 注意事项

1. **数据库**: 默认使用本地 SQLite 文件 (`data/blog.db`)，可配置 Turso 云数据库
2. **主题**: 项目使用 dark mode 作为默认主题
3. **组件**: 部分复杂组件可能需要进一步适配 Astro
4. **API**: API 路由需要使用 Astro 的 endpoint 语法重写

## 下一步计划

1. 完成所有页面的迁移
2. 适配 shadcn/ui 组件
3. 实现完整的 API endpoints
4. 测试所有功能
5. 优化性能和 SEO

## 许可证

MIT
