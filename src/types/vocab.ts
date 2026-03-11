// The structured data from Dify
export interface DifyWorkflowResponse {
  data: {
    id: string;
    workflow_id: string;
    status: string;
    outputs: {
      res?: string;
    };
    error: string | null;
    elapsed_time: number;
    total_tokens: number;
  };
}

export interface DifyWorkflowResponseRes {
  status: "success" | "corrected" | "invalid";
  original_input: string;
  corrected_word: string | null;
  content: WordContent | null;
}

// Vocab type enum
export type VocabType = "culture" | "tech";

// Base vocab structure (shared fields)
export interface BaseVocab {
  word: string;
  phonetic: string;
  definitions: { pos: string; cn: string; en: string }[];
}

// Cultural content structure
export interface CultureContent extends BaseVocab {
  context_logic: string;
  cultural_insight: string;
  thinking_gap: string;
  examples: { tag: string; sen: string; trans: string }[];
  cultural_connections: { term: string; connection_logic: string }[];
}

// Technical content structure
export interface TechContent extends BaseVocab {
  tech_logic: {
    eli5: string;
    context_logic: string;
  };
  migration_bridge: {
    cn_term: string;
    mental_shift: string;
    nuance: string;
  };
  scenarios: {
    type: string;
    sen: string;
    tip: string;
  }[];
  collocations: {
    phrase: string;
    note: string;
  }[];
}

// Union type for word content
export type WordContent = CultureContent | TechContent;

// Type guards
export function isCultureContent(
  content: WordContent,
): content is CultureContent {
  return "cultural_insight" in content;
}

export function isTechContent(content: WordContent): content is TechContent {
  return "tech_logic" in content;
}

// The database row shape (Entity)
export interface VocabEntry {
  id: string;
  word: string;
  type: VocabType;
  content: WordContent;
  created_at: string;
  last_reviewed_at: string | null;
  status: number[] | null;
}

export interface VocabEntryDTO {
  meta: Pick<
    DifyWorkflowResponseRes,
    "status" | "original_input" | "corrected_word"
  >;
  data: VocabEntry;
}

export type CacheWord = Record<string, WordContent>;

// DTO
export type VocabListItem = Pick<VocabEntry, "id" | "word" | "created_at">;
