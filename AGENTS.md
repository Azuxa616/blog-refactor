# PROJECT KNOWLEDGE BASE

**Generated:** 2026-07-18
**Branch:** restructure-posts-directories

## OVERVIEW

Astro 6.x SSR personal blog — migrated from Next.js. Multi-framework UI (Astro + Alpine.js + React), Tailwind CSS 4.x, Zod content validation, no database (file-based content collections).

## STRUCTURE

```
blog-refactor/
├── src/
│   ├── components/       # Multi-framework UI (see src/components/AGENTS.md)
│   ├── layouts/           # Single Layout.astro (SSR root)
│   ├── pages/             # File-based routing (/, /about, /articles/[slug])
│   ├── lib/               # Config, utils, custom remark/rehype plugins
│   ├── styles/            # Categorized CSS (base/theme/typography/components)
│   ├── types/             # 9 type files, barrel-exported via index.ts
│   ├── context/           # React Context (AppContext.tsx)
│   ├── data/              # Non-content data (github.ts)
│   ├── content.config.ts  # Zod schemas for posts & categories
│   ├── alpine-components.js  # Global Alpine registration + appState store
│   └── alpine-entrypoint.js  # Minimal Alpine init (plugin-loaded)
├── content/               # Markdown content (NOT in src/)
│   ├── posts/             # Nested dirs with index.md/index.mdx
│   └── categories/        # Flat category .md files
├── docs/                  # Migration & planning docs
└── public/                # Static assets (svgs/, imgs/, blog-images/)
```

## WHERE TO LOOK

| Task | Location | Notes |
|------|----------|-------|
| Page routes | `src/pages/` | 4 pages: index, about, articles/index, articles/[slug] |
| Content schemas | `src/content.config.ts` | Posts & categories with Zod |
| Component patterns | `src/components/AGENTS.md` | Multi-framework conventions |
| Markdown pipeline | `astro.config.mjs` | 10+ remark/rehype plugins |
| App configuration | `src/lib/config/app.ts` | Auth, JWT, upload, OAuth |
| Type definitions | `src/types/` | Barrel export via index.ts |
| Global CSS | `src/styles/global.css` | Imports all sub-CSS in order |
| Utility functions | `src/lib/utils.ts` | `cn()` for Tailwind class merging |

## CODE MAP

| Symbol | Type | Location | Role |
|--------|------|----------|------|
| `collections` | Constant | `src/content.config.ts:32` | Posts & categories Zod schemas |
| `appConfig` | Object | `src/lib/config/app.ts` | All app config from env vars |
| `cn` | Function | `src/lib/utils.ts` | Tailwind class merge (clsx + twMerge) |
| `AppLayout` | Component | `src/components/react/AppLayout.tsx` | React root wrapper (HeaderBar + FAB) |

## CONVENTIONS

### Code Style
- **No semicolons, single quotes** (Prettier: `semi: false, singleQuote: true`)
- **`@/` path alias** maps to `./src/` (tsconfig + Vite)
- **Chinese comments** for documentation (中文注释)
- **`import type`** for type-only imports

### Component Framework Choice
- **Astro**: Static/SSR content, SEO-critical markup
- **Alpine.js**: Simple client-side state (theme toggle, nav expand, modals) via `x-data`/`@click`
- **React**: Complex interactive UI — `client:load` for above-fold, `client:visible` for lazy
- **Never mix frameworks in one component** — choose one per component

### Content Pipeline Order (astro.config.mjs)
remarkMath → remarkGfm → remarkEmoji → remarkCallout → remarkToc → rehypeSlug → rehypeAutolinkHeadings → rehypeExternalLinks → rehypeCodeHeader → rehypeKatex → rehypePresetMinify

### State Management Architecture
- **Alpine store** (`appState`): Theme, category, search, expand — defined in `alpine-components.js`
- **React components** read theme state via DOM (`document.documentElement.classList`) and sync with Alpine store
- **No Zustand/Context bridge**: React island components use `React.memo` + DOM observation for stability

### Custom Plugins
- `src/lib/remark/remark-callout.ts` — GitHub-style callout blocks (`> [!NOTE]`, `> [!WARNING]`)
- `src/lib/rehype/rehype-code-header.ts` — Language label + copy button for code blocks

## ANTI-PATTERNS (THIS PROJECT)

- **No `@ts-ignore` / `@ts-expect-error`** — known violation in `src/components/layout/HeaderBar.astro:15` (should be fixed)
- **No `as any`** — strict typing enforced
- **No empty catch blocks** — always log or return error
- **No `TODO`/`FIXME` in code** — use issues instead

## UNIQUE STYLES

- Content lives in **`content/` (root)**, not `src/content/` — requires `base: './content/posts'` in loader
- Posts use **nested directories** (`content/posts/hello-world/index.md`) for multi-file articles
- **Alpine-only state**: Alpine `appState` store for theme, category, search — defined in `alpine-components.js`
- **ESLint flat config** (`eslint.config.js`) with multi-language support (JS/TS, JSON, Markdown, CSS)
- **No CI/CD** configured — no GitHub Actions, Dockerfile, or platform configs
- **No tests** — Vitest not installed

## COMMANDS

```bash
pnpm dev              # Dev server (localhost:4321)
pnpm build            # Production build
pnpm preview          # Preview production build
pnpm astro check      # Type-check
pnpm lint             # ESLint (flat config, multi-language)
pnpm format           # Prettier (no semicolons, single quotes)
```

## NOTES

- **SSR mode**: `output: 'server'` with `@astrojs/node` standalone adapter
- **Dark mode default**: `<html class="dark">` in Layout.astro
- **Syntax highlight**: Shiki with `github-dark` theme (configured in MDX integration)
- **Fonts**: `@fontsource-variable/inter` + `@fontsource-variable/jetbrains-mono`
- **Known tech debt**: `HeaderBar.astro:15` has `@ts-ignore` for className prop
- **Storybook**: `storybook-static/` present but no Storybook config detected (stale artifact?)
