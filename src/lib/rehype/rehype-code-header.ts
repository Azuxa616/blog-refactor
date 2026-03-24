// 自定义 rehype 插件：为代码块添加 header（语言标签 + 复制按钮）
import { visit } from 'unist-util-visit'
import type { Root, Element } from 'mdast'

export default function rehypeCodeHeader() {
  return (tree: Root) => {
    visit(tree, 'element', (node: Element) => {
      // 处理 pre 元素
      if (node.tagName === 'pre' && node.children[0]?.tagName === 'code') {
        const codeNode = node.children[0]

        // 获取语言类型
        const className = codeNode.properties?.className || []
        const langClass = Array.isArray(className)
          ? className.find((c: string) => c.startsWith('language-'))
          : null
        const lang = langClass
          ? langClass.replace('language-', '')
          : 'plaintext'

        // 创建 header
        const header = {
          type: 'element',
          tagName: 'div',
          properties: {
            className: ['code-header'],
          },
          children: [
            // 语言标签
            {
              type: 'element',
              tagName: 'span',
              properties: {
                className: ['code-lang'],
              },
              children: [
                {
                  type: 'text',
                  value: lang,
                },
              ],
            },
            // 复制按钮
            {
              type: 'element',
              tagName: 'button',
              properties: {
                className: ['code-copy-btn'],
                type: 'button',
                'aria-label': '复制代码',
              },
              children: [
                {
                  type: 'element',
                  tagName: 'svg',
                  properties: {
                    xmlns: 'http://www.w3.org/2000/svg',
                    width: '16',
                    height: '16',
                    viewBox: '0 0 24 24',
                    fill: 'none',
                    stroke: 'currentColor',
                    'stroke-width': '2',
                    'stroke-linecap': 'round',
                    'stroke-linejoin': 'round',
                  },
                  children: [
                    {
                      type: 'element',
                      tagName: 'rect',
                      properties: {
                        x: '9',
                        y: '9',
                        width: '13',
                        height: '13',
                        rx: '2',
                        ry: '2',
                      },
                      children: [],
                    },
                    {
                      type: 'element',
                      tagName: 'path',
                      properties: {
                        d: 'M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1',
                      },
                      children: [],
                    },
                  ],
                },
              ],
            },
          ],
        }

        // 将 header 插入到 pre 元素的开头
        node.children.unshift(header)

        // 添加 data-code-block 属性以便于选择
        node.properties = node.properties || {}
        node.properties.className = ['code-block']
      }
    })
  }
}
