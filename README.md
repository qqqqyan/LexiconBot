# LexiconBot

基于 Next.js 和 Dify 工作流 构建的英语词汇深度学习系统。通过 AI 生成跨文化语境模拟，帮助学习者理解单词在西方社会中的实际逻辑和应用潜台词。

https://github.com/user-attachments/assets/9d264b01-64d1-4415-8d9f-be48766f7227

## Getting Started

1. 配置 .env.local 中的 Supabase 和 Dify 密钥。
2. 运行 npm install。
3. 运行 npm run dev。

## Changelog

- **v0.1.0 (2026-02-01)**
  - [Feature] 发布最小可行性产品 (MVP) 版本。
  - [Feature] 集成 Dify API 实现词汇与语境的自动生成。
  - [Infra] 搭建 Supabase 后端。
  - [UI] 完成响应式侧边栏与 Markdown 详情展示。

- **v0.2.0 (2026-02-04)**
  - [Feature] 新增异常管理，实施双层错误处理架构。
  - [Feature] 非预期输入处理，支持 AI 自动拼写纠错与异常输入拦截。
  - [UI] 反馈机制。
  - [Structure] 新增目录存储 Dify 工作流 XML 导出文件。

- **v0.3.0 (2026-02-04)**
  - [Feature] 引入技术模式，针对技术专有名词提供 ELI5 解释、职场场景模拟等。

- **v0.4.0 (2026-02-04)**
  - [Infra] 部署到 Vercel，并控制访问。

- **v0.5.0 (2026-03-05)**
  - [Refactor] 使用 URL 参数支持浏览器记录回溯，构建严格类型的路由管理器，将交互状态与 URL 路由映射。
  - [Refactor] 包含 markdown 的组件迁移至 RSC，提升 FCP。

- **v0.6.0 (2026-03-11)**
  - [Feature] 新增复习 Session 功能，支持序列或者随机选择单词进入复习流程。
  - [Structure] 词汇相关页面迁移至 `(vacab)` 路由组，新增独立 `/review` 路由。
  - [Refactor] 抽取 `WordDetail` 为共享组件，供词汇页与复习页复用。

- **v0.7.0 (2026-03-15)**
  - [Refactor] 拆分 `VocabView` 为 `LeftSidebar`、`RightPanel`、`WordItem` 三层组件边界。
  - [Perf] `WordItem` 引入 `React.memo` + boolean props，checkbox toggle 的 re-render 从 O(n) 降至 O(1)。
  - [Perf] `RightPanel` 引入 `React.memo`，左侧任意状态变化不再触发 `WordDetail` 重绘。
  - [Fix] story fetch effect 补全 stale-closure guard，修复快速切换视图时的竞态问题。
  - [Refactor] loading 状态拆分为 `isLoadingWords` / `isLoadingStories`，消除两个 effect 的状态互踩。
  - [Perf] `filteredWords` 改为 `useMemo`，checkbox toggle 不再触发列表重新过滤。

- **v0.8.0 (2026-03-16)**
  - [Refactor] 拆分 `review/page.tsx`（577行）为 `SetupPanel`、`ReviewPanel`、`SummaryPanel` 三个独立组件，`page.tsx` 缩减为纯 bridge（~88行）。
  - [Refactor] `SetupPanel` 升级为 feature component，自持 `startSessionAction` 与 `fetchVocabListInfoAction`，通过 `onSessionStarted(SessionBridgeData)` 向上交付 session 数据。
  - [Refactor] `ReviewPanel` 内化 `currentIndex`、`isDrawerOpen` 状态，以 `useRef` 累积 results（不触发 re-render），review 结束时一次性通过 `onComplete` 回传。
  - [Refactor] `SummaryPanel` 为纯展示组件，以 `useMemo` 计算统计数据。
  - [Type] 新增 `ReviewResult`、`SessionBridgeData` 类型；移除仅在 `SetupPanel` 内部使用的 `StartConfig`。