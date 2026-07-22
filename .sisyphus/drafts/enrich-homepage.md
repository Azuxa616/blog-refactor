# Draft: 丰富博客首页

## Requirements (confirmed)
- 目标: 丰富当前过于空旷的首页
- 用户给予创作自由: "结合使用当前已有但没挂载的组件以及新建组件，但要保证排版合理美观"
- 必须用 Playwright 自行查看效果

## Research Findings (Playwright 实测)

### 当前首页状态
- 单屏视口，**无滚动内容** (`hasContentBelowFold: false`)
- `<main>` 只有 1 个子元素 (hero 区)
- 仅含: HeroSection ("Welcome to Azuxa's Blog" + Typewriter "a world") + 固定背景图 + HeaderBar + FooterBar + FAB
- 暗色主题默认 (`<html class="dark">`)
- 视口测量: 995x929，scrollHeight 993 (≈ 视口高度，无溢出)

### 已有但未挂载的组件 (巨大潜力)
| 组件 | 位置 | 作用 | 状态 |
|------|------|------|------|
| `GithubSection.astro` | components/ | 完整 GitHub 资料+仓库+技能 | **在 index.astro 中被注释掉** |
| `content/BlogItem.astro` | components/content/ | 文章卡片 | 仅用于 articles 页 |
| `content/BusinessCard.astro` | components/content/ | 名片(头像+邮箱+GitHub/Gitee) | 未使用 |
| `content/SkillsCard.astro` | components/content/ | 技能熟练度雷达 | 未使用 |
| `content/WebStatisticDataCard.astro` | components/content/ | 网站统计(文章数/字数/访客) | 未使用 |
| `content/CategoryBadge.astro` | components/content/ | 分类徽章 | 未使用 |
| `content/Tag.astro` | components/content/ | 彩色标签 | 未使用 |
| `interactions/CategoryCard.astro` | components/interactions/ | 分类卡片 | 未使用 |
| `layout/ArrowDownButton.astro` | components/layout/ | 滚动指示按钮 | **在 index.astro 中被注释掉** |

### 已就绪的工具函数
- `getLatestPosts(limit)` → 获取最新文章 (src/lib/utils/posts.ts:78)
- `getCategories()` → 获取分类
- 当前有 4 篇文章: hello-world, example-post-with-images, astro-alpine-best-practices, 2024-review
- `githubData` (src/data/github.ts) → 静态 GitHub 数据(用户+2仓库+技能列表)

### 设计约束
- 暗色主题默认，固定背景图 (object-cover)
- Hero 是全屏 min-h-screen
- 折叠下方新增内容区需要可靠的背景(半透明/毛玻璃)保证可读性
- FooterBar 高度 h-16 (64px)
- Card 基础组件: 毛玻璃 + border-white/20 + shadow-xl + rounded-2xl
- 无测试基础设施 (AGENTS.md: "No tests")

## Technical Decisions (用户确认)
- **内容板块 (全部选中)**: 最新文章 + GitHub展示区 + 分类导航 + 网站统计 + 个人名片+技能
- **额外建议板块 (我补充，默认纳入)**:
  1. 精选文章高亮卡 (Featured Post) — 最新一篇大卡片
  2. 滚动引导过渡 — 启用现有 ArrowDownButton + 平滑滚动/渐变
- **视觉风格**: 暗色延续 + 毛玻璃卡片 (与现有 Card 组件一致: backdrop-blur + border-white/20 + shadow-xl)
- **内容密度**: 中等 — 用双列布局组合相关内容，留白舒适，避免堆砌
- **新建组件**: 允许按需新建小区块组件 (SectionHeader, ViewAllButton, FeaturedPostCard 等)
- **测试策略**: 无测试基础设施 (AGENTS.md 明确 "No tests")，验证完全靠 Playwright agent QA

## 排版思路 (中等密度策略)
- Hero (全屏) → ArrowDownButton 滚动指示
- 精选文章高亮卡 (大卡片, 占满宽度)
- 最新文章列表 (3篇, 双列/单列自适应) + "查看全部"
- 双列区: 左 BusinessCard + WebStatisticDataCard，右 SkillsCard
- GitHub 展示区 (GithubSection，全宽)
- 分类导航 (CategoryCard 网格)
- Footer

## Scope Boundaries
- INCLUDE: src/pages/index.astro 重构 + 新建少量区块组件 + 启用已有未挂载组件
- EXCLUDE: 不改 HeaderBar/FooterBar/Layout 主框架；不新建友链页；不改全局 CSS 体系；不动 content 数据
