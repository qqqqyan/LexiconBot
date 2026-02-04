"use client";

import React, { useState, useEffect, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";
import {
  Book,
  Plus,
  Sparkles,
  Check,
  Search,
  Volume2,
  Lightbulb,
  Brain,
  Globe,
  Link2,
  X,
  History,
  Loader2,
  FileText,
} from "lucide-react";
import {
  generateAndSaveStoryAction,
  fetchStoryDetailAction,
  fetchStoryListAction,
} from "../actions/story";
import {
  processVocabAction,
  fetchVocabDetailAction,
  fetchVocabListAction,
} from "../actions/vocab";
import type {
  CacheWord,
  CacheStory,
  StoryListItem,
  VocabListItem,
  WordContent,
} from "../types";
import type { ViewMode } from "./type";
import { UI_ERROR_MESSAGES } from "@/lib/constants/ui-message";
// --- Components ---

export const VocabNotebookPage: React.FC = () => {
  // Global Data State
  const [words, setWords] = useState<VocabListItem[]>([]);
  const [stories, setStories] = useState<StoryListItem[]>([]);

  // Data Cache
  const [cacheWords, setCacheWords] = useState<CacheWord>({});
  const [cacheStories, setCacheStories] = useState<CacheStory>({});

  // UI State
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>({
    type: "word",
    id: null,
  });
  const [selectedWordIds, setSelectedWordIds] = useState<Set<string>>(
    new Set(),
  );
  const [searchTerm, setSearchTerm] = useState("");

  // Modal & Panel State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // Modal Input State
  const [newWordInput, setNewWordInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  // Fetch Data
  useEffect(() => {
    const fetchInitialWords = async () => {
      setLoading(true);
      try {
        const res = await fetchVocabListAction();
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

    fetchInitialWords();
    fetchInitialStories();
  }, []);

  // --- Helpers & Computed ---

  const filteredWords = useMemo(
    () =>
      words.filter((w) =>
        w.word.toLowerCase().includes(searchTerm.toLowerCase()),
      ),
    [words, searchTerm],
  );

  const toggleSelection = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const newSet = new Set(selectedWordIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedWordIds(newSet);
  };

  const handleItemClick = async (viewMode: ViewMode) => {
    setViewMode(viewMode);
    const id = viewMode.id;
    if (!id) return;

    const isWord = viewMode.type === "word";
    const cache = isWord ? cacheWords : cacheStories;

    if (cache[id]) return;

    setIsLoadingDetail(true);
    try {
      const fetchAction = isWord
        ? fetchVocabDetailAction
        : fetchStoryDetailAction;
      const res = await fetchAction(id);
      if (res.success) {
        if (isWord) {
          setCacheWords((prev) => ({ ...prev, [id]: res.data.content }));
        } else {
          setCacheStories((prev) => ({ ...prev, [id]: res.data.content }));
        }
      } else {
        toast.error(UI_ERROR_MESSAGES[res.errorCode]);
      }
    } catch {
      toast.error(UI_ERROR_MESSAGES.UI_NETWORK_ERROR);
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const activeData = useMemo(() => {
    const id = viewMode.id;
    if (!id) return null;

    const isWord = viewMode.type === "word";
    const cache = isWord ? cacheWords : cacheStories;

    if (cache[id]) return cache[id];
  }, [cacheWords, cacheStories, viewMode]);

  // --- Actions ---

  const handleAddWord = async () => {
    const newWord = newWordInput.trim();
    if (!newWord) {
      toast.warning("请输入要添加的单词");
      return;
    }
    if (newWord.length > 24) {
      toast.warning("单词过长，请控制在24个字符以内");
      return;
    }
    if (!/^[a-zA-Z\s\-\']+$/.test(newWord)) {
      toast.warning("格式错误，请仅输入英文单词或短语");
      return;
    }
    setIsGenerating(true);
    try {
      const res = await processVocabAction(newWord);
      if (res.success) {
        const { meta, data } = res.data;
        if (meta.status === "corrected" && meta.corrected_word) {
          toast.info(
            `输入的单词 "${meta.original_input}" 已被更正为 "${meta.corrected_word}" 并添加到词库中。`,
          );
        }
        setWords((prev) => [data, ...prev]);
        setIsAddModalOpen(false);
        setNewWordInput("");
        setViewMode({ type: "word", id: data.id });
        setCacheWords((prev) => ({
          ...prev,
          [data.id]: data.content,
        }));
      } else {
        toast.error(UI_ERROR_MESSAGES[res.errorCode]);
      }
    } catch {
      toast.error(UI_ERROR_MESSAGES.UI_NETWORK_ERROR);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateStory = async () => {
    // Simulate generation
    const selectedWordIdsArr = words
      .filter((w) => selectedWordIds.has(w.id))
      .map((w) => w.id);

    setIsLoadingDetail(true);
    try {
      const res = await generateAndSaveStoryAction(selectedWordIdsArr);
      if (res.success) {
        setStories((prev) => [res.data, ...prev]);
        setSelectedWordIds(new Set());
        setIsHistoryOpen(true); // Switch to history view to see it in list
        setViewMode({ type: "story", id: res.data.id });
        setCacheStories((prev) => ({
          ...prev,
          [res.data.id]: res.data.content,
        }));
      } else {
        toast.error(UI_ERROR_MESSAGES[res.errorCode]);
      }
    } catch {
      toast.error(UI_ERROR_MESSAGES.UI_NETWORK_ERROR);
    } finally {
      setIsLoadingDetail(false);
    }
  };

  // --- Sub-Components (Render Functions) ---

  const renderAddWordModal = () => {
    if (!isAddModalOpen) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="bg-white w-full max-w-md p-6 rounded-2xl shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-slate-900">Add New Word</h2>
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">
                Word to Analyze
              </label>
              <input
                autoFocus
                type="text"
                value={newWordInput}
                onChange={(e) => setNewWordInput(e.target.value)}
                placeholder="e.g. Serendipity"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-lg"
                onKeyDown={(e) => e.key === "Enter" && handleAddWord()}
              />
            </div>
            <button
              onClick={handleAddWord}
              disabled={isGenerating || !newWordInput.trim()}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processing with AI...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Analyze & Add
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderSidebarContent = () => {
    if (isHistoryOpen) {
      // --- Story History View ---
      return (
        <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1 bg-slate-50/50 animate-in slide-in-from-left-4 duration-300">
          <div className="px-3 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
            Saved Stories
          </div>
          {stories.map((story) => {
            const isActive =
              viewMode.type === "story" && viewMode.id === story.id;
            return (
              <div
                key={story.id}
                onClick={() => handleItemClick({ type: "story", id: story.id })}
                className={`
                   group flex flex-col p-3 rounded-lg cursor-pointer transition-all duration-200 border
                   ${isActive ? "bg-indigo-50 border-indigo-200 shadow-sm" : "bg-white border-slate-100 hover:border-slate-300"}
                 `}
              >
                <div className="flex items-start gap-3">
                  <FileText
                    className={`w-4 h-4 mt-1 flex-shrink-0 ${isActive ? "text-indigo-600" : "text-slate-400"}`}
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
      <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
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
              viewMode.type === "word" && viewMode.id === entry.id;
            const isSelected = selectedWordIds.has(entry.id);

            return (
              <div
                key={entry.id}
                onClick={() => handleItemClick({ type: "word", id: entry.id })}
                className={`
                  group flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all duration-200 border border-transparent
                  ${isActive ? "bg-indigo-50 border-indigo-100 shadow-sm" : "hover:bg-slate-50 hover:border-slate-200"}
                `}
              >
                <div className="flex items-center gap-3 overflow-hidden w-full">
                  <div
                    onClick={(e) => toggleSelection(e, entry.id)}
                    className={`
                      w-5 h-5 rounded border flex items-center justify-center transition-all flex-shrink-0 cursor-pointer
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
    );
  };

  const renderRightPanel = () => {
    if (isLoadingDetail) {
      return (
        <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4">
          <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
          <p className="text-lg font-medium">Loading...</p>
        </div>
      );
    }

    if (!activeData) {
      return (
        <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4">
          <div className="w-24 h-24 bg-slate-200 rounded-full flex items-center justify-center">
            {viewMode.type === "story" ? (
              <FileText className="w-10 h-10 text-slate-400" />
            ) : (
              <Book className="w-10 h-10 text-slate-400" />
            )}
          </div>
          <p className="text-lg font-medium">
            Select a word or story to view details
          </p>
        </div>
      );
    }

    // Story View
    if (viewMode.type === "story") {
      const story = activeData as string;
      return (
        <div className="max-w-3xl mx-auto pb-20 animate-in fade-in duration-500">
          <div className="mb-6 border-b border-slate-200 pb-4">
            <span className="text-xs font-bold text-indigo-500 uppercase tracking-wider mb-2 block">
              AI Generated Story
            </span>
          </div>
          {/* Markdown Render Area */}
          <article className="prose prose-slate prose-lg max-w-none bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
            <ReactMarkdown>{story}</ReactMarkdown>
          </article>
        </div>
      );
    }

    // Word View
    const wordEntry = activeData as WordContent;
    return (
      <div className="max-w-4xl mx-auto space-y-8 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Title Header */}
        <div className="space-y-2 border-b border-slate-200 pb-6">
          <div className="flex items-end gap-4">
            <h1 className="text-5xl font-extrabold text-slate-900 tracking-tight">
              {wordEntry.word}
            </h1>
            <div className="flex items-center gap-2 text-2xl text-slate-500 font-serif italic mb-1.5">
              <span>{wordEntry.phonetic}</span>
              <button className="p-2 rounded-full hover:bg-slate-200 transition-colors">
                <Volume2 className="w-5 h-5 text-slate-400" />
              </button>
            </div>
          </div>
        </div>

        {/* Definitions */}
        <section className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
            <Book className="w-3 h-3" /> Definitions
          </h2>
          <div className="space-y-4">
            {wordEntry.definitions.map((def, idx) => (
              <div key={idx} className="flex gap-4 items-start group">
                <span className="px-2 py-1 bg-indigo-50 text-indigo-700 text-xs font-bold rounded uppercase tracking-wide mt-0.5">
                  {def.pos}
                </span>
                <div className="space-y-1">
                  <p className="text-lg font-medium text-slate-900">{def.en}</p>
                  <p className="text-slate-500 font-normal">{def.cn}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Logic & Thinking Gap */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <section className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <h2 className="text-xs font-bold uppercase tracking-wider text-blue-500 mb-3 flex items-center gap-2">
              <Brain className="w-3 h-3" /> Context Logic
            </h2>
            <p className="text-slate-700 leading-relaxed">
              {wordEntry.context_logic}
            </p>
          </section>

          <section className="bg-amber-50/50 rounded-2xl p-6 shadow-sm border border-amber-100/50">
            <h2 className="text-xs font-bold uppercase tracking-wider text-amber-600 mb-3 flex items-center gap-2">
              <Lightbulb className="w-3 h-3" /> Thinking Gap
            </h2>
            <p className="text-slate-700 leading-relaxed italic">
              `{wordEntry.thinking_gap}`
            </p>
          </section>
        </div>

        {/* Cultural Insight - Highlighted */}
        <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-900 to-slate-900 text-white p-8 shadow-xl">
          <div className="absolute top-0 right-0 p-32 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          <div className="relative z-10">
            <h2 className="text-sm font-bold uppercase tracking-widest text-indigo-200 mb-4 flex items-center gap-2">
              <Globe className="w-4 h-4" /> Cultural Insight
            </h2>
            <p className="text-xl font-light leading-relaxed text-indigo-50 font-serif">
              {wordEntry.cultural_insight}
            </p>
          </div>
        </section>

        {/* Examples */}
        <section className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
            Examples
          </h2>
          <div className="space-y-6">
            {wordEntry.examples.map((ex, idx) => (
              <div
                key={idx}
                className="pl-4 border-l-2 border-slate-200 hover:border-indigo-400 transition-colors"
              >
                <div className="mb-1">
                  <span className="text-xs font-semibold text-slate-400 uppercase mr-2">
                    [{ex.tag}]
                  </span>
                </div>
                <p className="text-slate-800 text-lg mb-1">{ex.sen}</p>
                <p className="text-slate-500">{ex.trans}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Cultural Connections */}
        <section className="bg-slate-100 rounded-2xl p-6">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4 flex items-center gap-2">
            <Link2 className="w-3 h-3" /> Connections
          </h2>
          <div className="flex flex-wrap gap-3">
            {wordEntry.cultural_connections.map((conn, idx) => (
              <div
                key={idx}
                className="flex flex-col bg-white p-3 rounded-lg border border-slate-200 shadow-sm max-w-[200px]"
              >
                <span className="font-bold text-slate-800 border-b border-slate-100 pb-1 mb-1">
                  {conn.term}
                </span>
                <span className="text-xs text-slate-500 leading-snug">
                  {conn.connection_logic}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>
    );
  };

  return (
    <div className="flex h-screen w-full bg-slate-50 text-slate-800 font-sans overflow-hidden">
      {renderAddWordModal()}

      {/* --- Left Sidebar --- */}
      <div className="w-80 flex-shrink-0 flex flex-col border-r border-slate-200 bg-white h-full relative z-10 shadow-sm">
        {/* Header */}
        <div className="p-5 border-b border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <h1
              className="text-xl font-bold text-slate-900 flex items-center gap-2 cursor-pointer"
              onClick={() => {
                setIsHistoryOpen(false);
                setViewMode({ type: "word", id: null });
              }}
            >
              <Book className="w-5 h-5 text-indigo-600" />
              LexiconBot
            </h1>
            <button
              className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500 transition-colors"
              onClick={() => setIsAddModalOpen(true)}
              title="Add New Word"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>

          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder={
                isHistoryOpen ? "Search stories..." : "Search vocabulary..."
              }
              className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Dynamic List Area */}
        {renderSidebarContent()}

        {/* Floating Action Area / Footer */}
        <div className="p-4 border-t border-slate-100 bg-white/90 backdrop-blur-sm space-y-3">
          {!isHistoryOpen && (
            <button
              disabled={selectedWordIds.size === 0}
              onClick={handleGenerateStory}
              className={`
                w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold shadow-lg transition-all transform
                ${
                  selectedWordIds.size > 0
                    ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:scale-[1.02] shadow-indigo-200"
                    : "bg-slate-100 text-slate-400 cursor-not-allowed shadow-none"
                }
              `}
            >
              <Sparkles
                className={`w-4 h-4 ${selectedWordIds.size > 0 ? "animate-pulse" : ""}`}
              />
              <span>Generate ({selectedWordIds.size})</span>
            </button>
          )}

          <button
            onClick={() => setIsHistoryOpen(!isHistoryOpen)}
            className={`
              w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-medium text-sm transition-all
              ${
                isHistoryOpen
                  ? "bg-slate-800 text-white"
                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
              }
            `}
          >
            {isHistoryOpen ? (
              <Book className="w-4 h-4" />
            ) : (
              <History className="w-4 h-4" />
            )}
            <span>{isHistoryOpen ? "Back to Words" : "History Stories"}</span>
          </button>
        </div>
      </div>

      {/* --- Right Content --- */}
      <div className="flex-1 h-full overflow-y-auto bg-slate-50/50 p-6 md:p-10 scroll-smooth">
        {renderRightPanel()}
      </div>
    </div>
  );
};

export default VocabNotebookPage;
