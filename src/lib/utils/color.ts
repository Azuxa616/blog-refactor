/**
 * 颜色处理工具函数
 * 用于颜色转换、亮度计算和对比度判断
 */

/**
 * 将 16 进制颜色转换为 RGB 数组
 * @param hex - 16 进制颜色值，如 "#f1f5f9" 或 "#fff"
 * @returns RGB 数组 [r, g, b]，范围 0-255
 */
export function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? [
        parseInt(result[1], 16),
        parseInt(result[2], 16),
        parseInt(result[3], 16),
      ]
    : [241, 245, 249]
}

/**
 * 计算颜色的亮度（基于 sRGB 亮度公式）
 * @param r - 红色值，范围 0-255
 * @param g - 绿色值，范围 0-255
 * @param b - 蓝色值，范围 0-255
 * @returns 亮度值，范围 0-1
 */
export function calculateLuminance(r: number, g: number, b: number): number {
  const a = [r, g, b].map((v) => {
    v /= 255
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
  })
  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722
}

/**
 * 根据背景色自动计算最佳对比度文本颜色
 * @param bgColor - 背景颜色（16 进制格式）
 * @returns 对比度文本颜色，深色背景返回白色，浅色背景返回深色
 */
export function getContrastTextColor(bgColor: string): string {
  const [r, g, b] = hexToRgb(bgColor)
  const luminance = calculateLuminance(r, g, b)
  return luminance > 0.5 ? '#1e293b' : '#ffffff'
}

/**
 * 将 16 进制颜色转换为 RGBA 格式
 * @param hex - 16 进制颜色值
 * @param alpha - 透明度，范围 0-1
 * @returns RGBA 字符串，如 "rgba(241, 245, 249, 0.2)"
 */
export function toRgba(hex: string, alpha: number): string {
  const [r, g, b] = hexToRgb(hex)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

/**
 * 为暗色模式计算文本颜色
 * @param luminance - 亮度值
 * @returns 暗色模式文本颜色
 */
export function getDarkModeTextColor(luminance: number): string {
  return luminance > 0.5 ? '#e2e8f0' : '#cbd5e1'
}
