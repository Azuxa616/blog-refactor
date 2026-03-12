// 分类工具函数
// 用于从 Astro Content Layer 获取分类数据

import { getCollection } from 'astro:content';
import type { CollectionEntry } from 'astro:content';

// 分类数据类型（包含文章数量）
export interface CategoryWithCount extends CollectionEntry<'categories'> {
  articleCount: number;
}

// 获取所有分类
export async function getCategories(): Promise<CategoryWithCount[]> {
  const categories = await getCollection('categories');
  const posts = await getCollection('posts');

  return categories.map(cat => ({
    ...cat,
    articleCount: posts.filter(post => post.data.category === cat.data.slug).length,
  }));
}

// 根据 slug 获取单个分类
export async function getCategoryBySlug(slug: string): Promise<CategoryWithCount | undefined> {
  const categories = await getCategories();
  return categories.find(cat => cat.data.slug === slug);
}

// 根据分类名称获取分类
export async function getCategoryByName(name: string): Promise<CategoryWithCount | undefined> {
  const categories = await getCategories();
  return categories.find(cat => cat.data.name === name);
}

// 获取有文章的分类
export async function getActiveCategories(): Promise<CategoryWithCount[]> {
  const categories = await getCategories();
  return categories.filter(cat => cat.articleCount > 0);
}

// 按文章数量排序（降序）
export async function getCategoriesByArticleCount(): Promise<CategoryWithCount[]> {
  const categories = await getCategories();
  return categories.sort((a, b) => b.articleCount - a.articleCount);
}

// 获取最热门的分类（文章数最多的）
export async function getPopularCategories(limit: number = 5): Promise<CategoryWithCount[]> {
  const categories = await getCategoriesByArticleCount();
  return categories.slice(0, limit);
}
