import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockStoryEntry } from "@/__tests__/helpers/fixtures";
import { DOMAIN_ERRORS } from "@/lib/constants/domain-errors";
import { AppError } from "@/lib/errors";

vi.mock("@/services/storyDb", () => ({
  getStoryListService: vi.fn(),
  getStoryByIdService: vi.fn(),
  saveStoryService: vi.fn(),
}));

vi.mock("@/services/vocabDb", () => ({
  getWordsByIdsService: vi.fn(),
}));

vi.mock("@/services/dify", () => ({
  generateStoryFromDify: vi.fn(),
}));

import {
  fetchStoryListAction,
  fetchStoryDetailAction,
  generateAndSaveStoryAction,
} from "@/actions/story";
import {
  getStoryListService,
  getStoryByIdService,
  saveStoryService,
} from "@/services/storyDb";
import { getWordsByIdsService } from "@/services/vocabDb";
import { generateStoryFromDify } from "@/services/dify";

const mockGetStoryList = getStoryListService as ReturnType<typeof vi.fn>;
const mockGetStoryById = getStoryByIdService as ReturnType<typeof vi.fn>;
const mockSaveStory = saveStoryService as ReturnType<typeof vi.fn>;
const mockGetWordsByIds = getWordsByIdsService as ReturnType<typeof vi.fn>;
const mockGenerateStory = generateStoryFromDify as ReturnType<typeof vi.fn>;

describe("story actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ----------------------------------------------------------------
  // fetchStoryListAction
  // ----------------------------------------------------------------
  describe("fetchStoryListAction", () => {
    it("returns success with list data", async () => {
      const list = [{ id: "s1", title: "Story", created_at: "2025-01-01" }];
      mockGetStoryList.mockResolvedValueOnce(list);

      const result = await fetchStoryListAction();
      expect(result).toEqual({ success: true, data: list });
    });

    it("returns failure with error code on AppError", async () => {
      mockGetStoryList.mockRejectedValueOnce(
        new AppError("fail", DOMAIN_ERRORS.STORY_GET_DETAIL_FAILED),
      );

      const result = await fetchStoryListAction();
      expect(result).toEqual({
        success: false,
        errorCode: DOMAIN_ERRORS.STORY_GET_DETAIL_FAILED,
      });
    });
  });

  // ----------------------------------------------------------------
  // fetchStoryDetailAction
  // ----------------------------------------------------------------
  describe("fetchStoryDetailAction", () => {
    it("returns success with story entry", async () => {
      mockGetStoryById.mockResolvedValueOnce(mockStoryEntry);

      const result = await fetchStoryDetailAction("story-1");
      expect(result).toEqual({ success: true, data: mockStoryEntry });
    });
  });

  // ----------------------------------------------------------------
  // generateAndSaveStoryAction
  // ----------------------------------------------------------------
  describe("generateAndSaveStoryAction", () => {
    it("generates and saves story with correct title/content parsing", async () => {
      mockGetWordsByIds.mockResolvedValueOnce(["serendipity", "ephemeral"]);
      mockGenerateStory.mockResolvedValueOnce(
        "[TITLE]: A Serendipitous Day\n[STORY]: Once upon a time...",
      );
      mockSaveStory.mockResolvedValueOnce(mockStoryEntry);

      const result = await generateAndSaveStoryAction(["id-1", "id-2"]);

      expect(result.success).toBe(true);
      expect(mockGetWordsByIds).toHaveBeenCalledWith(["id-1", "id-2"]);
      expect(mockGenerateStory).toHaveBeenCalledWith([
        "serendipity",
        "ephemeral",
      ]);
      expect(mockSaveStory).toHaveBeenCalledWith(
        "A Serendipitous Day",
        "Once upon a time...",
        ["id-1", "id-2"],
        ["serendipity", "ephemeral"],
      );
    });

    it("uses fallback title when [TITLE] is missing", async () => {
      mockGetWordsByIds.mockResolvedValueOnce(["word1"]);
      mockGenerateStory.mockResolvedValueOnce("Just some story content here");
      mockSaveStory.mockResolvedValueOnce(mockStoryEntry);

      await generateAndSaveStoryAction(["id-1"]);

      expect(mockSaveStory).toHaveBeenCalledWith(
        "Untitled Story",
        "Just some story content here",
        ["id-1"],
        ["word1"],
      );
    });

    it("uses raw output as content when [STORY] is missing", async () => {
      mockGetWordsByIds.mockResolvedValueOnce(["word1"]);
      mockGenerateStory.mockResolvedValueOnce("[TITLE]: My Title\nNo story tag here");
      mockSaveStory.mockResolvedValueOnce(mockStoryEntry);

      await generateAndSaveStoryAction(["id-1"]);

      expect(mockSaveStory).toHaveBeenCalledWith(
        "My Title",
        "[TITLE]: My Title\nNo story tag here",
        ["id-1"],
        ["word1"],
      );
    });

    it("returns failure when words not found", async () => {
      mockGetWordsByIds.mockRejectedValueOnce(
        new AppError("not found", DOMAIN_ERRORS.STORY_GET_WORDS_FAILED),
      );

      const result = await generateAndSaveStoryAction(["bad-id"]);
      expect(result).toEqual({
        success: false,
        errorCode: DOMAIN_ERRORS.STORY_GET_WORDS_FAILED,
      });
    });

    it("returns UNKNOWN_ERROR for unexpected exceptions", async () => {
      mockGetWordsByIds.mockRejectedValueOnce(new Error("unexpected"));

      const result = await generateAndSaveStoryAction(["id-1"]);
      expect(result).toEqual({
        success: false,
        errorCode: DOMAIN_ERRORS.UNKNOWN_ERROR,
      });
    });
  });
});
