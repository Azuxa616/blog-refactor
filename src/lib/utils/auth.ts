import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { appConfig } from '../config/app';

const AUTH_COOKIE_NAME = 'auth_token';

/**
 * 加密密码
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, appConfig.security.bcryptRounds);
}

/**
 * 验证密码
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * 生成JWT token
 */
export function generateToken(username: string): string {
  const payload = { username };
  const secret = appConfig.jwt.secret;
  
  // 直接传递expiresIn，jwt库会处理类型转换
  return jwt.sign(payload, secret, {
    expiresIn: appConfig.jwt.expiresIn,
  } as jwt.SignOptions);
}

/**
 * 验证JWT token
 */
export function verifyToken(token: string): { username: string } | null {
  try {
    const decoded = jwt.verify(token, appConfig.jwt.secret) as jwt.JwtPayload & { username: string };
    if (decoded && decoded.username) {
      return { username: decoded.username };
    }
    return null;
  } catch (error) {
    console.error('Token验证失败:', error instanceof Error ? error.message : '未知错误');
    return null;
  }
}

/**
 * 从请求中获取token（用于中间件和API路由）
 */
export function getTokenFromCookie(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null;
  
  const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
    const [key, value] = cookie.trim().split('=');
    acc[key] = value;
    return acc;
  }, {} as Record<string, string>);
  
  return cookies[AUTH_COOKIE_NAME] || null;
}
