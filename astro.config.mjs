// @ts-check
import { defineConfig } from 'astro/config'
import tailwindcss from '@tailwindcss/vite'
import vercel from '@astrojs/vercel'
import alpinejs from '@astrojs/alpinejs'
import react from '@astrojs/react'
import mdx from '@astrojs/mdx'
import rehypeSlug from 'rehype-slug'
import rehypeAutolinkHeadings from 'rehype-autolink-headings'
import rehypeExternalLinks from 'rehype-external-links'
import rehypeKatex from 'rehype-katex'
import remarkMath from 'remark-math'
import remarkToc from 'remark-toc'
import remarkGfm from 'remark-gfm'
import remarkEmoji from 'remark-emoji'
import remarkCallout from './src/lib/remark/remark-callout.ts'
import rehypeCodeHeader from './src/lib/rehype/rehype-code-header.ts'
import rehypeImageZoom from './src/lib/rehype/rehype-image-zoom.ts'
import rehypeMermaidLite from 'rehype-mermaid-lite'

// https://astro.build/config
export default defineConfig({
  markdown: {
    syntaxHighlight: {
      excludeLangs: ['mermaid'],
    },
    // .md 与 .mdx 共用完整内容处理管线。
    remarkPlugins: [
      remarkMath, // 数学公式支持（必须在 remarkGfm 之前）
      remarkGfm, // GitHub Flavored Markdown
      remarkEmoji, // Emoji 支持
      remarkCallout, // 自定义 Callout 插件
      [
        remarkToc,
        {
          heading: '目录', // 目录标题
          maxDepth: 3, // 最大深度
          tight: true, // 紧凑模式
        },
      ],
    ],
    rehypePlugins: [
      rehypeMermaidLite,
      rehypeSlug, // 为标题添加 id
      [
        rehypeAutolinkHeadings,
        {
          behavior: 'append', // 在标题后添加链接
          properties: {
            className: ['anchor-link'],
            ariaLabel: '跳转到此章节',
          },
        },
      ],
      [
        rehypeExternalLinks,
        {
          target: '_blank',
          rel: ['noopener', 'noreferrer'],
        },
      ],
      rehypeCodeHeader, // 代码块 header 插件
      rehypeImageZoom, // 标记文章内图片为可放大
      rehypeKatex, // 数学公式渲染
    ],
  },
  output: 'server',
  adapter: vercel(),
  integrations: [
    react(),
    alpinejs({ entrypoint: '/src/alpine-entrypoint.js' }),
    mdx({
      // 代码高亮配置；插件继承顶层 markdown 配置。
      syntaxHighlight: 'shiki',
      shikiConfig: {
        theme: 'github-dark',
      },
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        '@': new URL('./src', import.meta.url).pathname,
      },
    },
    server: {
      middlewareMode: false,
    },
  },
})
