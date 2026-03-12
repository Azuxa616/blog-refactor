import type { ApiResponse, PaginatedResponse } from './common';

// API 端点类型
export interface ApiEndpoints {
  articles: string;
  categories: string;
  upload: string;
  health: string;
  login: string;
}

// 文章 API 参数
export interface ArticleApiParams {
  page?: number;
  limit?: number;
  category?: string;
  tags?: string[];
  search?: string;
}

// 分类 API 参数
export interface CategoryApiParams {
  page?: number;
  limit?: number;
  sort?: 'name' | 'articleCount';
}

// 登录请求
export interface LoginRequest {
  username: string;
  password: string;
}

// 登录响应
export interface LoginResponse {
  success: boolean;
  token?: string;
  user?: {
    id: string;
    username: string;
    createdAt: string;
  };
  error?: string;
}

// GitHub API 响应类型
export interface GitHubUser {
  id: number;
  login: string;
  name: string;
  avatar_url: string;
  bio: string | null;
  followers: number;
  following: number;
  public_repos: number;
}

export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  updated_at: string;
  created_at: string;
  language: string | null;
  license: {
    name: string;
    spdx_id: string;
  } | null;
  stargazers_count: number;
  watchers_count: number;
  forks_count: number;
  open_issues_count: number;
}

// 类型导出
export type {
  ApiResponse,
  PaginatedResponse,
};
