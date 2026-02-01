// The structured data from Dify
export interface DifyWorkflowResponse {
  data: {
    id: string;
    workflow_id: string;
    status: string;
    outputs: {
      res: string;
    };
    error: string | null;
    elapsed_time: number;
    total_tokens: number;
  };
}

// The structured data inside the JSONB column
export interface WordContent {
  word: string;
  phonetic: string;
  definitions: { pos: string; cn: string; en: string }[];
  context_logic: string;
  cultural_insight: string;
  thinking_gap: string;
  examples: { tag: string; sen: string; trans: string }[];
  cultural_connections: { term: string; connection_logic: string }[];
}

// The database row shape (Entity)
export interface VocabEntry {
  id: string;
  word: string;
  content: WordContent;
  created_at: string;
}

export type CacheWord = Record<string, WordContent>;

// DTO
export type VocabListItem = Pick<VocabEntry, "id" | "word" | "created_at">;
