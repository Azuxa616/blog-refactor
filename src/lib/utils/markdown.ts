// 描述文本清洗工具
// 去除 Markdown 语法，生成可读的纯文本摘要（用于首页/列表卡片展示）

export function stripMarkdown(text: string): string {
  if (!text) return text
  return text
    // 行内代码 `code` -> code
    .replace(/`([^`]*)`/g, '$1')
    // 图片 ![alt](url) -> alt
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    // 链接 [text](url) -> text
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    // 加粗/斜体
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    // 标题符号
    .replace(/^#{1,6}\s+/gm, '')
    // 引用符号 > (行首与行中)
    .replace(/^\s*>\s?/gm, '')
    .replace(/>/g, ' ')
    // 列表符号：- / * / + / 数字.
    .replace(/^\s*([-*+]|\d{1,2}\.)\s+/gm, '')
    .replace(/\s[-*+]\s/g, ' ')
    // 分割线 --- / *** / ___
    .replace(/^\s*([-*_])\1{2,}\s*$/gm, ' ')
    .replace(/---+/g, ' ')
    // 压缩空白
    .replace(/[ \t]+/g, ' ')
    .replace(/\s*\n\s*/g, ' ')
    .trim()
}
