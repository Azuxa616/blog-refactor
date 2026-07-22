# 本地 E2E 巡检测试用例清单

| 元数据 | 值 |
| --- | --- |
| 测试清单版本 | v1 |
| 最后修改时间 | 2026-07-22T01:22:28+08:00 |
| 基线分支 | `codex/e2e-test-fix` |
| 基线提交 | `59d1bd8063a5040cc5e0767d48f0b8b29c3a6b2f` |
| 服务模式 | 本地生产构建与预览 |
| 视口 | 桌面 `1440×900`；手机 `390×844` |

## 严重级别

`P0` 空白、不可达或崩溃的路由；`P1` 已实现交互失效；`P2` Markdown/MDX 渲染或图片加载失败；`P3` 明显 UX 问题；`P4` 性能问题。

## 用例

| 测试 ID | 页面/组件 | 前置条件 | 操作 | 预期结果 | 级别 |
| --- | --- | --- | --- | --- | --- |
| TC-ENV-01 | 构建与预览 | 依赖已安装 | 运行生产构建并启动本地预览 | 构建成功，预览服务可访问 | P0 |
| TC-ROUTE-01 | `/` | 服务已启动 | 在两种视口访问首页 | 页面非空白、无未处理错误、首屏内容可见 | P0 |
| TC-ROUTE-02 | `/articles` | 服务已启动 | 在两种视口访问文章列表 | 页面非空白、文章列表或空状态可见 | P0 |
| TC-ROUTE-03 | `/about` | 服务已启动 | 在两种视口访问关于页 | 页面非空白、正文可读 | P0 |
| TC-ROUTE-04 | `/links` | 服务已启动 | 通过主导航访问友链 | 存在可用目标页，不能返回 404 或空白 | P0 |
| TC-ROUTE-05 | 不存在路由与文章 | 服务已启动 | 访问随机路径和 `/articles/not-found` | 返回可理解的非空错误页，不出现应用崩溃 | P0 |
| TC-GLOBAL-01 | `HeaderBar`、`NavLinkButton` | 任一页面已加载 | 点击首页、文章、关于、友链导航项 | 链接目标与导航标签一致，路由跳转完成 | P0 |
| TC-GLOBAL-02 | `FloatingActionButton` 主题切换 | 任一页面已加载 | 切换主题，跳转到另一页面 | 主题外观切换且跨路由保持 | P1 |
| TC-GLOBAL-03 | `FloatingActionButton` 回顶 | 页面高度超过视口 | 向下滚动后点击回顶按钮 | 按钮出现，页面平滑回到顶部 | P1 |
| TC-HOME-01 | `HeroSection`、`Typewriter` | 首页已加载 | 等待文字动画至少一个切换周期 | 背景、标题、打字机文本与光标可见且持续变化 | P1 |
| TC-HOME-02 | `FooterBar` | 首页已加载 | 滚动至底部 | 页脚可见，文字和背景保持可读 | P3 |
| TC-LIST-01 | `ImageHeaderBar`、列表布局 | 文章页已加载 | 检查头图、标题、搜索与分类区 | 图像可见，控件不重叠、不溢出 | P2 |
| TC-LIST-02 | 文章搜索 | 文章页已加载 | 搜索已知关键词，再搜索无匹配关键词 | URL 保留查询；命中结果正确；无匹配时显示空状态 | P1 |
| TC-LIST-03 | `CategoryFilter` | 文章页已加载 | 逐一点击 `tech`、`life`、`site` 并重置 | URL 与文章集合同步，重置恢复全部结果 | P1 |
| TC-LIST-04 | `BlogItem` | 文章页已加载 | 打开所有文章卡片目标 | 5 个链接可达；卡片封面、日期、分类均可见 | P0 |
| TC-LIST-05 | `Pagination` | 当前内容固定为 5 篇 | 检查文章列表底部 | 不显示分页控件；记录为当前阈值未激活，不将点击行为记为通过 | P3 |
| TC-ART-01 | `/articles/2024-review` | 服务已启动 | 在两种视口打开文章 | 头图、元数据、标签与 Markdown 正文正常渲染 | P0 |
| TC-ART-02 | `/articles/astro-alpine-best-practices` | 服务已启动 | 在两种视口打开文章 | 头图、元数据、标签与 Markdown 正文正常渲染 | P0 |
| TC-ART-03 | `/articles/example-post-with-images` | 服务已启动 | 在两种视口打开文章并检查本地相对图片 | 图片无破损，Markdown 不以源码形式露出 | P2 |
| TC-ART-04 | `/articles/hello-world` | 服务已启动 | 在两种视口打开文章并检查外部图片 | 正文可读；外部图片成功加载或清楚记录外部依赖失败 | P2 |
| TC-ART-05 | `/articles/mdx-full-demo` | 服务已启动 | 在两种视口打开文章 | MDX 内容、标题、标签和正文正常渲染 | P0 |
| TC-MDX-01 | Markdown/MDX 插件链 | `mdx-full-demo` 已加载 | 检查锚点、代码高亮、数学公式、表格、emoji、Callout、Mermaid、外链 | 全部以对应 HTML/视觉组件渲染，不露出源码 | P2 |
| TC-MDX-02 | 代码复制 | 含代码块文章已加载 | 点击任一复制按钮并观察反馈 | 按钮显示已复制反馈，约 2 秒后恢复 | P1 |
| TC-RES-01 | 全站图片与静态图标 | 全部可达页面已遍历 | 检查渲染图片的请求与尺寸 | 本地资源无 4xx/5xx 或破损图；外部资源失败单独标注 | P2 |
| TC-UX-01 | 桌面视觉巡检 | `1440×900` | 遍历可达页面与交互状态 | 无明显遮挡、低对比、超出视口或难以点击的控件 | P3 |
| TC-UX-02 | 移动端视觉巡检 | `390×844` | 遍历可达页面与交互状态 | 无横向溢出、导航/悬浮按钮不遮挡主要内容 | P3 |
| TC-PERF-01 | 加载与路由跳转 | 生产预览已启动 | 记录首次访问与导航的时间、异常资源 | 无持续超过 3 秒的交互阻塞；明显大资源或慢跳转记录为 P4 | P4 |

## 覆盖说明

- 当前公开页面实际挂载：全局 React `AppLayout`、`HeaderBar`、`NavLinkButton`、`FloatingActionButton`；首页 `HeroSection`、`Typewriter`、`FooterBar`；文章列表 `ImageHeaderBar`、`CategoryFilter`、`BlogItem`；文章详情 `ArticleCoverImage`、`CategoryBadge`、`Tag` 与 Markdown/MDX 插件链。
- `Pagination` 在当前 5 篇文章下未挂载交互控件，按 TC-LIST-05 记录阈值状态。
- `GithubSection` 及其子组件、`Modal`、`CategoryCard`、所有骨架屏、未由页面挂载的 Alpine/React 双实现不进入本次 E2E 结果；其原因是当前公开路由未调用。功能实际挂载后需创建新版本用例。

## 运行目录约定

- 首次运行目录为 `test/e2e-test-run-YYYY-MM-DD/`；同日再次运行追加 `-02`、`-03`，避免覆盖证据。
- 失败截图置于 `evidence/TC-<ID>.png`，并从结果表的“测试情况”列以相对路径链接。
