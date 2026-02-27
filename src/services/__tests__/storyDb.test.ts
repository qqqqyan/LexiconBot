import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockStoryEntry } from "@/__tests__/helpers/fixtures";
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
  getStoryListService,
  getStoryByIdService,
  saveStoryService,
} from "@/services/storyDb";

describe("storyDb", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase.single.mockReturnValue(mockSupabase);
    mockSupabase.maybeSingle.mockReturnValue(mockSupabase);
    mockSupabase.order.mockReturnValue(mockSupabase);
  });

  // ----------------------------------------------------------------
  // getStoryListService
  // ----------------------------------------------------------------
  describe("getStoryListService", () => {
    it("returns story list ordered by created_at desc", async () => {
      const list = [
        { id: "s1", title: "Story 1", created_at: "2025-01-01", word_list: ["a"] },
      ];
      mockSupabase.order.mockResolvedValueOnce({ data: list, error: null });

      const result = await getStoryListService();
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

      await expect(getStoryListService()).rejects.toThrow(SystemError);
    });
  });

  // ----------------------------------------------------------------
  // getStoryByIdService
  // ----------------------------------------------------------------
  describe("getStoryByIdService", () => {
    it("returns story entry on success", async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: mockStoryEntry,
        error: null,
      });

      const result = await getStoryByIdService("story-1");
      expect(result).toEqual(mockStoryEntry);
    });

    it("throws AppError STORY_GET_DETAIL_FAILED for PGRST116", async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: { code: "PGRST116", message: "row not found" },
      });

      try {
        await getStoryByIdService("bad-id");
      } catch (e) {
        expect(e).toBeInstanceOf(AppError);
        expect((e as AppError).code).toBe(DOMAIN_ERRORS.STORY_GET_DETAIL_FAILED);
      }
    });

    it("throws SystemError for other database errors", async () => {
      vi.spyOn(console, "error").mockImplementation(() => {});
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: { code: "XXXXX", message: "unknown" },
      });

      await expect(getStoryByIdService("bad-id")).rejects.toThrow(SystemError);
    });
  });

  // ----------------------------------------------------------------
  // saveStoryService
  // ----------------------------------------------------------------
  describe("saveStoryService", () => {
    it("returns saved story on success", async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: mockStoryEntry,
        error: null,
      });

      const result = await saveStoryService(
        "A Serendipitous Day",
        "Once upon a time...",
        ["vocab-1"],
        ["serendipity"],
      );
      expect(result).toEqual(mockStoryEntry);
      expect(mockSupabase.insert).toHaveBeenCalledWith([
        {
          title: "A Serendipitous Day",
          content: "Once upon a time...",
          word_ids: ["vocab-1"],
          word_list: ["serendipity"],
        },
      ]);
    });

    it("throws SystemError on insert failure", async () => {
      vi.spyOn(console, "error").mockImplementation(() => {});
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: { message: "disk full" },
      });

      await expect(
        saveStoryService("title", "content", [], []),
      ).rejects.toThrow(SystemError);
    });
  });
});
