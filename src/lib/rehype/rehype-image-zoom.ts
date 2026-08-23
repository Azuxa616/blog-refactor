// 自定义 rehype 插件：为文章正文内的 img 元素标记可放大属性
import { visit } from 'unist-util-visit'

interface HastNode {
  type: string
}

interface HastElement extends HastNode {
  type: 'element'
  tagName: string
  properties?: Record<string, unknown>
  children: Array<HastElement | HastNode>
}

interface HastRoot extends HastNode {
  type: 'root'
  children: Array<HastElement | HastNode>
}

export default function rehypeImageZoom() {
  return (tree: HastRoot) => {
    visit(tree, 'element', (node) => {
      // 仅处理 img 元素
      if (node.tagName !== 'img') return

      const properties = node.properties || {}
      const existingClassNames = properties.className
      const classNames = Array.isArray(existingClassNames)
        ? existingClassNames.map(String)
        : typeof existingClassNames === 'string'
          ? existingClassNames.split(' ')
          : []

      node.properties = {
        ...properties,
        dataZoomable: true,
        className: [...new Set([...classNames, 'zoomable-img'])],
      }
    })
  }
}
