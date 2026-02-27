import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockVocabEntry, mockCultureContent } from "@/__tests__/helpers/fixtures";
import { AppError, SystemError } from "@/lib/errors";
import { DOMAIN_ERRORS } from "@/lib/constants/domain-errors";

const { mockSupabase } = vi.hoisted(() => {
  const methods = ["from", "select", "insert", "eq", "in", "order", "single", "maybeSingle"];
  const chainable: Record<string, ReturnType<typeof vi.fn>> = {};
  for (const method of methods) {
    chainable[method] = vi.fn().mockReturnValue(chainable);
  }
  chainable.single.mockResolvedValue({ data: null, error: null });
  chainable.maybeSingle.mockResolvedValue({ data: null, error: null });
  chainable.order.mockResolvedValue({ data: null, error: null });
  return { mockSupabase: chainable };
});

vi.mock("@/lib/supabase", () => ({
  supabaseServer: mockSupabase,
}));

import {
  getWordFromDb,
  getVocabByIdService,
  saveWordToDb,
  getVocabListService,
  getWordsByIdsService,
} from "@/services/vocabDb";

describe("vocabDb", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset terminal methods to default chainable behavior
    mockSupabase.single.mockReturnValue(mockSupabase);
    mockSupabase.maybeSingle.mockReturnValue(mockSupabase);
    mockSupabase.order.mockReturnValue(mockSupabase);
  });

  // ----------------------------------------------------------------
  // getWordFromDb
  // ----------------------------------------------------------------
  describe("getWordFromDb", () => {
    it("returns the vocab entry when found", async () => {
      mockSupabase.maybeSingle.mockResolvedValueOnce({
        data: mockVocabEntry,
        error: null,
      });

      const result = await getWordFromDb("serendipity", "culture");
      expect(result).toEqual(mockVocabEntry);
    });

    it("returns null when word is not in database", async () => {
      mockSupabase.maybeSingle.mockResolvedValueOnce({
        data: null,
        error: null,
      });

      const result = await getWordFromDb("nonexistent", "culture");
      expect(result).toBeNull();
    });

    it("throws SystemError when supabase returns an error", async () => {
      vi.spyOn(console, "error").mockImplementation(() => {});
      mockSupabase.maybeSingle.mockResolvedValueOnce({
        data: null,
        error: { code: "42P01", message: "table not found" },
      });

      await expect(getWordFromDb("test", "culture")).rejects.toThrow(SystemError);
    });
  });

  // ----------------------------------------------------------------
  // getVocabByIdService
  // ----------------------------------------------------------------
  describe("getVocabByIdService", () => {
    it("returns vocab entry on success", async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: mockVocabEntry,
        error: null,
      });

      const result = await getVocabByIdService("vocab-1");
      expect(result).toEqual(mockVocabEntry);
    });

    it("throws AppError with VOCAB_GET_DETAIL_FAILED for PGRST116", async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: { code: "PGRST116", message: "row not found" },
      });

      try {
        await getVocabByIdService("bad-id");
      } catch (e) {
        expect(e).toBeInstanceOf(AppError);
        expect((e as AppError).code).toBe(DOMAIN_ERRORS.VOCAB_GET_DETAIL_FAILED);
      }
    });

    it("throws SystemError for other database errors", async () => {
      vi.spyOn(console, "error").mockImplementation(() => {});
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: { code: "XXXXX", message: "unknown" },
      });

      await expect(getVocabByIdService("bad-id")).rejects.toThrow(SystemError);
    });
  });

  // ----------------------------------------------------------------
  // saveWordToDb
  // ----------------------------------------------------------------
  describe("saveWordToDb", () => {
    it("returns the saved entry on success", async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: mockVocabEntry,
        error: null,
      });

      const result = await saveWordToDb("serendipity", "culture", mockCultureContent);
      expect(result).toEqual(mockVocabEntry);
      expect(mockSupabase.insert).toHaveBeenCalledWith([
        { word: "serendipity", type: "culture", content: mockCultureContent },
      ]);
    });

    it("throws SystemError on insert failure", async () => {
      vi.spyOn(console, "error").mockImplementation(() => {});
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: { code: "23505", message: "duplicate" },
      });

      await expect(
        saveWordToDb("test", "culture", mockCultureContent),
      ).rejects.toThrow(SystemError);
    });
  });

  // ----------------------------------------------------------------
  // getVocabListService
  // ----------------------------------------------------------------
  describe("getVocabListService", () => {
    it("returns list ordered by created_at desc", async () => {
      const list = [{ id: "1", word: "a", created_at: "2025-01-02" }];
      mockSupabase.order.mockResolvedValueOnce({ data: list, error: null });

      const result = await getVocabListService("culture");
      expect(result).toEqual(list);
      expect(mockSupabase.order).toHaveBeenCalledWith("created_at", {
        ascending: false,
      });
    });

    it("throws SystemError on query failure", async () => {
      vi.spyOn(console, "error").mockImplementation(() => {});
      mockSupabase.order.mockResolvedValueOnce({
        data: null,
        error: { message: "timeout" },
      });

      await expect(getVocabListService("culture")).rejects.toThrow(SystemError);
    });
  });

  // ----------------------------------------------------------------
  // getWordsByIdsService
  // ----------------------------------------------------------------
  describe("getWordsByIdsService", () => {
    it("returns word strings for given IDs", async () => {
      mockSupabase.in.mockResolvedValueOnce({
        data: [{ word: "serendipity" }, { word: "ephemeral" }],
        error: null,
      });

      const result = await getWordsByIdsService(["id-1", "id-2"]);
      expect(result).toEqual(["serendipity", "ephemeral"]);
    });

    it("throws AppError STORY_GET_WORDS_FAILED when no words found", async () => {
      mockSupabase.in.mockResolvedValueOnce({
        data: [],
        error: null,
      });

      try {
        await getWordsByIdsService(["bad-id"]);
      } catch (e) {
        expect(e).toBeInstanceOf(AppError);
        expect((e as AppError).code).toBe(DOMAIN_ERRORS.STORY_GET_WORDS_FAILED);
      }
    });

    it("throws SystemError on database error", async () => {
      vi.spyOn(console, "error").mockImplementation(() => {});
      mockSupabase.in.mockResolvedValueOnce({
        data: null,
        error: { message: "connection refused" },
      });

      await expect(getWordsByIdsService(["id-1"])).rejects.toThrow(SystemError);
    });
  });
});
