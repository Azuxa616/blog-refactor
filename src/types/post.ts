// src/types/post.ts
// 文章相关类型定义
// 添加中文注释

/**
 * 文章数据接口
 * 基于 Astro Content Collection 的文章类型
 */
export interface Post {
  slug: string;
  data: PostData;
  render: () => Promise<{ Content: any }>;
}

/**
 * 文章元数据接口
 * 对应 Content Collection 的 schema
 */
export interface PostData {
  title: string;
  description: string;
  publishDate: Date;
  updatedDate?: Date;
  category: string;
  tags: string[];
  coverImage?: string;
  isRepost?: boolean;
  originalAuthor?: string;
  originalLink?: string;
}

/**
 * 分类数据接口
 * 基于 Astro Content Collection 的分类类型
 */
export interface Category {
  name: string;
  slug: string;
  description?: string;
  color: string;
}

/**
 * 分类统计接口
 * 包含文章数量的分类
 */
export interface CategoryWithCount extends Category {
  articleCount: number;
}

/**
 * 文章列表项接口
 * 用于文章列表页面的展示
 */
export interface PostListItem {
  slug: string;
  title: string;
  description: string;
  publishDate: Date;
  category: string;
  categoryName?: string;
  categoryColor?: string;
  tags: string[];
  coverImage?: string;
  isRepost?: boolean;
  originalAuthor?: string;
  originalLink?: string;
}

/**
 * 文章筛选参数接口
 */
export interface PostFilterParams {
  category?: string;
  search?: string;
  tags?: string[];
  sortBy?: 'latest' | 'popular';
}

/**
 * 分页参数接口
 */
export interface PaginationParams {
  page: number;
  limit: number;
}

/**
 * 分页结果接口
 */
export interface PaginationResult<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
