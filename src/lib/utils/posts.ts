// 文章工具函数
// 用于从 Astro Content Layer 获取文章数据

import { getCollection } from 'astro:content'
import type { CollectionEntry } from 'astro:content'

// 文章数据类型（包含额外字段）
export interface PostWithSlug extends CollectionEntry<'posts'> {
  slug: string
}

// 文章的树形 URL；旧数据尚未同步 path 时沿用 slug。
export function getPostPath(
  post: CollectionEntry<'posts'> | PostWithSlug,
): string {
  return post.data.path || post.data.slug
}

// 获取所有文章（按发布时间降序）
export async function getAllPosts(): Promise<PostWithSlug[]> {
  const posts = await getCollection('posts')
  return posts
    .map((post) => ({
      ...post,
      // 优先使用 frontmatter 中的 slug
      slug:
        post.data.slug ||
        post.id.replace(/\.mdx?$/, '').replace(/\/index$/, ''),
    }))
    .sort((a, b) => b.data.publishDate.valueOf() - a.data.publishDate.valueOf())
}

// 根据完整树形路径获取单篇文章。
export async function getPostByPath(
  path: string,
): Promise<PostWithSlug | undefined> {
  const normalizedPath = path.replace(/^\/+|\/+$/g, '')
  const posts = await getAllPosts()
  return posts.find((post) => getPostPath(post) === normalizedPath)
}

// 旧单段 slug → 当前树形路径（用于 /articles/<旧slug> 永久重定向）。
// 命中条件：post.data.legacySlugs 包含该 slug，或 post.data.slug 等于该 slug
// 但其当前树形 path 已不同（即旧地址已迁移）。
export async function getLegacyRedirectTarget(
  legacySlug: string,
): Promise<string | undefined> {
  const posts = await getAllPosts()
  for (const post of posts) {
    if (post.data.legacySlugs?.includes(legacySlug)) {
      return getPostPath(post)
    }
  }
  for (const post of posts) {
    if (post.data.slug === legacySlug) {
      const currentPath = getPostPath(post)
      if (currentPath !== legacySlug) return currentPath
    }
  }
  return undefined
}

// 搜索文章（根据标题或描述）
export async function searchPosts(
  searchTerm: string,
): Promise<PostWithSlug[]> {
  if (!searchTerm) {
    return getAllPosts()
  }

  const posts = await getAllPosts()
  const term = searchTerm.toLowerCase()

  return posts.filter(
    (post) =>
      post.data.title.toLowerCase().includes(term) ||
      post.data.description.toLowerCase().includes(term),
  )
}

// 获取最新文章
export async function getLatestPosts(
  limit: number = 5,
): Promise<PostWithSlug[]> {
  const posts = await getAllPosts()
  return posts.slice(0, limit)
}

// 获取转载文章
export async function getRepostedPosts(): Promise<PostWithSlug[]> {
  const posts = await getAllPosts()
  return posts.filter((post) => post.data.isRepost)
}

// 按日期范围获取文章
export async function getPostsByDateRange(
  startDate: Date,
  endDate: Date,
): Promise<PostWithSlug[]> {
  const posts = await getAllPosts()
  return posts.filter((post) => {
    const publishDate = post.data.publishDate
    return publishDate >= startDate && publishDate <= endDate
  })
}
