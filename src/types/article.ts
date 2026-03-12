import type { BaseEntity } from './common';

// 文章状态枚举
export enum ArticleStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
}

// 文章接口
export interface Article extends BaseEntity {
  title: string;
  content: string;
  excerpt?: string;
  coverImage?: string;
  category: string;
  tags: string[];
  isRepost: boolean;
  originalAuthor?: string;
  originalLink?: string;
  status: ArticleStatus;
  publishDate: Date;
  updatedDate?: Date;
}
