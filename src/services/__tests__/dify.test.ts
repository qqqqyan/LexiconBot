import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockDifySuccessResponse, mockDifySuccessRes } from "@/__tests__/helpers/fixtures";
import { AppError, SystemError } from "@/lib/errors";
import { DOMAIN_ERRORS } from "@/lib/constants/domain-errors";
import {
  fetchWordFromDify,
  fetchTechWordFromDify,
  generateStoryFromDify,
  fetchWordByType,
} from "@/services/dify";

describe("dify service", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(console, "log").mockImplementation(() => {});
  });

  // ----------------------------------------------------------------
  // fetchWordFromDify
  // ----------------------------------------------------------------
  describe("fetchWordFromDify", () => {
    it("returns parsed content on success", async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
        ok: true,
        json: async () => mockDifySuccessResponse,
      } as Response);

      const result = await fetchWordFromDify("serendipity");
      expect(result.status).toBe("success");
      expect(result.content).toEqual(mockDifySuccessRes.content);
    });

    it("throws SystemError when HTTP response is not ok", async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => "Internal Server Error",
      } as Response);

      await expect(fetchWordFromDify("test")).rejects.toThrow(SystemError);
    });

    it("throws AppError QUOTA_EXCEEDED on 429 rate limit", async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            id: "r1",
            workflow_id: "w1",
            status: "failed",
            outputs: {},
            error: "429 RESOURCE_EXHAUSTED something",
            elapsed_time: 0,
            total_tokens: 0,
          },
        }),
      } as Response);

      await expect(fetchWordFromDify("test")).rejects.toThrow(AppError);
      // Re-mock for the second assertion
      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            id: "r1",
            workflow_id: "w1",
            status: "failed",
            outputs: {},
            error: "429 RESOURCE_EXHAUSTED something",
            elapsed_time: 0,
            total_tokens: 0,
          },
        }),
      } as Response);
      try {
        await fetchWordFromDify("test");
      } catch (e) {
        expect((e as AppError).code).toBe(DOMAIN_ERRORS.QUOTA_EXCEEDED);
      }
    });

    it("throws AppError AI_PLUGIN_UNAVAILABLE when plugin is down", async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            id: "r1",
            workflow_id: "w1",
            status: "failed",
            outputs: {},
            error: "'NoneType' object is not iterable",
            elapsed_time: 0,
            total_tokens: 0,
          },
        }),
      } as Response);

      try {
        await fetchWordFromDify("test");
      } catch (e) {
        expect(e).toBeInstanceOf(AppError);
        expect((e as AppError).code).toBe(DOMAIN_ERRORS.AI_PLUGIN_UNAVAILABLE);
      }
    });

    it("throws SystemError for unknown workflow errors", async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            id: "r1",
            workflow_id: "w1",
            status: "failed",
            outputs: {},
            error: "some unknown error",
            elapsed_time: 0,
            total_tokens: 0,
          },
        }),
      } as Response);

      await expect(fetchWordFromDify("test")).rejects.toThrow(SystemError);
    });

    it("throws AppError VOCAB_AI_GENERATION_FAILED when outputs.res is empty", async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            id: "r1",
            workflow_id: "w1",
            status: "ok",
            outputs: {},
            error: null,
            elapsed_time: 0,
            total_tokens: 0,
          },
        }),
      } as Response);

      try {
        await fetchWordFromDify("test");
      } catch (e) {
        expect(e).toBeInstanceOf(AppError);
        expect((e as AppError).code).toBe(DOMAIN_ERRORS.VOCAB_AI_GENERATION_FAILED);
      }
    });

    it("throws AppError VOCAB_GENERATION_PARSE_FAILED on malformed JSON", async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            id: "r1",
            workflow_id: "w1",
            status: "ok",
            outputs: { res: "not valid json {{{" },
            error: null,
            elapsed_time: 0,
            total_tokens: 0,
          },
        }),
      } as Response);

      try {
        await fetchWordFromDify("test");
      } catch (e) {
        expect(e).toBeInstanceOf(AppError);
        expect((e as AppError).code).toBe(DOMAIN_ERRORS.VOCAB_GENERATION_PARSE_FAILED);
      }
    });
  });

  // ----------------------------------------------------------------
  // generateStoryFromDify
  // ----------------------------------------------------------------
  describe("generateStoryFromDify", () => {
    it("returns raw string content without JSON parsing", async () => {
      const storyOutput = "[TITLE]: My Story\n[STORY]: Once upon a time...";
      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            id: "r1",
            workflow_id: "w1",
            status: "ok",
            outputs: { res: storyOutput },
            error: null,
            elapsed_time: 0,
            total_tokens: 0,
          },
        }),
      } as Response);

      const result = await generateStoryFromDify(["word1", "word2"]);
      expect(result).toBe(storyOutput);
    });
  });

  // ----------------------------------------------------------------
  // fetchTechWordFromDify
  // ----------------------------------------------------------------
  describe("fetchTechWordFromDify", () => {
    it("returns parsed tech content on success", async () => {
      const techRes = {
        status: "success" as const,
        original_input: "middleware",
        corrected_word: null,
        content: { word: "middleware" },
      };
      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            id: "r1",
            workflow_id: "w1",
            status: "ok",
            outputs: { res: JSON.stringify(techRes) },
            error: null,
            elapsed_time: 0,
            total_tokens: 0,
          },
        }),
      } as Response);

      const result = await fetchTechWordFromDify("middleware");
      expect(result.status).toBe("success");
    });
  });

  // ----------------------------------------------------------------
  // fetchWordByType
  // ----------------------------------------------------------------
  describe("fetchWordByType", () => {
    it("delegates to fetchWordFromDify for culture type", async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
        ok: true,
        json: async () => mockDifySuccessResponse,
      } as Response);

      const result = await fetchWordByType("serendipity", "culture");
      expect(result.status).toBe("success");
    });

    it("delegates to fetchTechWordFromDify for tech type", async () => {
      const techRes = {
        status: "success" as const,
        original_input: "middleware",
        corrected_word: null,
        content: { word: "middleware" },
      };
      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            id: "r1",
            workflow_id: "w1",
            status: "ok",
            outputs: { res: JSON.stringify(techRes) },
            error: null,
            elapsed_time: 0,
            total_tokens: 0,
          },
        }),
      } as Response);

      const result = await fetchWordByType("middleware", "tech");
      expect(result.status).toBe("success");
    });
  });
});
