/**
 * 占位渐变生成工具
 * 根据文本种子确定性地映射到固定数量的渐变 key
 */

/** 预定义渐变数量 */
export const PLACEHOLDER_GRADIENT_COUNT = 8

/**
 * 字符串哈希（确定性，无随机性）
 * 同一篇文章始终映射到同一渐变
 */
export function hashSeed(seed: string): number {
  const text = seed || ''
  let hash = 0
  for (let i = 0; i < text.length; i++) {
    hash = (hash << 5) - hash + text.charCodeAt(i)
    hash |= 0 // 转为 32 位整数
  }
  return Math.abs(hash)
}

/**
 * 根据种子返回渐变 key（0..N-1）
 * 空 seed 返回固定 0，不抛异常
 */
export function getPlaceholderGradient(seed: string): number {
  if (!seed) return 0
  return hashSeed(seed) % PLACEHOLDER_GRADIENT_COUNT
}
