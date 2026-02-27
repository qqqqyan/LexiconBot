import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockVocabEntry, mockCultureContent } from "@/__tests__/helpers/fixtures";
import { DOMAIN_ERRORS } from "@/lib/constants/domain-errors";
import { AppError } from "@/lib/errors";

vi.mock("@/services/vocabDb", () => ({
  getWordFromDb: vi.fn(),
  getVocabByIdService: vi.fn(),
  saveWordToDb: vi.fn(),
  getVocabListService: vi.fn(),
}));

vi.mock("@/services/dify", () => ({
  fetchWordByType: vi.fn(),
}));

import {
  fetchVocabListAction,
  fetchVocabDetailAction,
  processVocabAction,
} from "@/actions/vocab";
import {
  getWordFromDb,
  getVocabByIdService,
  saveWordToDb,
  getVocabListService,
} from "@/services/vocabDb";
import { fetchWordByType } from "@/services/dify";

const mockGetWordFromDb = getWordFromDb as ReturnType<typeof vi.fn>;
const mockGetVocabById = getVocabByIdService as ReturnType<typeof vi.fn>;
const mockSaveWordToDb = saveWordToDb as ReturnType<typeof vi.fn>;
const mockGetVocabList = getVocabListService as ReturnType<typeof vi.fn>;
const mockFetchWordByType = fetchWordByType as ReturnType<typeof vi.fn>;

describe("vocab actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ----------------------------------------------------------------
  // fetchVocabListAction
  // ----------------------------------------------------------------
  describe("fetchVocabListAction", () => {
    it("returns success with list data", async () => {
      const list = [{ id: "1", word: "test", created_at: "2025-01-01" }];
      mockGetVocabList.mockResolvedValueOnce(list);

      const result = await fetchVocabListAction("culture");
      expect(result).toEqual({ success: true, data: list });
    });

    it("returns failure with error code when AppError is thrown", async () => {
      mockGetVocabList.mockRejectedValueOnce(
        new AppError("fail", DOMAIN_ERRORS.VOCAB_GET_DETAIL_FAILED),
      );

      const result = await fetchVocabListAction("culture");
      expect(result).toEqual({
        success: false,
        errorCode: DOMAIN_ERRORS.VOCAB_GET_DETAIL_FAILED,
      });
    });

    it("returns UNKNOWN_ERROR for non-AppError exceptions", async () => {
      mockGetVocabList.mockRejectedValueOnce(new Error("unexpected"));

      const result = await fetchVocabListAction("culture");
      expect(result).toEqual({
        success: false,
        errorCode: DOMAIN_ERRORS.UNKNOWN_ERROR,
      });
    });
  });

  // ----------------------------------------------------------------
  // fetchVocabDetailAction
  // ----------------------------------------------------------------
  describe("fetchVocabDetailAction", () => {
    it("returns success with vocab entry", async () => {
      mockGetVocabById.mockResolvedValueOnce(mockVocabEntry);

      const result = await fetchVocabDetailAction("vocab-1");
      expect(result).toEqual({ success: true, data: mockVocabEntry });
    });

    it("returns failure when AppError is thrown", async () => {
      mockGetVocabById.mockRejectedValueOnce(
        new AppError("not found", DOMAIN_ERRORS.VOCAB_GET_DETAIL_FAILED),
      );

      const result = await fetchVocabDetailAction("bad-id");
      expect(result).toEqual({
        success: false,
        errorCode: DOMAIN_ERRORS.VOCAB_GET_DETAIL_FAILED,
      });
    });
  });

  // ----------------------------------------------------------------
  // processVocabAction
  // ----------------------------------------------------------------
  describe("processVocabAction", () => {
    it("returns cached data when word exists in DB (no AI call)", async () => {
      mockGetWordFromDb.mockResolvedValueOnce(mockVocabEntry);

      const result = await processVocabAction("serendipity", "culture");

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.meta.status).toBe("success");
        expect(result.data.data).toEqual(mockVocabEntry);
      }
      expect(mockFetchWordByType).not.toHaveBeenCalled();
      expect(mockSaveWordToDb).not.toHaveBeenCalled();
    });

    it("calls AI and saves when word is not cached", async () => {
      mockGetWordFromDb.mockResolvedValueOnce(null);
      mockFetchWordByType.mockResolvedValueOnce({
        status: "success",
        original_input: "serendipity",
        corrected_word: null,
        content: mockCultureContent,
      });
      mockSaveWordToDb.mockResolvedValueOnce(mockVocabEntry);

      const result = await processVocabAction("serendipity", "culture");

      expect(result.success).toBe(true);
      expect(mockFetchWordByType).toHaveBeenCalledWith("serendipity", "culture");
      expect(mockSaveWordToDb).toHaveBeenCalledWith(
        "serendipity",
        "culture",
        mockCultureContent,
      );
    });

    it("returns VOCAB_INVALID_INPUT when AI says input is invalid", async () => {
      mockGetWordFromDb.mockResolvedValueOnce(null);
      mockFetchWordByType.mockResolvedValueOnce({
        status: "invalid",
        original_input: "asdfgh",
        corrected_word: null,
        content: null,
      });

      const result = await processVocabAction("asdfgh", "culture");
      expect(result).toEqual({
        success: false,
        errorCode: DOMAIN_ERRORS.VOCAB_INVALID_INPUT,
      });
      expect(mockSaveWordToDb).not.toHaveBeenCalled();
    });

    it("returns VOCAB_AI_GENERATION_FAILED when content is null", async () => {
      mockGetWordFromDb.mockResolvedValueOnce(null);
      mockFetchWordByType.mockResolvedValueOnce({
        status: "success",
        original_input: "test",
        corrected_word: null,
        content: null,
      });

      const result = await processVocabAction("test", "culture");
      expect(result).toEqual({
        success: false,
        errorCode: DOMAIN_ERRORS.VOCAB_AI_GENERATION_FAILED,
      });
    });

    it("uses corrected_word when AI corrects the input", async () => {
      mockGetWordFromDb.mockResolvedValueOnce(null);
      mockFetchWordByType.mockResolvedValueOnce({
        status: "corrected",
        original_input: "serendipiti",
        corrected_word: "serendipity",
        content: mockCultureContent,
      });
      mockSaveWordToDb.mockResolvedValueOnce(mockVocabEntry);

      const result = await processVocabAction("serendipiti", "culture");

      expect(result.success).toBe(true);
      expect(mockSaveWordToDb).toHaveBeenCalledWith(
        "serendipity",
        "culture",
        mockCultureContent,
      );
      if (result.success) {
        expect(result.data.meta.status).toBe("corrected");
        expect(result.data.meta.corrected_word).toBe("serendipity");
      }
    });

    it("returns failure when service throws AppError", async () => {
      mockGetWordFromDb.mockRejectedValueOnce(
        new AppError("quota", DOMAIN_ERRORS.QUOTA_EXCEEDED),
      );

      const result = await processVocabAction("test", "culture");
      expect(result).toEqual({
        success: false,
        errorCode: DOMAIN_ERRORS.QUOTA_EXCEEDED,
      });
    });
  });
});
