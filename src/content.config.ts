import { defineCollection } from 'astro:content'
import { glob } from 'astro/loaders'
import { z } from 'astro/zod'

const posts = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './content/posts' }),
  schema: z.object({
    title: z.string(),
    slug: z.string(),
    path: z.string().optional(),
    sourcePath: z.string().optional(),
    needsMeta: z.boolean().optional(),
    description: z.string(),
    publishDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    // 仅为兼容旧 frontmatter 保留，不再用于展示或路由。
    category: z.string().optional(),
    tags: z.array(z.string()).optional(),
    coverImage: z.string().optional(),
    isRepost: z.boolean().default(false),
    legacySlugs: z.array(z.string()).optional(),
    originalAuthor: z.string().optional(),
    originalLink: z.string().optional(),
  }),
})

export const collections = { posts }
