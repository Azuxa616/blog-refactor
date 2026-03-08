# AGENTS.md - Developer Guide for Blog Refactor

## Project Overview

This is an Astro 5.x blog application migrated from Next.js. It uses TypeScript, React, Tailwind CSS 4.x, Drizzle ORM with SQLite, and shadcn/ui-style components.

## Tech Stack

- **Framework**: Astro 5.x
- **Package Manager**: pnpm
- **Language**: TypeScript
- **UI**: React 19 + Tailwind CSS 4.x
- **Database**: SQLite (LibSQL/Turso) with Drizzle ORM
- **Fonts**: Inter (sans) + JetBrains Mono (mono)

## Commands

### Development
```bash
pnpm dev          # Start dev server at http://localhost:4321
pnpm build        # Build for production
pnpm preview      # Preview production build
pnpm astro        # Run Astro CLI
```

### Database (Drizzle)
```bash
pnpm drizzle-kit push    # Push schema to database
pnpm drizzle-kit studio # Open Drizzle Studio
```

### Running a Single Test
This project does not have a test framework configured. If adding tests:
```bash
pnpm vitest run <file>   # Run single test file
pnpm vitest <file>       # Watch mode
```

## Code Style Guidelines

### General Rules
- Use strict TypeScript (`astro/tsconfigs/strict` extends)
- Prefer functional components with TypeScript
- Use Astro components (`.astro`) for static content, React (`.tsx`) for interactive UI
- Keep components small and focused

### Imports
```typescript
// Group imports by type (IDE will handle sorting)
import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { type Article } from '@/types/article'

// Use @ alias for src/ directory
// @ refers to F:\MyProjects\blog-Azx616\blog-refactor\src
```

### Naming Conventions
- **Components**: PascalCase (e.g., `ArticleCard.astro`, `Button.tsx`)
- **Files**: kebab-case for Astro pages, PascalCase for components
- **Types**: PascalCase with descriptive names (e.g., `ArticleWithAuthor`)
- **Variables**: camelCase
- **Constants**: UPPER_SNAKE_CASE for true constants, camelCase otherwise

### TypeScript Guidelines
- Always define return types for functions
- Use `import type` for type-only imports
- Avoid `any`, use `unknown` when type is truly unknown
- Enable strict null checks

```typescript
// Good
function getArticle(id: string): Promise<Article | null> {
  // ...
}

// Avoid
function getArticle(id: string) {
  // ...
}
```

### React Patterns
- Use functional components with hooks
- Prefer composition over inheritance
- Extract reusable logic into custom hooks
- Use `use client` directive for client-side interactive components

```astro
---
// Client component in Astro
import { ClientComponent } from '@/components/ClientComponent'
---
<ClientComponent client:load />
```

### Tailwind CSS
- Use Tailwind Merge (`cn()` utility) for conditional classes
- Follow mobile-first responsive design
- Use semantic color names from design system

```typescript
import { cn } from '@/lib/utils'

<div className={cn(
  "base-class",
  isActive && "active-class",
  className
)} />
```

### Error Handling
- Use try/catch for async operations
- Return typed error results or use error boundaries in React
- Log errors appropriately (no sensitive data)

```typescript
async function fetchData() {
  try {
    const result = await db.query(...)
    return { data: result, error: null }
  } catch (e) {
    console.error('Fetch failed:', e)
    return { data: null, error: 'Failed to fetch data' }
  }
}
```

### Database (Drizzle ORM)
- Define schemas in `src/lib/db/schema.ts`
- Use migrations: `pnpm drizzle-kit push`
- Keep queries close to usage or in dedicated repository files

### Astro Specific
- Use frontmatter `---` for component script
- Access environment variables via `import.meta.env`
- Use getStaticPaths for dynamic static routes

```astro
---
export async function getStaticPaths() {
  const posts = await getAllPosts()
  return posts.map(post => ({
    params: { slug: post.slug },
    props: { post }
  }))
}

const { post } = Astro.props
---
```

## Project Structure

```
src/
├── components/     # React/Astro components
├── contexts/       # React Context providers
├── layouts/        # Astro layouts
├── lib/
│   ├── config/    # App configuration
│   ├── db/        # Drizzle schema & queries
│   ├── storage/   # Storage service
│   └── utils/     # Helper functions
├── pages/         # Astro file-based routing
├── styles/        # Global styles
└── types/         # TypeScript type definitions
```

## Environment Variables

Copy `.env.example` to `.env`:
- `DATABASE_URL` - SQLite file path or Turso connection string
- `JWT_SECRET` - Secret for JWT token signing
- Other app-specific variables

## Additional Notes

- Dark mode is the default theme
- Use Zod for runtime validation (already included)
- Markdown content stored in database, rendered with remark/rehype
