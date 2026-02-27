import type {
  CultureContent,
  TechContent,
  VocabEntry,
  VocabListItem,
  DifyWorkflowResponse,
  DifyWorkflowResponseRes,
} from "@/types";
import type { StoryEntry, StoryListItem } from "@/types";

export const mockCultureContent: CultureContent = {
  word: "serendipity",
  phonetic: "/ˌserənˈdɪpɪti/",
  definitions: [
    {
      pos: "noun",
      cn: "意外的幸运发现",
      en: "The occurrence of finding pleasant things by chance",
    },
  ],
  context_logic: "Used when good things happen unexpectedly",
  cultural_insight: "Coined by Horace Walpole in 1754",
  thinking_gap: "Chinese has no single-word equivalent",
  examples: [
    {
      tag: "daily",
      sen: "It was pure serendipity that we met.",
      trans: "我们的相遇纯属机缘巧合。",
    },
  ],
  cultural_connections: [
    {
      term: "luck",
      connection_logic: "Related but serendipity implies discovery",
    },
  ],
};

export const mockTechContent: TechContent = {
  word: "middleware",
  phonetic: "/ˈmɪdəlwɛr/",
  definitions: [
    {
      pos: "noun",
      cn: "中间件",
      en: "Software that bridges OS and applications",
    },
  ],
  tech_logic: {
    eli5: "A helper that sits between two things",
    context_logic: "Common in server frameworks",
  },
  migration_bridge: {
    cn_term: "中间件",
    mental_shift: "Think pipeline, not single component",
    nuance: "Broader than the Chinese term",
  },
  scenarios: [
    {
      type: "backend",
      sen: "Add auth middleware",
      tip: "Order matters in the stack",
    },
  ],
  collocations: [
    { phrase: "middleware stack", note: "The chain of middleware functions" },
  ],
};

export const mockVocabEntry: VocabEntry = {
  id: "vocab-1",
  word: "serendipity",
  type: "culture",
  content: mockCultureContent,
  created_at: "2025-01-01T00:00:00Z",
};

export const mockVocabListItem: VocabListItem = {
  id: "vocab-1",
  word: "serendipity",
  created_at: "2025-01-01T00:00:00Z",
};

export const mockStoryEntry: StoryEntry = {
  id: "story-1",
  title: "A Serendipitous Day",
  content: "Once upon a time...",
  word_ids: ["vocab-1"],
  word_list: ["serendipity"],
  created_at: "2025-01-01T00:00:00Z",
};

export const mockStoryListItem: StoryListItem = {
  id: "story-1",
  title: "A Serendipitous Day",
  word_list: ["serendipity"],
  created_at: "2025-01-01T00:00:00Z",
};

export const mockDifySuccessRes: DifyWorkflowResponseRes = {
  status: "success",
  original_input: "serendipity",
  corrected_word: null,
  content: mockCultureContent,
};

export const mockDifySuccessResponse: DifyWorkflowResponse = {
  data: {
    id: "run-1",
    workflow_id: "wf-1",
    status: "succeeded",
    outputs: { res: JSON.stringify(mockDifySuccessRes) },
    error: null,
    elapsed_time: 1.5,
    total_tokens: 100,
  },
};
