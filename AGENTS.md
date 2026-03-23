# AGENTS.md - Developer Guide

Astro 5.x SSR blog with Alpine.js, Tailwind CSS 4.x, TypeScript strict mode, Zod content validation.

## Tech Stack

- **Framework**: Astro 5.x with Node adapter (SSR)
- **Package Manager**: pnpm
- **Language**: TypeScript (strict mode, `astro/tsconfigs/strict`)
- **UI**: Astro + Alpine.js + React + Tailwind CSS 4.x
- **Content**: Astro Content Collections + Zod

## Commands

```bash
# Development
pnpm dev               # Start dev server (http://localhost:4321)
pnpm build            # Build for production
pnpm preview          # Preview production build
pnpm astro check      # Type-check with Astro

# Linting & Formatting
pnpm lint             # Run ESLint
pnpm format           # Format code with Prettier

# Testing (Vitest not installed by default)
pnpm add -D vitest @vitest/ui
pnpm vitest run       # Run all tests
pnpm vitest run <file> # Run single test file
```

## Code Style Guidelines

### General Principles

- Use TypeScript strictly; avoid JavaScript unless necessary
- Prefer minimal, safe changes over large refactors
- Chinese comments for documentation (中文注释)
- Run `pnpm format` before committing; run `pnpm lint` to check

### Import Organization

```typescript
// External libraries
import { defineCollection, z } from 'astro:content'
import { useState } from 'react'

// Internal imports (use @ alias for src/)
import { cn } from '@/lib/utils'
import type { Post } from '@/types'
```

### Naming Conventions

| Type                | Convention       | Example            |
| ------------------- | ---------------- | ------------------ |
| Components (Astro)  | PascalCase       | `BlogItem.astro`   |
| Components (React)  | PascalCase       | `HeaderBar.tsx`    |
| Pages               | kebab-case       | `blog/index.astro` |
| Types/Interfaces    | PascalCase       | `PostListItem`     |
| Variables/Functions | camelCase        | `getPostList`      |
| Constants           | UPPER_SNAKE_CASE | `API_ENDPOINT`     |

### TypeScript Guidelines

- Always define return types for functions
- Use `import type` for type-only imports
- Avoid `any`; use `unknown` for unknown types
- Use `z.coerce.date()` for date parsing in Zod schemas

```typescript
async function getPosts(): Promise<PostListItem[]> {
  /* ... */
}
```

### Astro Component Patterns

- Define props interfaces in frontmatter
- Use Alpine.js (`x-data`, `@click`) for client interactivity
- Complex components use React with `client:load` or `client:visible`

```astro
---
interface Props {
  title?: string
}
const { title = '默认标题' } = Astro.props
---

<div x-data="{ show: false }">
  <h2>{title}</h2>
</div>
```

### React Component Guidelines

- Use functional components with hooks
- Co-locate types with components when possible
- Use `client:load` for interactive, `client:visible` for lazy-loaded

### Tailwind CSS

- Use `cn()` from `@/lib/utils` for conditional classes
- Mobile-first responsive design (sm:, md:, lg:)
- Dark mode: use `dark:` prefix

### Content Collections

- Define schemas in `src/content.config.ts` with Zod
- Store posts in `src/content/posts/`, categories in `src/content/categories/`

```typescript
const posts = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/posts' }),
  schema: z.object({
    title: z.string(),
    publishDate: z.coerce.date(),
  }),
})
```

### Error Handling

- Use try/catch for async operations
- Return typed error results: `{ data, error }`

```typescript
async function fetchData(): Promise<{ data: Post[]; error: string | null }> {
  try {
    const posts = await getCollection('posts')
    return { data: posts, error: null }
  } catch (e) {
    console.error('Fetch failed:', e)
    return { data: [], error: 'Failed to fetch posts' }
  }
}
```

### Alpine.js Integration

- Register reusable components in `src/alpine-components.js`
- Use Alpine for simple state and interactivity

### CSS & Styling

- Use Tailwind CSS for all styling (no custom CSS unless necessary)
- Use CSS variables in `src/styles/` for theme colors

## Project Structure

```
src/
├── components/           # Astro UI components
│   ├── content/          # Content-related components
│   ├── interactions/    # Interactive (Alpine)
│   ├── layout/          # Layout components
│   └── react/           # React components
├── layouts/              # Page layouts
├── pages/                # File-based routing
├── lib/                  # Config and utilities
│   ├── rehype/          # rehype plugins
│   └── utils/           # Utility functions
├── types/                # TypeScript type definitions
├── styles/               # Global CSS and variables
├── content/              # Markdown content
│   ├── posts/           # Blog posts
│   └── categories/      # Category definitions
└── alpine-components.js  # Alpine.js component registration
```

## Environment Variables

Create `.env` file:

```bash
PUBLIC_APP_VERSION=1.0.0
PUBLIC_AUTHOR=Your Name
PUBLIC_SITE_URL=http://localhost:4321
```

Access via `import.meta.env.VARIABLE_NAME`

## Additional Notes

- Dark mode enabled by default (add `class="dark"` to `<html>`)
- Alpine.js handles client-side interactivity; React for complex UI
- Use ESLint + Prettier for code quality
