// 文章展示与分页类型。
// Content Collection 的权威类型由 src/content.config.ts 生成。

export interface PostData {
  title: string
  slug: string
  path?: string
  sourcePath?: string
  needsMeta?: boolean
  description: string
  publishDate: Date
  updatedDate?: Date
  coverImage?: string
  isRepost?: boolean
  originalAuthor?: string
  originalLink?: string
}

export interface PostListItem {
  slug: string
  path: string
  title: string
  description: string
  publishDate: Date
  sectionName?: string
  coverImage?: string
  isRepost?: boolean
  originalAuthor?: string
  originalLink?: string
}

export interface PostFilterParams {
  path?: string
  search?: string
  sortBy?: 'latest' | 'popular'
}

export interface PaginationParams {
  page: number
  limit: number
}

export interface PaginationResult<T> {
  items: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}
