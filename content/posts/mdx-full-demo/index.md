---
title: "MDX 完整功能演示"
slug: mdx-full-demo
path: site/mdx-full-demo
sourcePath: "Blog/站务/mdx-full-demo.md"
description: "展示博客的所有 MDX 功能，包括自定义插件、数学公式、emoji 等"
publishDate: 2026-03-14T00:00:00.000Z
coverImage: /blog-images/mdx-demo-bg.png
---

# MDX 完整功能演示

这是一篇使用方案三配置的 MDX 示例文章，展示了所有增强功能。

## 基础功能

### 文本样式

- **粗体文本**
- *斜体文本*
- ***强调文本***
- ~~删除线~~
- `行内代码`
- [链接示例](https://docs.astro.build)

### 列表

#### 无序列表

- 项目一
- 项目二
  - 子项目一
  - 子项目二
- 项目三

#### 有序列表

1. 第一项
2. 第二项
3. 第三项

#### 任务列表

- [x] 已完成的任务
- [ ] 待完成的任务
- [ ] 另一个任务

### 表格

| 功能 | Markdown | MDX |
|------|----------|------|
| 纯文本 | ✅ | ✅ |
| 组件 | ❌ | ✅ |
| 交互 | ❌ | ✅ |
| 数学公式 | ❌ | ✅ |

### 引用块

> 这是一个引用块。
>
> 可以有多行内容。

---

## 代码高亮

### JavaScript

```javascript
function greet(name) {
  return `Hello, ${name}!`;
}

console.log(greet('World'));
```

### TypeScript

```typescript
interface User {
  name: string;
  age: number;
}

const user: User = {
  name: 'Alice',
  age: 25
};
```

### Python

```python
def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n-1) + fibonacci(n-2)

print(fibonacci(10))
```

### Bash

```bash
# 创建新目录
mkdir my-project

# 进入目录
cd my-project

# 初始化项目
npm init -y
```

---

## 数学公式

### 行内公式

著名的质能方程是 $E=mc^2$。

勾股定理：$a^2 + b^2 = c^2$

### 块级公式

欧拉公式：

$$
e^{i\pi} + 1 = 0
$$

微积分基本定理：

$$
\int_a^b f(x)dx = F(b) - F(a)
$$

矩阵运算：

$$
\begin{pmatrix}
a & b \\
c & d
\end{pmatrix}
\begin{pmatrix}
x \\
y
\end{pmatrix}
=
\begin{pmatrix}
ax + by \\
cx + dy
\end{pmatrix}
$$

求和公式：

$$
\sum_{i=1}^{n} i = \frac{n(n+1)}{2}
$$

---

## Callouts（提示框）

> [!NOTE]  
> 这是一条 **NOTE（注意）** 提示信息。  
> 可以包含多行内容。

> [!TIP]  
> 这是一条 **TIP（提示）** 建议。  
> 💡 使用这个技巧可以提高效率。

> [!IMPORTANT]  
> 这是一条 **IMPORTANT（重要）** 信息。  
> ⭐ 请务必注意这个细节。

> [!WARNING]  
> 这是一条 **WARNING（警告）**。  
> ⚠️ 操作前请仔细阅读文档。

> [!CAUTION]  
> 这是一条 **CAUTION（危险）** 提示。  
> 🔴 这个操作可能会导致数据丢失。

---

## Emoji 支持

### 基本表情

- :smile: → 😊
- :heart: → ❤️
- :rocket: → 🚀
- :zap: → ⚡
- :fire: → 🔥
- :star: → ⭐
- :check_mark: → ✅
- :x: → ❌

### 技术相关

- :computer: → 💻
- :code: → 💻
- :bug: → 🐛
- :gear: → ⚙️
- :database: → 🗄️
- :cloud: → ☁️

### 其他

:party_popper: 🎉 :confetti_ball: 🎊 :tada: 🎉

---

## 目录功能

这篇文章会自动生成目录，包含 h2 和 h3 标题。目录会显示在文章右侧（在桌面端）。

## 定义列表

术语  
: 术语的定义

另一个术语  
: 这个术语的详细解释  
  可以有多行

---

## 自定义组件示例

在 MDX 中可以导入和使用 Astro 组件。

## 嵌套内容

# 一级标题

## 二级标题

### 三级标题

#### 四级标题

##### 五级标题

###### 六级标题

---

## 分割线

上面的分割线是由三个破折号创建的。

---

## 外部链接

这个链接会自动添加 `target="_blank"` 和 `rel="noopener noreferrer"`：  
[访问 Astro 官网](https://astro.build)

内部链接不会在新标签页打开：[首页](/)

---

## 总结

这篇示例文章展示了方案三的所有功能：

1. ✅ **MDX 支持** - 可以在 Markdown 中使用 JSX
2. ✅ **代码高亮** - Shiki 支持，支持多种语言
3. ✅ **GitHub Flavored Markdown** - 表格、任务列表、删除线等
4. ✅ **数学公式** - KaTeX 渲染 LaTeX 公式
5. ✅ **Callouts** - 自定义提示框插件
6. ✅ **Emoji** - 支持 emoji 快捷码
7. ✅ **自动目录** - 自动生成文章目录
8. ✅ **锚点链接** - 标题自动添加可点击的锚点
9. ✅ **外部链接处理** - 自动添加 target="_blank"
10. ✅ **HTML 压缩** - 构建时优化输出

---

### 更多资源

- [Astro MDX 文档](https://docs.astro.build/en/guides/integrations-guide/mdx)
- [Shiki 代码高亮](https://shiki.style/)
- [KaTeX 数学公式](https://katex.org/)
- [GitHub Flavored Markdown](https://github.github.com/gfm/)

:wave: 感谢阅读！
