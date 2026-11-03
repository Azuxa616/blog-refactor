import type { BaseEntity } from './common';

// 用户状态
export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  BANNED = 'banned',
}

// 用户角色
export enum UserRole {
  ADMIN = 'admin',
  EDITOR = 'editor',
  USER = 'user',
}

// 用户接口
export interface User extends BaseEntity {
  username: string;
  email: string;
  displayName?: string;
  avatar?: string;
  bio?: string;
  status: UserStatus;
  role: UserRole;
  lastLoginAt?: Date;
}

// 会话接口
export interface Session {
  token: string;
  userId: string;
  username: string;
  expiresAt: Date;
  createdAt: Date;
}

// 权限接口
export interface Permissions {
  canCreatePost: boolean;
  canEditPost: boolean;
  canDeletePost: boolean;
  canManageSections: boolean;
  canManageUsers: boolean;
}

// 认证状态
export interface AuthState {
  isAuthenticated: boolean;
  user?: User;
  permissions?: Permissions;
}

// 刷新令牌请求
export interface RefreshTokenRequest {
  refreshToken: string;
}

// 刷新令牌响应
export interface RefreshTokenResponse {
  success: boolean;
  token?: string;
  refreshToken?: string;
  expiresAt?: Date;
  error?: string;
}
