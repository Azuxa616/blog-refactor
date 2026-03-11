// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import node from '@astrojs/node';
import alpinejs from '@astrojs/alpinejs';

// 定义内容集合（暂时注释，待 astro:content 模块可用）
/*
const { defineCollection, z } = await import('astro/content');

const posts = defineCollection({
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
});

const categories = defineCollection({
  type: 'data',
  schema: z.object({
    name: z.string(),
    slug: z.string(),
    description: z.string().optional(),
    color: z.string(),
  }),
});
*/

// https://astro.build/config
export default defineConfig({
  output: 'server',
  adapter: node({
    mode: 'standalone'
  }),
  integrations: [alpinejs()],
  // contentCollection: {
  //   collections: { posts, categories },
  // },

  vite: {
    plugins: [tailwindcss()]
  }
});