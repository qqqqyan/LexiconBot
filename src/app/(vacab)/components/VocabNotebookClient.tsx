"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Book,
  Plus,
  Sparkles,
  Check,
  Search,
  History,
  FileText,
  ArrowLeftRight,
  Loader2,
  Brain,
  ChevronLeft,
} from "lucide-react";
import {
  generateAndSaveStoryAction,
  fetchStoryListAction,
} from "@/actions/story";
import { fetchVocabListAction } from "@/actions/vocab";
import type { StoryListItem, VocabListItem, VocabType } from "@/types";
import type { ViewState } from "../type";
import { UI_ERROR_MESSAGES } from "@/lib/constants/ui-message";
import { useRouteManager } from "../hooks/useRouteManager";
import AddWordModal from "./AddWordModal";
import { WordDetail } from "@/components/WordDetail";

// --- Components ---

interface Props {
  storyDetailSlot: React.ReactNode;
}

export const VocabNotebookClient: React.FC<Props> = ({ storyDetailSlot }) => {
  const {
    urlState,
    browseState,
    changeBrowseView,
    changeBrowseType,
    openDetail,
    closeDetail,
  } = useRouteManager();
  const router = useRouter();

  // Global Data State — 首次 mount 时客户端获取
  const [words, setWords] = useState<VocabListItem[]>([]);
  const [stories, setStories] = useState<StoryListItem[]>([]);

  // UI State
  const [loading, setLoading] = useState(true);
  const [selectedWordIds, setSelectedWordIds] = useState<Set<string>>(
    new Set(),
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [isGeneratingStory, setIsGeneratingStory] = useState(false);

  // Modal & Panel State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Computed State
  const { type: currentBrowseType, view: currentBrowseView } = browseState;
  const { id: activeId } = urlState;

  const filteredWords = searchTerm
    ? words.filter((w) =>
        w.word.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    : words;

  // Fetch Data — mount 时及用户切换 type 时请求
  useEffect(() => {
    let isStale = false;
    const fetchWords = async () => {
      setLoading(true);
      try {
        const res = await fetchVocabListAction(currentBrowseType);
        if (isStale) return;
        if (res.success) {
          setWords(res.data);
        } else {
          toast.error(UI_ERROR_MESSAGES[res.errorCode]);
        }
      } catch {
        toast.error(UI_ERROR_MESSAGES.UI_NETWORK_ERROR);
      } finally {
        setLoading(false);
      }
    };

    fetchWords();

    return () => {
      isStale = true;
    };
  }, [currentBrowseType]);

  useEffect(() => {
    const fetchInitialStories = async () => {
      setLoading(true);
      try {
        const res = await fetchStoryListAction();
        if (res.success) {
          setStories(res.data);
        } else {
          toast.error(UI_ERROR_MESSAGES[res.errorCode]);
        }
      } catch {
        toast.error(UI_ERROR_MESSAGES.UI_NETWORK_ERROR);
      } finally {
        setLoading(false);
      }
    };

    if (currentBrowseView === "story") {
      fetchInitialStories();
    }
  }, [currentBrowseView]);

  // --- Helpers ---

  const toggleSelection = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setSelectedWordIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleItemClick = async (viewMode: ViewState) => {
    if (!viewMode.id) return;
    openDetail(viewMode.view, currentBrowseType, viewMode.id);
  };

  const handleCloseAddModal = () => {
    setIsAddModalOpen(false);
  };

  const handleAddWordSuccess = (newWord: VocabListItem) => {
    openDetail("vocab", currentBrowseType, newWord.id);
    setWords((prev) => [newWord, ...prev]);
    setIsAddModalOpen(false);
  };

  // --- Actions ---

  const handleTypeSwitch = (newType: VocabType) => {
    changeBrowseType(newType);

    // Clear state (except word list, which will be reloaded by useEffect)
    setSelectedWordIds(new Set());
    setSearchTerm("");
  };

  const handleGenerateStory = async () => {
    if (isGeneratingStory) return;

    const selectedWordIdsArr = words
      .filter((w) => selectedWordIds.has(w.id))
      .map((w) => w.id);

    setIsGeneratingStory(true);
    try {
      const res = await generateAndSaveStoryAction(selectedWordIdsArr);
      if (res.success) {
        openDetail("story", currentBrowseType, res.data.id);
        setStories((prev) => [res.data, ...prev]);
        setSelectedWordIds(new Set());
      } else {
        toast.error(UI_ERROR_MESSAGES[res.errorCode]);
      }
    } catch {
      toast.error(UI_ERROR_MESSAGES.UI_NETWORK_ERROR);
    } finally {
      setIsGeneratingStory(false);
    }
  };

  // --- Sub-Components (Render Functions) ---

  const renderHeader = () => {
    return (
      <div className="p-5 border-b border-slate-100">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2 cursor-pointer">
              <Book className="w-5 h-5 text-indigo-600" />
              LexiconBot
            </h1>

            {/* Type Switcher - Single Button */}
            <button
              onClick={() =>
                handleTypeSwitch(
                  currentBrowseType === "culture" ? "tech" : "culture",
                )
              }
              className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-medium text-slate-700 transition-all"
              title="Switch vocabulary type"
            >
              <span>
                {currentBrowseType === "culture" ? "Cultural" : "Technical"}
              </span>
              <ArrowLeftRight className="w-3.5 h-3.5" />
            </button>

            {/* Review Button */}
            <button
              className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500 transition-colors"
              onClick={() => router.push("/review")}
              title="Start Review"
            >
              <Brain className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="relative flex items-center gap-2">
          <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder={
              currentBrowseView === "story"
                ? "Search stories..."
                : "Search vocabulary..."
            }
            className="flex-1 pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button
            className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors shrink-0"
            onClick={() => setIsAddModalOpen(true)}
            title="Add New Word"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  };

  const renderSidebarContent = () => {
    if (currentBrowseView === "story") {
      // --- Story History View ---
      return (
        <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1 bg-slate-50/50 animate-slide-up">
          <div className="px-3 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
            Saved Stories
          </div>
          {stories.map((story) => {
            const isActive =
              currentBrowseView === "story" &&
              urlState.view === "story" &&
              activeId === story.id;
            return (
              <div
                key={story.id}
                onClick={() => handleItemClick({ view: "story", id: story.id })}
                className={`
                   group flex flex-col p-3 rounded-lg cursor-pointer transition-all duration-200 border
                   ${isActive ? "bg-indigo-50 border-indigo-200 shadow-sm" : "bg-white border-slate-100 hover:border-slate-300"}
                 `}
              >
                <div className="flex items-start gap-3">
                  <FileText
                    className={`w-4 h-4 mt-1 shrink-0 ${isActive ? "text-indigo-600" : "text-slate-400"}`}
                  />
                  <div>
                    <span
                      className={`font-medium text-sm line-clamp-2 ${isActive ? "text-indigo-900" : "text-slate-700"}`}
                    >
                      {story.title}
                    </span>
                    <span className="text-xs text-slate-400 mt-1 block">
                      {new Date(story.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      );
    }

    // --- Word List View ---
    return (
      <div className="relative flex flex-col flex-1 min-h-0">
        {renderHeader()}

        <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-2 space-y-1">
          {loading ? (
            <div className="text-center py-10 text-slate-400 text-sm">
              Loading words...
            </div>
          ) : filteredWords.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-sm">
              No words found.
            </div>
          ) : (
            filteredWords.map((entry) => {
              const isActive =
                currentBrowseView === "vocab" &&
                urlState.view === "vocab" &&
                activeId === entry.id;
              const isSelected = selectedWordIds.has(entry.id);

              return (
                <div
                  key={entry.id}
                  onClick={() =>
                    handleItemClick({ view: "vocab", id: entry.id })
                  }
                  className={`
                  group flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all duration-200 border border-transparent
                  ${isActive ? "bg-indigo-50 border-indigo-100 shadow-sm" : "hover:bg-slate-50 hover:border-slate-200"}
                `}
                >
                  <div className="flex items-center gap-3 overflow-hidden w-full">
                    <div
                      onClick={(e) => toggleSelection(e, entry.id)}
                      className={`
                      w-5 h-5 rounded border flex items-center justify-center transition-all shrink-0 cursor-pointer
                      ${isSelected ? "bg-indigo-600 border-indigo-600" : "bg-white border-slate-300 hover:border-indigo-400"}
                    `}
                    >
                      {isSelected && (
                        <Check
                          className="w-3.5 h-3.5 text-white"
                          strokeWidth={3}
                        />
                      )}
                    </div>
                    <span
                      className={`font-medium truncate ${isActive ? "text-indigo-900" : "text-slate-700"}`}
                    >
                      {entry.word}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen w-full bg-slate-50 text-slate-800 font-sans overflow-hidden">
      <AddWordModal
        currentBrowseType={currentBrowseType}
        isAddModalOpen={isAddModalOpen}
        onCloseModal={handleCloseAddModal}
        onAddWordSuccess={handleAddWordSuccess}
      />

      {/* --- Left Sidebar: 移动端有 activeId 时隐藏，桌面端始终显示 --- */}
      <div
        className={`
        w-full md:w-80 shrink-0 flex flex-col border-r border-slate-200 bg-white h-full relative z-10 shadow-sm
        ${activeId ? "hidden md:flex" : "flex"}
      `}
      >
        {/* Dynamic List Area */}
        {renderSidebarContent()}

        {/* Floating Action Area / Footer */}
        <div className="shrink-0 p-4 border-t border-slate-100 bg-white/90 backdrop-blur-sm space-y-3">
          {currentBrowseView === "vocab" && (
            <button
              disabled={selectedWordIds.size === 0}
              onClick={handleGenerateStory}
              className={`
                w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold shadow-lg transition-all transform
                ${
                  selectedWordIds.size > 0
                    ? "bg-linear-to-r from-indigo-600 to-violet-600 text-white hover:scale-[1.02] shadow-indigo-200"
                    : "bg-slate-100 text-slate-400 cursor-not-allowed shadow-none"
                }
              `}
            >
              {isGeneratingStory ? (
                <Loader2 className="w-4 h-4" />
              ) : (
                <Sparkles
                  className={`w-4 h-4 ${selectedWordIds.size > 0 ? "animate-pulse" : ""}`}
                />
              )}
              <span>Generate ({selectedWordIds.size})</span>
            </button>
          )}

          <button
            onClick={() =>
              changeBrowseView(
                currentBrowseView === "vocab" ? "story" : "vocab",
              )
            }
            className={`
              w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-medium text-sm transition-all
              ${
                currentBrowseView === "story"
                  ? "bg-slate-800 text-white"
                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
              }
            `}
          >
            {currentBrowseView === "story" ? (
              <Book className="w-4 h-4" />
            ) : (
              <History className="w-4 h-4" />
            )}
            <span>
              {currentBrowseView === "story"
                ? "Back to Words"
                : "History Stories"}
            </span>
          </button>
        </div>
      </div>

      {/* --- Right Content: 移动端无 activeId 时隐藏，桌面端始终显示 --- */}
      <div
        className={`
        flex-1 h-full overflow-y-auto bg-slate-50/50 scroll-smooth relative
        ${!activeId ? "hidden md:block" : "block"}
      `}
      >
        {/* 移动端返回按钮：fixed 在顶部 */}
        {activeId && (
          <button
            onClick={closeDetail}
            className="md:hidden fixed top-0 left-0 right-0 z-20 w-full flex items-center gap-1 px-4 py-3 text-sm text-slate-500 hover:text-slate-700 border-b border-slate-100 bg-white/90 backdrop-blur-sm"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </button>
        )}

        <div className="pt-12 md:pt-0 p-6 md:p-10">
          {!activeId ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4">
              <div className="w-24 h-24 bg-slate-200 rounded-full flex items-center justify-center">
                <Book className="w-10 h-10 text-slate-400" />
              </div>
              <p className="text-lg font-medium">
                Select a word or story to view details
              </p>
            </div>
          ) : currentBrowseView === "story" ? (
            storyDetailSlot
          ) : (
            <WordDetail id={activeId} />
          )}
        </div>
      </div>
    </div>
  );
};

export default VocabNotebookClient;
