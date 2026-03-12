// 文章工具函数
// 用于从 Astro Content Layer 获取文章数据

import { getCollection } from 'astro:content';
import type { CollectionEntry } from 'astro:content';

// 文章数据类型（包含额外字段）
export interface PostWithSlug extends CollectionEntry<'posts'> {
  slug: string;
}

// 获取所有文章（按发布时间降序）
export async function getAllPosts(): Promise<PostWithSlug[]> {
  const posts = await getCollection('posts');
  return posts.map(post => ({
    ...post,
    slug: post.id.replace('.md', ''),
  })).sort((a, b) =>
    b.data.publishDate.valueOf() - a.data.publishDate.valueOf()
  );
}

// 根据 slug 获取单篇文章
export async function getPostBySlug(slug: string): Promise<PostWithSlug | undefined> {
  const posts = await getCollection('posts');
  const post = posts.find(post => post.id === `${slug}.md`);
  if (post) {
    return {
      ...post,
      slug: post.id.replace('.md', ''),
    };
  }
  return undefined;
}

// 根据分类 slug 获取文章列表
export async function getPostsByCategory(categorySlug: string): Promise<PostWithSlug[]> {
  const posts = await getAllPosts();
  return posts.filter(post => post.data.category === categorySlug);
}

// 根据标签 slug 获取文章列表
export async function getPostsByTag(tagSlug: string): Promise<PostWithSlug[]> {
  const posts = await getAllPosts();
  return posts.filter(post => post.data.tags.includes(tagSlug));
}

// 搜索文章（根据标题或描述）
export async function searchPosts(searchTerm: string): Promise<PostWithSlug[]> {
  if (!searchTerm) {
    return getAllPosts();
  }
  
  const posts = await getAllPosts();
  const term = searchTerm.toLowerCase();
  
  return posts.filter(post =>
    post.data.title.toLowerCase().includes(term) ||
    post.data.description.toLowerCase().includes(term)
  );
}

// 获取相关文章（基于分类）
export async function getRelatedPosts(
  currentPostSlug: string,
  categorySlug: string,
  limit: number = 3
): Promise<PostWithSlug[]> {
  const posts = await getPostsByCategory(categorySlug);
  return posts
    .filter(post => post.slug !== currentPostSlug)
    .slice(0, limit);
}

// 获取最新文章
export async function getLatestPosts(limit: number = 5): Promise<PostWithSlug[]> {
  const posts = await getAllPosts();
  return posts.slice(0, limit);
}

// 获取转载文章
export async function getRepostedPosts(): Promise<PostWithSlug[]> {
  const posts = await getAllPosts();
  return posts.filter(post => post.data.isRepost);
}

// 按日期范围获取文章
export async function getPostsByDateRange(
  startDate: Date,
  endDate: Date
): Promise<PostWithSlug[]> {
  const posts = await getAllPosts();
  return posts.filter(post => {
    const publishDate = post.data.publishDate;
    return publishDate >= startDate && publishDate <= endDate;
  });
}
