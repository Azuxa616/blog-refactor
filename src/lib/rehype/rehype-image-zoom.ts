// 自定义 rehype plugin：为文章正文内的 img 元素标记可放大属性
import { visit } from 'unist-util-visit'
import type { Element, Root } from 'hast'

export default function rehypeImageZoom() {
  return (tree: Root) => {
    visit(tree, 'element', (node: Element) => {
      // 仅处理 img 元素
      if (node.tagName !== 'img') return

      const properties = node.properties || {}
      // hast 类型中 className 为只读数组；防御性兼容字符串形态
      const existingClassNames = properties.className as
        | ReadonlyArray<string | number>
        | string
        | undefined
      const classNames: string[] = Array.isArray(existingClassNames)
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
