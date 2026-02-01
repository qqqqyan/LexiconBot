// Story Table Structure
export interface StoryEntry {
  id: string;
  title: string;
  content: string; // Markdown content
  word_ids: string[];
  word_list: string[];
  created_at: string;
}

export type CacheStory = Record<string, string>;

// DTO
export type StoryListItem = Pick<
  StoryEntry,
  "id" | "title" | "word_list" | "created_at"
>;
