import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  mockVocabEntry,
  mockCultureContent,
  mockTechContent,
  mockStoryEntry,
} from "@/__tests__/helpers/fixtures";
import { DOMAIN_ERRORS } from "@/lib/constants/domain-errors";

// --- Mock dependencies (vi.hoisted to avoid hoisting issues) ---

const {
  mockToast,
  mockFetchVocabList,
  mockFetchStoryList,
  mockFetchVocabDetail,
  mockFetchStoryDetail,
  mockProcessVocab,
  mockGenerateAndSaveStory,
} = vi.hoisted(() => ({
  mockToast: {
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
  },
  mockFetchVocabList: vi.fn(),
  mockFetchStoryList: vi.fn(),
  mockFetchVocabDetail: vi.fn(),
  mockFetchStoryDetail: vi.fn(),
  mockProcessVocab: vi.fn(),
  mockGenerateAndSaveStory: vi.fn(),
}));

// Module Mocking
vi.mock("sonner", () => ({
  toast: mockToast,
  Toaster: () => null,
}));

vi.mock("react-markdown", () => ({
  default: ({ children }: { children: string }) => (
    <div data-testid="markdown">{children}</div>
  ),
}));

vi.mock("../../actions/vocab", () => ({
  fetchVocabListAction: (...args: unknown[]) => mockFetchVocabList(...args),
  fetchVocabDetailAction: (...args: unknown[]) => mockFetchVocabDetail(...args),
  processVocabAction: (...args: unknown[]) => mockProcessVocab(...args),
}));

vi.mock("../../actions/story", () => ({
  fetchStoryListAction: (...args: unknown[]) => mockFetchStoryList(...args),
  fetchStoryDetailAction: (...args: unknown[]) => mockFetchStoryDetail(...args),
  generateAndSaveStoryAction: (...args: unknown[]) =>
    mockGenerateAndSaveStory(...args),
}));

import VocabNotebookPage from "../page";

// --- Helper: default mocks for initial load ---
function setupDefaultMocks() {
  mockFetchVocabList.mockResolvedValue({
    success: true,
    data: [
      { id: "w1", word: "serendipity", created_at: "2025-01-01" },
      { id: "w2", word: "ephemeral", created_at: "2025-01-02" },
    ],
  });
  mockFetchStoryList.mockResolvedValue({
    success: true,
    data: [
      {
        id: "s1",
        title: "A Great Story",
        created_at: "2025-01-01",
        word_list: ["serendipity"],
      },
    ],
  });
}

// Unit Test
describe("VocabNotebookPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupDefaultMocks();
  });

  // ================================================================
  // 初始化加载
  // ================================================================
  describe("Initial Load", () => {
    it("renders word list after loading", async () => {
      render(<VocabNotebookPage />);

      await waitFor(() => {
        expect(screen.getByText("serendipity")).toBeInTheDocument();
        expect(screen.getByText("ephemeral")).toBeInTheDocument();
      });
    });

    it("shows empty state when no words", async () => {
      mockFetchVocabList.mockResolvedValueOnce({ success: true, data: [] });

      render(<VocabNotebookPage />);

      await waitFor(() => {
        expect(screen.getByText("No words found.")).toBeInTheDocument();
      });
    });

    it("shows error toast when fetch fails", async () => {
      mockFetchVocabList.mockResolvedValueOnce({
        success: false,
        errorCode: DOMAIN_ERRORS.UNKNOWN_ERROR,
      });

      render(<VocabNotebookPage />);

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalled();
      });
    });

    it("shows placeholder when no word is selected", async () => {
      render(<VocabNotebookPage />);

      await waitFor(() => {
        expect(
          screen.getByText("Select a word or story to view details"),
        ).toBeInTheDocument();
      });
    });
  });

  // ================================================================
  // 搜索过滤
  // ================================================================
  describe("Search Filtering", () => {
    it("filters words by search term", async () => {
      const user = userEvent.setup();
      render(<VocabNotebookPage />);

      await waitFor(() => {
        expect(screen.getByText("serendipity")).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText("Search vocabulary...");
      await user.type(searchInput, "seren");

      expect(screen.getByText("serendipity")).toBeInTheDocument();
      expect(screen.queryByText("ephemeral")).not.toBeInTheDocument();
    });
  });

  // ================================================================
  // 查看单词详情 — Culture Content
  // ================================================================
  describe("Word Detail — Culture", () => {
    it("renders culture-specific sections", async () => {
      const user = userEvent.setup();
      mockFetchVocabDetail.mockResolvedValueOnce({
        success: true,
        data: mockVocabEntry,
      });

      render(<VocabNotebookPage />);

      await waitFor(() => {
        expect(screen.getByText("serendipity")).toBeInTheDocument();
      });

      await user.click(screen.getByText("serendipity"));

      await waitFor(() => {
        // Word title in detail view
        expect(
          screen.getByText(mockCultureContent.phonetic),
        ).toBeInTheDocument();
        // Culture sections
        expect(screen.getByText("Cultural Insight")).toBeInTheDocument();
        expect(screen.getByText("Thinking Gap")).toBeInTheDocument();
        expect(screen.getByText("Context Logic")).toBeInTheDocument();
        expect(screen.getByText("Connections")).toBeInTheDocument();
      });
    });
  });

  // ================================================================
  // 查看单词详情 — Tech Content
  // ================================================================
  describe("Word Detail — Tech", () => {
    it("renders tech-specific sections", async () => {
      const user = userEvent.setup();
      mockFetchVocabDetail.mockResolvedValueOnce({
        success: true,
        data: { ...mockVocabEntry, type: "tech", content: mockTechContent },
      });

      render(<VocabNotebookPage />);

      await waitFor(() => {
        expect(screen.getByText("serendipity")).toBeInTheDocument();
      });

      await user.click(screen.getByText("serendipity"));

      await waitFor(() => {
        expect(screen.getByText("ELI5")).toBeInTheDocument();
        expect(screen.getByText("Technical Context")).toBeInTheDocument();
        expect(screen.getByText(/Migration Bridge/)).toBeInTheDocument();
        expect(screen.getByText("Usage Scenarios")).toBeInTheDocument();
        expect(screen.getByText("Common Collocations")).toBeInTheDocument();
      });
    });
  });

  // ================================================================
  // AddWordModal
  // ================================================================
  describe("AddWordModal", () => {
    it("opens modal and closes with X button", async () => {
      const user = userEvent.setup();
      render(<VocabNotebookPage />);

      await waitFor(() => {
        expect(screen.getByText("serendipity")).toBeInTheDocument();
      });

      // Click the + button to open modal
      const addButton = screen.getByTitle("Add New Word");
      await user.click(addButton);

      expect(screen.getByText("Add New Word")).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText("e.g. Serendipity"),
      ).toBeInTheDocument();

      // Close with X button
      const closeButton = screen
        .getByText("Add New Word")
        .closest("div")!
        .querySelector("button")!;
      // The X button is the second button in that header div
      const headerButtons = screen
        .getByText("Add New Word")
        .parentElement!.querySelectorAll("button");
      await user.click(headerButtons[0]);

      await waitFor(() => {
        expect(screen.queryByText("Add New Word")).not.toBeInTheDocument();
      });
    });

    it("shows validation warning for empty input", async () => {
      const user = userEvent.setup();
      render(<VocabNotebookPage />);

      await waitFor(() => {
        expect(screen.getByText("serendipity")).toBeInTheDocument();
      });

      await user.click(screen.getByTitle("Add New Word"));

      // The Analyze & Add button should be disabled when input is empty
      const submitBtn = screen.getByText("Analyze & Add").closest("button")!;
      expect(submitBtn).toBeDisabled();
    });

    it("shows warning for input exceeding 24 chars", async () => {
      const user = userEvent.setup();
      render(<VocabNotebookPage />);

      await waitFor(() => {
        expect(screen.getByText("serendipity")).toBeInTheDocument();
      });

      await user.click(screen.getByTitle("Add New Word"));

      const input = screen.getByPlaceholderText("e.g. Serendipity");
      await user.type(input, "abcdefghijklmnopqrstuvwxyz");
      await user.click(screen.getByText("Analyze & Add").closest("button")!);

      expect(mockToast.warning).toHaveBeenCalledWith(
        "单词过长，请控制在24个字符以内",
      );
    });

    it("shows warning for non-English input", async () => {
      const user = userEvent.setup();
      render(<VocabNotebookPage />);

      await waitFor(() => {
        expect(screen.getByText("serendipity")).toBeInTheDocument();
      });

      await user.click(screen.getByTitle("Add New Word"));

      const input = screen.getByPlaceholderText("e.g. Serendipity");
      await user.type(input, "abc123");
      await user.click(screen.getByText("Analyze & Add").closest("button")!);

      expect(mockToast.warning).toHaveBeenCalledWith(
        "格式错误，请仅输入英文单词或短语",
      );
    });

    it("submits word and updates UI on success", async () => {
      const user = userEvent.setup();
      mockProcessVocab.mockResolvedValueOnce({
        success: true,
        data: {
          meta: {
            status: "success",
            original_input: "wanderlust",
            corrected_word: null,
          },
          data: {
            id: "w3",
            word: "wanderlust",
            type: "culture",
            content: mockCultureContent,
            created_at: "2025-01-03",
          },
        },
      });
      mockFetchVocabDetail.mockResolvedValueOnce({
        success: true,
        data: {
          id: "w3",
          word: "wanderlust",
          type: "culture",
          content: mockCultureContent,
          created_at: "2025-01-03",
        },
      });

      render(<VocabNotebookPage />);

      await waitFor(() => {
        expect(screen.getByText("serendipity")).toBeInTheDocument();
      });

      await user.click(screen.getByTitle("Add New Word"));

      const input = screen.getByPlaceholderText("e.g. Serendipity");
      await user.type(input, "wanderlust");
      await user.click(screen.getByText("Analyze & Add").closest("button")!);

      await waitFor(() => {
        // Modal should close
        expect(screen.queryByText("Add New Word")).not.toBeInTheDocument();
        // New word appears in list
        expect(screen.getByText("wanderlust")).toBeInTheDocument();
      });
    });

    it("shows correction toast when word is corrected", async () => {
      const user = userEvent.setup();
      mockProcessVocab.mockResolvedValueOnce({
        success: true,
        data: {
          meta: {
            status: "corrected",
            original_input: "wandrlust",
            corrected_word: "wanderlust",
          },
          data: {
            id: "w3",
            word: "wanderlust",
            type: "culture",
            content: mockCultureContent,
            created_at: "2025-01-03",
          },
        },
      });

      render(<VocabNotebookPage />);

      await waitFor(() => {
        expect(screen.getByText("serendipity")).toBeInTheDocument();
      });

      await user.click(screen.getByTitle("Add New Word"));

      const input = screen.getByPlaceholderText("e.g. Serendipity");
      await user.type(input, "wandrlust");
      await user.click(screen.getByText("Analyze & Add").closest("button")!);

      await waitFor(() => {
        expect(mockToast.info).toHaveBeenCalledWith(
          expect.stringContaining("wandrlust"),
        );
      });
    });
  });

  // ================================================================
  // Type Switcher
  // ================================================================
  describe("Type Switcher", () => {
    it("switches from Cultural to Technical", async () => {
      const user = userEvent.setup();
      render(<VocabNotebookPage />);

      await waitFor(() => {
        expect(screen.getByText("Cultural")).toBeInTheDocument();
      });

      await user.click(screen.getByText("Cultural").closest("button")!);

      // After switch, fetchVocabListAction is called again with new type
      await waitFor(() => {
        expect(mockFetchVocabList).toHaveBeenCalledWith("tech");
      });
    });
  });

  // ================================================================
  // Story History
  // ================================================================
  describe("Story History", () => {
    it("toggles to story history view", async () => {
      const user = userEvent.setup();
      render(<VocabNotebookPage />);

      await waitFor(() => {
        expect(screen.getByText("serendipity")).toBeInTheDocument();
      });

      // Click "History Stories" button
      await user.click(screen.getByText("History Stories"));

      await waitFor(() => {
        expect(screen.getByText("A Great Story")).toBeInTheDocument();
        expect(screen.getByText("Saved Stories")).toBeInTheDocument();
      });
    });

    it("switches back to words view", async () => {
      const user = userEvent.setup();
      render(<VocabNotebookPage />);

      await waitFor(() => {
        expect(screen.getByText("serendipity")).toBeInTheDocument();
      });

      await user.click(screen.getByText("History Stories"));

      await waitFor(() => {
        expect(screen.getByText("A Great Story")).toBeInTheDocument();
      });

      await user.click(screen.getByText("Back to Words"));

      await waitFor(() => {
        expect(screen.getByText("serendipity")).toBeInTheDocument();
      });
    });

    it("renders story detail with markdown", async () => {
      const user = userEvent.setup();
      mockFetchStoryDetail.mockResolvedValueOnce({
        success: true,
        data: mockStoryEntry,
      });

      render(<VocabNotebookPage />);

      await waitFor(() => {
        expect(screen.getByText("serendipity")).toBeInTheDocument();
      });

      await user.click(screen.getByText("History Stories"));

      await waitFor(() => {
        expect(screen.getByText("A Great Story")).toBeInTheDocument();
      });

      await user.click(screen.getByText("A Great Story"));

      await waitFor(() => {
        expect(screen.getByText("AI Generated Story")).toBeInTheDocument();
        expect(screen.getByTestId("markdown")).toBeInTheDocument();
      });
    });
  });

  // ================================================================
  // Word Selection & Generate Story
  // ================================================================
  describe("Word Selection & Story Generation", () => {
    it("shows generate button with count", async () => {
      render(<VocabNotebookPage />);

      await waitFor(() => {
        expect(screen.getByText("serendipity")).toBeInTheDocument();
      });

      // Generate button should show count 0 and be disabled
      const generateBtn = screen.getByText(/Generate/).closest("button")!;
      expect(generateBtn).toBeDisabled();
      expect(screen.getByText("Generate (0)")).toBeInTheDocument();
    });

    it("toggles word selection via checkbox", async () => {
      const user = userEvent.setup();
      render(<VocabNotebookPage />);

      await waitFor(() => {
        expect(screen.getByText("serendipity")).toBeInTheDocument();
      });

      // Find the checkbox for serendipity (the small div with rounded border)
      const wordItem = screen
        .getByText("serendipity")
        .closest("[class*='group']")!;
      const checkbox = wordItem.querySelector("[class*='rounded border']")!;
      await user.click(checkbox);

      expect(screen.getByText("Generate (1)")).toBeInTheDocument();

      // Click again to deselect
      await user.click(checkbox);
      expect(screen.getByText("Generate (0)")).toBeInTheDocument();
    });
  });
});
