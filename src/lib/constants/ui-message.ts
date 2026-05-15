import { DOMAIN_ERRORS } from "./domain-errors";

// 专门给前端 UI 组件用的
export const UI_ERROR_MESSAGES = {
  // --- 0. 前端专用 ---
  UI_NETWORK_ERROR: "网络连接失败，请检查网络设置",

  // --- 1. 通用/系统级错误 ---
  [DOMAIN_ERRORS.UNKNOWN_ERROR]: "系统开小差了，请稍后再试。",
  [DOMAIN_ERRORS.QUOTA_EXCEEDED]: "今天的生成次数用完啦，休息一下明天再来吧！",
  [DOMAIN_ERRORS.AI_PLUGIN_UNAVAILABLE]: "AI 服务暂时不可用，请稍后再试。",
  [DOMAIN_ERRORS.AUTH_UNAUTHORIZED]: "登录已过期，请重新登录。",

  // --- 2. 单词模块 (Vocabulary) ---
  [DOMAIN_ERRORS.VOCAB_AI_GENERATION_FAILED]: "单词内容生成失败，请稍后再试。",
  [DOMAIN_ERRORS.VOCAB_GENERATION_PARSE_FAILED]:
    "单词生成结果解析失败，请联系管理员。",
  [DOMAIN_ERRORS.VOCAB_GET_DETAIL_FAILED]: "获取单词详情失败，请刷新页面重试。",
  [DOMAIN_ERRORS.VOCAB_INVALID_INPUT]: "输入的单词无效，请检查后重新输入。",

  // --- 3. 故事模块 (Story) ---
  [DOMAIN_ERRORS.STORY_AI_GENERATION_FAILED]: "故事生成失败，请稍后再试。",
  [DOMAIN_ERRORS.STORY_GET_WORDS_FAILED]: "单词未找到，请刷新页面重试。",
  [DOMAIN_ERRORS.STORY_GET_DETAIL_FAILED]: "获取故事详情失败，请刷新页面重试。",
};

export type UiErrorMessageType =
  (typeof UI_ERROR_MESSAGES)[keyof typeof UI_ERROR_MESSAGES];
