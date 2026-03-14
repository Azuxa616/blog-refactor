// 自定义 remark 插件：支持 GitHub 风格的 Callouts（提示框）
// 语法：> [!TYPE] 内容
// 支持的类型：NOTE, TIP, IMPORTANT, WARNING, CAUTION

import { visit } from 'unist-util-visit';
import type { Root } from 'mdast';

export default function remarkCallout() {
  return (tree: Root) => {
    visit(tree, 'blockquote', (node) => {
      const firstChild = node.children[0];
      if (
        firstChild &&
        firstChild.type === 'paragraph' &&
        firstChild.children[0]?.type === 'text'
      ) {
        const text = firstChild.children[0].value;
        const match = text.match(/^\[!(\w+)\]\s*/);

        if (match) {
          const type = match[1].toLowerCase();
          const calloutTypes: Record<string, { color: string; icon: string; label: string }> = {
            note: { color: 'blue', icon: 'ℹ️', label: '注意' },
            tip: { color: 'green', icon: '💡', label: '提示' },
            important: { color: 'purple', icon: '⭐', label: '重要' },
            warning: { color: 'yellow', icon: '⚠️', label: '警告' },
            caution: { color: 'red', icon: '🔴', label: '危险' },
          };

          const config = calloutTypes[type] || calloutTypes.note;
          
          // 移除类型标记
          if (firstChild.children[0]?.type === 'text') {
            firstChild.children[0].value = text.replace(match[0], '');
          }

          // 转换为自定义 HTML 结构
          node.data = {
            hProperties: {
              className: [`callout`, `callout-${config.color}`],
              'data-callout-type': type,
              'data-callout-icon': config.icon,
              'data-callout-label': config.label,
            },
          };
        }
      }
    });
  };
}
