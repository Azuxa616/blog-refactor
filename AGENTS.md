# AGENTS.md - Developer Guide

Astro 5.x SSR blog with Alpine.js, Tailwind CSS 4.x, TypeScript strict mode, Zod content validation.

## Tech Stack

- **Framework**: Astro 5.17+ with Node adapter (SSR)
- **Package Manager**: pnpm
- **Language**: TypeScript (strict mode, `astro/tsconfigs/strict`)
- **UI**: Astro + Alpine.js + Tailwind CSS 4.x
- **Content**: Astro Content Collections + Zod
- **Storybook**: @storybook/html-vite 8.6.14

## Commands

```bash
pnpm dev               # Start dev server (http://localhost:4321)
pnpm build             # Build for production
pnpm preview           # Preview production build
pnpm astro check       # Type-check with Astro
pnpm storybook         # Start Storybook (http://localhost:6010)
pnpm build-storybook   # Build Storybook static export
```

### Testing

To add Vitest:
```bash
pnpm add -D vitest @vitest/ui
pnpm vitest run <file>   # Run single test
pnpm vitest <file>       # Watch mode
```

## Code Style Guidelines

### General Principles
- Use TypeScript strictly; avoid JavaScript unless necessary
- Prefer minimal, safe changes over large refactors
- Follow existing project structure and coding style
- Chinese comments for documentation
- No ESLint/Prettier - use standard formatting

### Import Organization
```typescript
// External libraries
import { defineCollection, z } from 'astro:content'
import { glob } from 'astro/loaders'

// Internal imports (use @ alias for src/)
import { cn } from '@/lib/utils'
import type { Post } from '@/types'
```

### Naming Conventions
- **Components**: PascalCase (`BlogItem.astro`, `Layout.astro`)
- **Pages**: kebab-case (`blog/index.astro`)
- **Types/Interfaces**: PascalCase (`PostListItem`, `CategoryData`)
- **Variables/Functions**: camelCase (`getPostList`, `userName`)
- **Constants**: UPPER_SNAKE_CASE (`API_ENDPOINT`, `MAX_ITEMS`)

### TypeScript Guidelines
- Always define return types for functions
- Use `import type` for type-only imports
- Avoid `any`; use `unknown` for truly unknown types
- Use `z.coerce.date()` for date parsing

```typescript
async function getPosts(): Promise<PostListItem[]> { }
```

### Astro Component Patterns
- Define props interfaces in frontmatter
- Use Alpine.js (`x-data`, `@click`, etc.) for interactivity
- Client scripts in `/src/alpine-components.js`

```astro
---
// 组件注释（中文）
interface Props { title?: string; isExpanded?: boolean }
const { title = "默认标题", isExpanded = false } = Astro.props
---

<div class={cn("card", isExpanded && "expanded")} x-data="{ show: false }">
  <h2>{title}</h2>
  <button @click="show = !show">Toggle</button>
</div>
```

### Tailwind CSS
- Use `cn()` from `@/lib/utils` for conditional classes
- Mobile-first responsive design
- Dark mode: use `dark:` prefix (enabled by default)

```typescript
<div class={cn("base-class p-4", isActive && "active-class", "hover:shadow-lg dark:bg-gray-800")} />
```

### Content Collections
- Define schemas in `src/content.config.ts` with Zod
- Store posts in `src/content/posts/`, categories in `src/content/categories/`
- Use `glob()` loader for markdown files

```typescript
const posts = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/posts' }),
  schema: z.object({ title: z.string(), publishDate: z.coerce.date(), category: z.string() }),
})
```

### Error Handling
- Use try/catch for async operations
- Return typed error results (pattern: `{ data, error }`)
- Log errors without sensitive data

```typescript
async function fetchData(): Promise<{ data: Post[], error: string | null }> {
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
- Register components in `src/alpine-components.js`
- Use Alpine for state management and simple interactivity
- Keep logic small and testable

```javascript
document.addEventListener('alpine:init', () => {
  Alpine.data('modal', () => ({ isOpen: false, open() { this.isOpen = true }, close() { this.isOpen = false } }))
})
```

## Project Structure

```
src/
├── components/         # Astro UI components
├── layouts/           # Page layouts
├── pages/             # File-based routing
├── stories/           # Storybook stories
├── lib/               # Config and utils
├── types/             # TypeScript definitions
├── styles/            # Global CSS
├── content/           # Markdown content (posts, categories)
└── alpine-components.js  # Alpine.js data

.storybook/             # Storybook config
```

## Environment Variables

`.env` file:
- `PUBLIC_APP_VERSION` - App version
- `PUBLIC_AUTHOR` - Author name
- `PUBLIC_SITE_URL` - Site URL
- `ADMIN_USERNAME` - Admin username
- `GITHUB_NAME` - GitHub username

Access via `import.meta.env.VARIABLE_NAME`

## Additional Notes

- Dark mode enabled by default (add `class="dark"` to `<html>`)
- Alpine.js handles all client-side interactivity
- No framework testing configured
- Uses Lucide React for icons
- JSX configured for React compatibility

## Storybook

Stories in `src/stories/` use `@storybook/html-vite`:
```typescript
export default { title: 'Components/MyComponent', tags: ['autodocs'] }
export const Default = { args: { /* props */ }, render: (args) => `<!-- HTML -->` }
```
