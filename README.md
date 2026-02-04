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

- **v0.2.0 (2026-02-)**
  - [Feature] 新增异常管理，实施双层错误处理架构。
  - [Feature] 非预期输入处理，支持 AI 自动拼写纠错与异常输入拦截。
  - [UI] 反馈机制。
