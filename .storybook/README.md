# Storybook

Storybook 已成功配置并运行在此项目中。

## 启动 Storybook

```bash
pnpm storybook
```

Storybook 将在 `http://localhost:6010` 上运行。

## 构建 Storybook

```bash
pnpm build-storybook
```

构建输出将保存在 `storybook-static/` 目录中。

## 可用的 Stories

- **Example/Button**: 按钮组件示例
- **Example/Typography**: 排版组件示例
- **Components/Card**: 卡片组件示例

## 功能

- ✅ 支持亮色/暗色主题切换
- ✅ Tailwind CSS 样式支持
- ✅ 交互式控件（Controls）
- ✅ 自动文档生成（Docs）
- ✅ 交互测试（Interactions）

## 添加新的 Stories

在 `src/stories/` 目录中创建新的 `.stories.ts` 文件：

```typescript
export default {
  title: 'Category/ComponentName',
  tags: ['autodocs'],
}

export const Default = {
  args: {
    // 组件参数
  },
  render: (args) => {
    return `<!-- HTML 模板 -->`
  },
}
```

## 注意事项

- Storybook 使用 `@storybook/html-vite` 框架
- Tailwind CSS 通过 `src/styles/global.css` 自动导入
- 默认使用暗色主题，可以通过工具栏切换到亮色主题
