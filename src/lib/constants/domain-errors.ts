// Domain Error Code

export enum DOMAIN_ERRORS {
  // --- 1. 通用/系统级错误 ---
  UNKNOWN_ERROR = 20000,
  QUOTA_EXCEEDED,
  AI_PLUGIN_UNAVAILABLE,
  AUTH_UNAUTHORIZED,

  // --- 2. 单词模块 (Vocabulary) ---
  VOCAB_AI_GENERATION_FAILED = 21000,
  VOCAB_GENERATION_PARSE_FAILED,
  VOCAB_GET_DETAIL_FAILED,
  VOCAB_INVALID_INPUT,

  // --- 3. 故事模块 (Story) ---
  STORY_AI_GENERATION_FAILED = 22000,
  STORY_GET_WORDS_FAILED,
  STORY_GET_DETAIL_FAILED,
}

// 提取类型，让你在代码里只能用上面定义好的 Key
export type ErrorCodeType = (typeof DOMAIN_ERRORS)[keyof typeof DOMAIN_ERRORS];
