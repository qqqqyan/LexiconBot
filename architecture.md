# Project Architecture Context (AI-Optimized)

## 1. Project Identity & Purpose

> **Instruction**: 定义项目的核心目标。AI 需要知道它在构建什么，以避免生成无关的功能。

* **Project Name**: `LexiconBot`
* **One-sentence Description**: `基于 Next.js 和 Dify 工作流构建的英语词汇深度学习系统，通过 AI 生成跨文化语境模拟，帮助学习者理解单词在西方社会中的实际逻辑和应用潜台词。`
* **Target User**: `英语学习者（尤其是希望理解词汇文化内涵和技术术语的中文母语者）`
* **Core Value Prop**: `解决传统词典只提供释义、缺乏文化语境和思维差异解读的痛点，通过 AI 生成深层文化洞察、思维差异分析和跨文化语境故事。`

## 2. Tech Stack & Versioning

> **Instruction**: 明确技术栈版本，防止 AI 使用过时或不兼容的 API（例如 Next.js 12 vs 15）。

* **Frontend**: `Next.js 16.1.6 (App Router), React 19.2.3`
* **Styling**: `Tailwind CSS v4（纯手写 Tailwind 实用类，无 shadcn/ui）`
* **State Management**: `React useState + useMemo（无第三方状态管理库），客户端内存缓存（CacheWord / CacheStory）`
* **Backend/Database**: `Supabase (PostgreSQL)，通过 @supabase/supabase-js 服务端单例访问，Next.js Server Actions 作为 API 层`
* **Authentication**: `HTTP Basic Auth（通过 Next.js Middleware 实现，生产环境启用，开发环境跳过）`
* **AI Service**: `Dify Workflow API（外部服务，通过 HTTP 调用，blocking 模式）`
* **Key Dependencies**:
  - `@supabase/supabase-js ^2.93.3` — 数据库访问
  - `react-markdown ^10.1.0` — Markdown 渲染（故事详情展示）
  - `sonner ^2.0.7` — Toast 通知
  - `lucide-react ^0.563.0` — 图标库
  - `babel-plugin-react-compiler 1.0.0` — React Compiler（实验性）

## 3. Directory Map & Responsibility

> **Instruction**: 建立文件索引的心智模型。这是防止 AI 乱放文件的关键。

```text
/
├── src/
│   ├── app/                  # Next.js App Router 根路由
│   │   ├── layout.tsx        # 根布局（字体、Toaster）
│   │   ├── page.tsx          # 唯一页面（单页应用，Client Component）
│   │   ├── type.ts           # 页面级类型定义（ViewMode）
│   │   ├── globals.css       # 全局样式（Tailwind 入口）
│   │   └── _components/      # 【待补充：目前为空或正在拆分中】
│   ├── actions/              # Next.js Server Actions（状态变更逻辑）
│   │   ├── vocab.ts          # 单词相关 Actions（增查、AI 生成）
│   │   ├── story.ts          # 故事相关 Actions（增查、AI 生成）
│   │   └── type.ts           # Action 通用返回类型（success/failure 包装器）
│   ├── services/             # 数据服务层（直接操作外部资源）
│   │   ├── dify.ts           # Dify Workflow API 调用（AI 生成）
│   │   ├── vocabDb.ts        # 单词表 Supabase CRUD
│   │   └── storyDb.ts        # 故事表 Supabase CRUD
│   ├── lib/                  # 核心库、配置、工具
│   │   ├── supabase.ts       # Supabase 服务端单例客户端
│   │   ├── errors.ts         # 自定义错误类（AppError / SystemError）
│   │   └── constants/        # 常量定义
│   │       ├── domain-errors.ts   # 业务错误码枚举
│   │       ├── ui-message.ts      # 前端用户提示文案映射
│   │       └── vendor-codes.ts    # 第三方服务错误码（Supabase / Dify）
│   ├── types/                # TypeScript 全局类型定义
│   └── middleware.ts         # Next.js Middleware（HTTP Basic Auth 访问控制）
├── dify/
│   └── workflows/            # Dify 工作流 XML 导出文件
└── public/                   # 静态资源
```

## 4. Architectural Patterns & Data Flow

> **Instruction**: 描述数据是如何流动的，以及你坚持的设计哲学。

* **Design Pattern**: `分层架构（Layered Architecture）：UI (page.tsx) → Server Actions (actions/) → Services (services/) → External (Supabase / Dify)`
* **Data Fetching Strategy**: `Server Actions 作为唯一的数据获取通道（非 API Routes），客户端通过调用 Server Actions 获取数据，配合客户端内存缓存（CacheWord / CacheStory）避免重复请求`
* **State Flow**:

  **Flow 1：页面初始化（加载列表）**
  ```
  page.tsx useEffect(依赖 currentType)
    ├─ fetchVocabListAction(currentType)
    │    → getVocabListService() → Supabase 查询 (id, wor
    d, created_at)
    │    → 返回 success(VocabListItem[]) → setWords()
    └─ fetchStoryListAction()
         → getStoryListService() → Supabase 查询 (id, title, created_at, word_list)
         → 返回 success(StoryListItem[]) → setStories()
  ```

  **Flow 2：查看详情（单词 / 故事）**
  ```
  用户点击侧边栏项 → handleItemClick(viewMode)
    → 检查客户端内存缓存 (cacheWords / cacheStories)
    → 命中：直接从缓存读取，无网络请求
    → 未命中：
        ├─ 单词：fetchVocabDetailAction(id) → getVocabByIdService() → Supabase 查全量字段
        └─ 故事：fetchStoryDetailAction(id) → getStoryByIdService() → Supabase 查全量字段
        → 返回 success → setCacheWords/setCacheStories 写入缓存
  ```

  **Flow 3：添加新单词（AI 生成）**
  ```
  用户输入单词 → handleAddWord() → processVocabAction(word, currentType)
    → 1. getWordFromDb(word, type)：查 Supabase 是否已存在
    → 2a. 已存在：直接包装为 VocabEntryDTO 返回
    → 2b. 不存在：fetchWordByType(word, type) → Dify Workflow API
         → Dify 返回 JSON（含 status: success/corrected/invalid）
         → invalid：返回 failure(VOCAB_INVALID_INPUT)
         → success/corrected：saveWordToDb() 存入 Supabase
    → 返回 success(VocabEntryDTO) → 客户端：
         ├─ setWords() 更新列表（新词插入头部）
         ├─ setCacheWords() 写入缓存
         └─ setViewMode() 自动选中新词
  ```

  **Flow 4：生成故事（AI 生成）**
  ```
  用户勾选多个单词 → handleGenerateStory() → generateAndSaveStoryAction(wordIds[])
    → 1. Supabase 根据 wordIds 查出原文单词列表（注意：此处绕过了 Services 层）
    → 2. generateStoryFromDify(wordStrings) → Dify Workflow API
         → Dify 返回 "[TITLE]: ...\n[STORY]: ..." 格式文本
    → 3. 正则解析 title + content（Markdown）
    → 4. saveStoryService() 存入 Supabase
    → 返回 success → 客户端：
         ├─ setStories() 更新故事列表
         ├─ setCacheStories() 写入缓存
         ├─ setIsHistoryOpen(true) 切换到故事视图
         └─ setViewMode() 自动选中新故事
  ```

  **Flow 5：切换词汇类型（Culture ↔ Tech）**
  ```
  用户点击类型切换按钮 → handleTypeSwitch(newType)
    → setCurrentType() 触发 useEffect 重新加载列表
    → 清空所有客户端缓存 (cacheWords, cacheStories)
    → 重置 UI 状态 (selectedWordIds, searchTerm, viewMode, isHistoryOpen)
  ```
* **Error Handling**: `双层错误处理架构：`
  - **AppError**：业务逻辑错误（预期内），携带 DOMAIN_ERRORS 错误码，前端通过 UI_ERROR_MESSAGES 映射为用户友好提示
  - **SystemError**：系统级错误（预期外），统一隐藏细节，服务端打日志
  - **Action 层统一捕获**：所有 Server Actions 使用 try-catch 统一包装，返回 `{ success, data }` 或 `{ success, errorCode }` 格式
  - **前端统一展示**：通过 sonner toast 展示错误信息

## 5. Development Constraints (The Rules)

> **Instruction**: 这是最重要的部分，定义 AI 必须遵守的"红线"。

* **Rule 1**: `任何时候使用 find，必须带上 -not -path '*/node_modules/*'，如果需要确认依赖，请优先检查 package.json`

## 6. Testing & Quality Standards

> **Instruction**: 告知 AI 如何验证其生成的代码。

* **Testing Framework**: `Vitest 4 + @testing-library/react 16 + @testing-library/user-event 14`
* **Test Runner Config**: `vitest.config.ts（jsdom 环境，vite-tsconfig-paths 解析 @/* 别名）`
* **Test Commands**: `npm test（watch 模式）/ npm run test:run（单次）/ npm run test:coverage（覆盖率）`
* **Test Structure**:
  - `src/__tests__/setup.ts` — 全局 setup（jest-dom matchers + 测试环境变量）
  - `src/__tests__/helpers/fixtures.ts` — 共享 mock 数据
  - `src/__tests__/helpers/supabase-mock.ts` — Supabase 链式调用 mock 工厂
  - `src/lib/__tests__/` — 错误类测试
  - `src/services/__tests__/` — 数据服务层测试（mock Supabase / fetch）
  - `src/actions/__tests__/` — Server Actions 测试（mock services 层）
  - `src/app/__tests__/` — 页面组件集成测试（mock actions + 第三方库）
* **Mocking Strategy**:
  - Supabase: 通过 `vi.hoisted` + `vi.mock("@/lib/supabase")` 替换为链式调用 mock
  - Dify: 通过 `vi.spyOn(globalThis, "fetch")` mock HTTP 请求
  - Server Actions: 通过 `vi.mock("../../actions/...")` 整体 mock
  - 第三方库（sonner / react-markdown / next/navigation）: 通过 `vi.mock` 替换为轻量 stub
* **Coverage Expectation**: `services/ + actions/ + lib/ 层优先覆盖（核心业务逻辑），组件层覆盖关键交互路径`
* **Current Stats**: `7 个测试文件，74 个测试用例，全部通过`
* **Linting/Formatting**: `ESLint 9 + eslint-config-next（无 Prettier 配置）`

## 7. Current Progress & Context

> **Instruction**: 描述当前阶段，让 AI 知道从哪里开始。

* **Current Milestone**:
* **Known Debt/Issues**:
  - page.tsx 体量过大（800+ 行，UI、状态、逻辑全部集中），需要拆分组件
  - `story.ts` Action 中直接使用了 `supabaseServer` 查询单词表（绕过了 Services 层），违反分层原则
  - 客户端无持久化缓存机制，刷新页面后需重新加载所有详情
* **Next Steps**:
  - 完成单元测试引入，以保证拆分组件时不引入错误或预期外功能变更
