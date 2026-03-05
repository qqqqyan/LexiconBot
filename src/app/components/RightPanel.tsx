import React, { useRef, useEffect, useState } from "react";
import {
  Book,
  Volume2,
  Lightbulb,
  Brain,
  Globe,
  Link2,
  X,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { isCultureContent, isTechContent } from "../../types";
import { fetchVocabDetailAction } from "@/actions/vocab";
import { UI_ERROR_MESSAGES } from "@/lib/constants/ui-message";
import type { CacheWord, WordContent } from "../../types";
import type { AppView } from "../type";

interface Props {
  currentBrowseView: AppView;
  activeId: string | null;
  storyDetailSlot: React.ReactNode;
}

export const RightPanel: React.FC<Props> = ({
  currentBrowseView,
  activeId,
  storyDetailSlot,
}) => {
  const [cacheWords, setCacheWords] = useState<CacheWord>({});
  const cacheWordsRef = useRef<CacheWord>(cacheWords);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  useEffect(() => {
    const fetchWordEntry = async () => {
      setIsLoadingDetail(true);
      try {
        if (!activeId) return;

        const res = await fetchVocabDetailAction(activeId);
        if (res.success) {
          setCacheWords((prev) => {
            const next = { ...prev, [activeId]: res.data.content };
            cacheWordsRef.current = next; // 立即同步 ref，避免重渲染时守卫失效
            return next;
          });
        } else {
          toast.error(UI_ERROR_MESSAGES[res.errorCode]);
        }
      } catch {
        toast.error(UI_ERROR_MESSAGES.UI_NETWORK_ERROR);
      } finally {
        setIsLoadingDetail(false);
      }
    };
    if (currentBrowseView === "vocab" && activeId) {
      if (!cacheWordsRef.current[activeId]) {
        fetchWordEntry();
      }
    }
  }, [currentBrowseView, activeId]);

  const activeWordData = activeId ? cacheWords[activeId] : null;

  if (isLoadingDetail) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
        <p className="text-lg font-medium">Loading Words...</p>
      </div>
    );
  }

  if (!activeId) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4">
        <div className="w-24 h-24 bg-slate-200 rounded-full flex items-center justify-center">
          <Book className="w-10 h-10 text-slate-400" />
        </div>
        <p className="text-lg font-medium">
          Select a word or story to view details
        </p>
      </div>
    );
  }

  if (currentBrowseView === "story") {
    return storyDetailSlot;
  }

  if (!activeWordData) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4">
        <X className="w-10 h-10 text-slate-400" />
        <p className="text-lg font-medium">Failed to load the word.</p>
      </div>
    );
  }

  const wordEntry = activeWordData as WordContent;
  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Title Header - Shared */}
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

      {/* Definitions - Shared */}
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

      {/* Conditional Rendering based on Content Type */}
      {isCultureContent(wordEntry) && (
        <>
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
                {wordEntry.thinking_gap}
              </p>
            </section>
          </div>

          {/* Cultural Insight - Highlighted */}
          <section className="relative overflow-hidden rounded-2xl bg-liner-to-br from-indigo-900 to-slate-900 text-white p-8 shadow-xl">
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
                  className="flex flex-col bg-white p-3 rounded-lg border border-slate-200 shadow-sm max-w-50"
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
        </>
      )}

      {/* Technical Content Rendering */}
      {isTechContent(wordEntry) && (
        <>
          {/* ELI5 + Technical Context */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <section className="relative overflow-hidden rounded-2xl bg-liner-to-br from-purple-500 to-pink-500 text-white p-6 shadow-lg">
              <div className="absolute top-0 right-0 p-24 bg-white/10 rounded-full blur-2xl"></div>
              <div className="relative z-10">
                <h2 className="text-xs font-bold uppercase tracking-wider text-purple-100 mb-3 flex items-center gap-2">
                  <Lightbulb className="w-3 h-3" /> ELI5
                </h2>
                <p className="text-base leading-relaxed text-white/95">
                  {wordEntry.tech_logic.eli5}
                </p>
              </div>
            </section>

            <section className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
              <h2 className="text-xs font-bold uppercase tracking-wider text-blue-500 mb-3 flex items-center gap-2">
                <Brain className="w-3 h-3" /> Technical Context
              </h2>
              <p className="text-slate-700 leading-relaxed">
                {wordEntry.tech_logic.context_logic}
              </p>
            </section>
          </div>

          {/* Migration Bridge */}
          <section className="relative overflow-hidden rounded-2xl bg-liner-to-br from-slate-800 to-blue-900 text-white p-8 shadow-xl">
            <div className="absolute top-0 right-0 p-32 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
            <div className="relative z-10">
              <h2 className="text-sm font-bold uppercase tracking-widest text-blue-200 mb-6 flex items-center gap-2">
                <Globe className="w-4 h-4" /> Migration Bridge (中文 → English)
              </h2>
              <div className="space-y-4">
                <div>
                  <span className="text-xs font-bold text-blue-200 uppercase tracking-wider">
                    Chinese Term
                  </span>
                  <p className="text-xl font-medium text-white mt-1">
                    {wordEntry.migration_bridge.cn_term}
                  </p>
                </div>
                <div>
                  <span className="text-xs font-bold text-blue-200 uppercase tracking-wider">
                    Mental Shift
                  </span>
                  <p className="text-base leading-relaxed text-blue-50 mt-1">
                    {wordEntry.migration_bridge.mental_shift}
                  </p>
                </div>
                <div>
                  <span className="text-xs font-bold text-blue-200 uppercase tracking-wider">
                    Nuance
                  </span>
                  <p className="text-base leading-relaxed text-blue-50 mt-1 italic">
                    {wordEntry.migration_bridge.nuance}
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Usage Scenarios */}
          <section className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
              Usage Scenarios
            </h2>
            <div className="space-y-6">
              {wordEntry.scenarios.map((scenario, idx) => (
                <div
                  key={idx}
                  className="pl-4 border-l-2 border-purple-200 hover:border-purple-400 transition-colors"
                >
                  <div className="mb-2">
                    <span className="inline-block px-2 py-1 bg-purple-50 text-purple-700 text-xs font-bold rounded">
                      {scenario.type}
                    </span>
                  </div>
                  <p className="text-slate-800 text-base mb-2">
                    &ldquo;{scenario.sen}&rdquo;
                  </p>
                  <p className="text-slate-500 text-sm">
                    💡 Tip: {scenario.tip}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Collocations */}
          <section className="bg-slate-100 rounded-2xl p-6">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4 flex items-center gap-2">
              <Link2 className="w-3 h-3" /> Common Collocations
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {wordEntry.collocations.map((coll, idx) => (
                <div
                  key={idx}
                  className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm"
                >
                  <span className="font-bold text-slate-800 text-base block mb-2">
                    {coll.phrase}
                  </span>
                  <span className="text-sm text-slate-600 leading-snug">
                    {coll.note}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
};

export default RightPanel;
