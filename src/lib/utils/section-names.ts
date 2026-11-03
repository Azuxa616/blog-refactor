// 目录 slug 的展示名称；未配置的目录保留原名称。
export const SECTION_NAMES: Record<string, string> = {
  interview: '面试',
  notes: '随笔记',
  ai: '人工智能',
  compiler: '编译原理',
  se: '软件工程',
  coa: '计算机组成原理',
  network: '网络基础',
  grad: '考研',
  career: '实习',
  site: '站务',
  js: 'JS',
  react: 'React',
  netbase: '网络基础',
  misc: '其他',
  handwrite: '手撕',
}

export function getSectionName(slug: string): string {
  return SECTION_NAMES[slug] || slug
}
