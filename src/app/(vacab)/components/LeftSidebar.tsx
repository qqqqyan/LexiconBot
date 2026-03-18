"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  Book,
  Plus,
  Sparkles,
  Search,
  History,
  FileText,
  ArrowLeftRight,
  Loader2,
  Brain,
} from "lucide-react";
import {
  generateAndSaveStoryAction,
  fetchStoryListAction,
} from "@/actions/story";
import { fetchVocabListAction } from "@/actions/vocab";
import type { StoryListItem, VocabListItem, VocabType } from "@/types";
import type { AppView, BrowseState } from "../type";
import { UI_ERROR_MESSAGES } from "@/lib/constants/ui-message";
import AddWordModal from "./AddWordModal";
import { WordItem } from "./WordItem";

interface Props {
  activeId: number | null;
  browseState: BrowseState;
  isVisible: boolean;
  onChangeBrowseView: (v: AppView) => void;
  onChangeBrowseType: (t: VocabType) => void;
  onOpenDetail: (view: AppView, type: VocabType, id: number) => void;
}

export const LeftSidebar = function LeftSidebar({
  activeId,
  browseState,
  isVisible,
  onChangeBrowseView,
  onChangeBrowseType,
  onOpenDetail,
}: Props) {
  const { view: currentBrowseView, type: currentBrowseType } = browseState;

  // --- Data State ---
  const [words, setWords] = useState<VocabListItem[]>([]);
  const [stories, setStories] = useState<StoryListItem[]>([]);

  // --- UI State ---
  const [isLoadingWords, setIsLoadingWords] = useState(true);
  const [isLoadingStories, setIsLoadingStories] = useState(false);
  const [selectedWordIds, setSelectedWordIds] = useState<Set<number>>(
    new Set(),
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [isGeneratingStory, setIsGeneratingStory] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // --- Computed ---
  const filteredWords = useMemo(
    () =>
      searchTerm
        ? words.filter((w) =>
            w.word.toLowerCase().includes(searchTerm.toLowerCase()),
          )
        : words,
    [words, searchTerm],
  );

  // --- Fetch: Words ---
  useEffect(() => {
    let isStale = false;
    setIsLoadingWords(true);
    fetchVocabListAction(currentBrowseType)
      .then((res) => {
        if (isStale) return;
        if (res.success) setWords(res.data);
        else toast.error(UI_ERROR_MESSAGES[res.errorCode]);
      })
      .catch(() => {
        if (!isStale) toast.error(UI_ERROR_MESSAGES.UI_NETWORK_ERROR);
      })
      .finally(() => {
        if (!isStale) setIsLoadingWords(false);
      });
    return () => {
      isStale = true;
    };
  }, [currentBrowseType]);

  // --- Fetch: Stories ---
  useEffect(() => {
    if (currentBrowseView !== "story") return;
    let isStale = false;
    setIsLoadingStories(true);
    fetchStoryListAction()
      .then((res) => {
        if (isStale) return;
        if (res.success) setStories(res.data);
        else toast.error(UI_ERROR_MESSAGES[res.errorCode]);
      })
      .catch(() => {
        if (!isStale) toast.error(UI_ERROR_MESSAGES.UI_NETWORK_ERROR);
      })
      .finally(() => {
        if (!isStale) setIsLoadingStories(false);
      });
    return () => {
      isStale = true;
    };
  }, [currentBrowseView]);

  // --- Callbacks ---

  const toggleSelection = useCallback((e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    setSelectedWordIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleWordClick = useCallback(
    (id: number) => onOpenDetail("vocab", currentBrowseType, id),
    [onOpenDetail, currentBrowseType],
  );

  const handleStoryClick = (id: number) =>
    onOpenDetail("story", currentBrowseType, id);

  const handleTypeSwitch = (newType: VocabType) => {
    onChangeBrowseType(newType);
    setSelectedWordIds(new Set());
    setSearchTerm("");
  };

  const handleAddWordSuccess = (newWord: VocabListItem) => {
    onOpenDetail("vocab", currentBrowseType, newWord.id);
    setWords((prev) => [newWord, ...prev]);
    setIsAddModalOpen(false);
  };

  const handleGenerateStory = async () => {
    if (isGeneratingStory) return;
    const ids = words.filter((w) => selectedWordIds.has(w.id)).map((w) => w.id);
    setIsGeneratingStory(true);
    try {
      const res = await generateAndSaveStoryAction(ids);
      if (res.success) {
        onOpenDetail("story", currentBrowseType, res.data.id);
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

  // --- Render ---
  return (
    <div
      className={`w-full md:w-80 shrink-0 flex flex-col border-r border-slate-200 bg-white h-full relative z-10 shadow-sm ${
        isVisible ? "flex" : "hidden md:flex"
      }`}
    >
      <AddWordModal
        currentBrowseType={currentBrowseType}
        isAddModalOpen={isAddModalOpen}
        onCloseModal={() => setIsAddModalOpen(false)}
        onAddWordSuccess={handleAddWordSuccess}
      />

      {/* Dynamic List Area */}
      {currentBrowseView === "story" ? (
        // Story List
        <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1 bg-slate-50/50 animate-slide-up">
          <div className="px-3 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
            Saved Stories
          </div>
          {isLoadingStories ? (
            <div className="text-center py-10 text-slate-400 text-sm">
              Loading stories...
            </div>
          ) : (
            stories.map((story) => {
              const isActive =
                currentBrowseView === "story" && activeId === story.id;
              return (
                <div
                  key={story.id}
                  onClick={() => handleStoryClick(story.id)}
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
            })
          )}
        </div>
      ) : (
        // Word List
        <div className="relative flex flex-col flex-1 min-h-0">
          {/* Header */}
          <div className="p-5 border-b border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <Book className="w-5 h-5 text-indigo-600" />
                  LexiconBot
                </h1>
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
                <Link
                  href="/review"
                  className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500 transition-colors"
                  title="Start Review"
                >
                  <Brain className="w-5 h-5" />
                </Link>
              </div>
            </div>
            <div className="relative flex items-center gap-2">
              <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search vocabulary..."
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

          {/* Word List */}
          <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-2 space-y-1">
            {isLoadingWords ? (
              <div className="text-center py-10 text-slate-400 text-sm">
                Loading words...
              </div>
            ) : filteredWords.length === 0 ? (
              <div className="text-center py-10 text-slate-400 text-sm">
                No words found.
              </div>
            ) : (
              filteredWords.map((entry) => (
                <WordItem
                  key={entry.id}
                  entry={entry}
                  isActive={
                    currentBrowseView === "vocab" && activeId == entry.id
                  }
                  isSelected={selectedWordIds.has(entry.id)}
                  onToggle={toggleSelection}
                  onClick={handleWordClick}
                />
              ))
            )}
          </div>
        </div>
      )}

      {/* Footer */}
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
            onChangeBrowseView(
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
  );
};
