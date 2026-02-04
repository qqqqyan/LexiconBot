// from vendor

// Supabase / Postgres 原始错误码字典
export const SUPABASE_CODES = {
  // 通常用于 .single() 没查到数据的情况
  RECORD_NOT_FOUND: "PGRST116",
} as const;

// Dify / HTTP 原始错误码/状态 (如果有固定的)
export const DIFY_CODES = {
  RATE_LIMIT: "429 RESOURCE_EXHAUSTED",
  PLUGIN_UNAVAILABLE: "'NoneType' object is not iterable",
} as const;
