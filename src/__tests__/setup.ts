import "@testing-library/jest-dom/vitest";

process.env.SUPABASE_URL = "http://localhost:54321";
process.env.SUPABASE_ROLE_KEY = "test-key";
process.env.VOCAB_TABLE_NAME = "test-vocabulary";
process.env.STORY_TABLE_NAME = "test-stories";
process.env.DIFY_API_URL = "http://localhost:8080/v1";
process.env.VOCAB_DIFY_API_KEY = "test-vocab-key";
process.env.TECH_DIFY_API_KEY = "test-tech-key";
process.env.STORY_DIFY_API_KEY = "test-story-key";
