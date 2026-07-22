# COMPONENTS DIRECTORY

**Scope:** Multi-framework UI components (Astro, Alpine.js, React)

## OVERVIEW

Astro for SSR content, Alpine.js for lightweight client state, React for SPA-like interactive regions.

## STRUCTURE

```
src/components/
├── content/       # Content display (ArticleCoverImage, Avatar, BlogItem, BusinessCard, CategoryBadge, SkillsCard, Tag, WebStatisticDataCard)
├── github/        # GitHub integration UI (cards, heatmap, repo lists, skills section)
├── interactions/  # Alpine.js widgets (CategoryCard, CategoryFilter, FloatingActionButton, Modal, Pagination, Typewriter)
├── layout/        # Page chrome & nav (HeaderBar, FooterBar, HeroSection, NavLinkButton, ThemeScript, etc.)
├── react/         # React equivalents of layout/interactions components
├── skeleton/      # Loading placeholders (Skeleton*, 7 files)
└── GithubSection.astro  # Wrapper composing github/ components
```

## WHERE TO LOOK

| Need | Location |
|------|----------|
| Static content card | `content/` (Astro) |
| GitHub profile/repos display | `github/` or root `GithubSection.astro` |
| Theme toggle / mobile nav | `layout/` (Alpine.js) |
| Modal / pagination / typewriter | `interactions/` (Alpine) OR `react/` |
| React app root | `react/AppLayout.tsx` (provides `AppProvider` context) |
| Loading state | `skeleton/Skeleton*.tsx` |

## CONVENTIONS

### Framework Choice
- **Astro (`.astro`)**: SSR content, SEO-critical markup, static layout
- **Alpine.js**: Simple client interactivity via `x-data` / `@click` / `x-show` in `layout/` and `interactions/`
- **React (`.tsx`)**: Complex stateful UI, hydrated via `client:load` (above-fold) or `client:visible` (lazy)

### Naming
- **PascalCase** for all component files (all frameworks)
- `.astro` extension for Astro + Alpine components
- `.tsx` extension for React components

### Dual Implementation Pattern
Some components exist in BOTH `layout/` or `interactions/` (Astro/Alpine) AND `react/` (React):
- `FloatingActionButton`, `HeaderBar`, `Modal`, `NavLinkButton`, `Pagination`, `Typewriter`
- **Astro versions**: used in standalone SSR pages
- **React versions**: used inside `AppLayout.tsx` for SPA-like behavior

### React Subtree
- `react/AppLayout.tsx` is the React root, wraps children with `AppProvider` (React Context)
- React components consume context, avoid prop drilling
- Hydrated as a whole subtree, not per-component

### Alpine.js Scope
- `layout/` and `interactions/` use Alpine directives inline (`x-data`, `@click`)
- State synced to Zustand via `src/lib/alpine-zustand.ts` bridge
- Do NOT introduce React in these directories

### Skeleton Components
- All `.astro`, exported from `skeleton/`
- Pulse/placeholder shapes mirroring real component dimensions
- Use during async data fetch (GitHub data, content load)

## ANTI-PATTERNS

- **No mixing frameworks in a single component**. Pick one per file.
- **No React in `layout/` or `interactions/`**. Those are Alpine-only.
- **No Alpine in `react/`**. Those are React-only, hydrated as a subtree.
- **No `as any` / `@ts-ignore`**. Known violation: `layout/HeaderBar.astro:15` (className prop).
- **No prop drilling in React subtree**. Use `AppContext` via `useApp`.
- **No new Skeleton files without matching real component**. Keep placeholders in sync.
