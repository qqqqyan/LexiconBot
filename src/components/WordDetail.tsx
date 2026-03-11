"use client";

import React, { useEffect, useState } from "react";
import {
  Book,
  Volume2,
  Lightbulb,
  Brain,
  Globe,
  Link2,
  Loader2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { isCultureContent, isTechContent, WordContent } from "@/types";
import { fetchVocabDetailAction } from "@/actions/vocab";
import { UI_ERROR_MESSAGES } from "@/lib/constants/ui-message";

interface WordDetailProps {
  id: string;
}

export const WordDetail: React.FC<WordDetailProps> = ({ id }) => {
  const [wordData, setWordData] = useState<WordContent | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchWordEntry = async () => {
      setIsLoading(true);
      try {
        const res = await fetchVocabDetailAction(id);
        if (res.success) {
          setWordData(res.data.content);
        } else {
          toast.error(UI_ERROR_MESSAGES[res.errorCode]);
        }
      } catch {
        toast.error(UI_ERROR_MESSAGES.UI_NETWORK_ERROR);
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchWordEntry();
    }
  }, [id]);

  if (isLoading) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
        <p className="text-lg font-medium">Loading Word...</p>
      </div>
    );
  }

  if (!wordData) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4">
        <X className="w-10 h-10 text-slate-400" />
        <p className="text-lg font-medium">Failed to load the word.</p>
      </div>
    );
  }

  const wordEntry = wordData;

  return (
    <div className="max-w-4xl mx-auto space-y-5 md:space-y-8 pb-12 md:pb-20 px-4 md:px-0 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Title Header - Shared */}
      <div className="space-y-2 border-b border-slate-200 pb-4 md:pb-6">
        <div className="flex items-end gap-3 md:gap-4 flex-wrap">
          <h1 className="text-3xl md:text-5xl font-extrabold text-slate-900 tracking-tight">
            {wordEntry.word}
          </h1>
          <div className="flex items-center gap-2 text-lg md:text-2xl text-slate-500 font-serif italic mb-0.5 md:mb-1.5">
            <span>{wordEntry.phonetic}</span>
            <button className="p-1.5 md:p-2 rounded-full hover:bg-slate-200 transition-colors">
              <Volume2 className="w-4 h-4 md:w-5 md:h-5 text-slate-400" />
            </button>
          </div>
        </div>
      </div>

      {/* Definitions - Shared */}
      <section className="bg-white rounded-xl md:rounded-2xl p-4 md:p-6 shadow-sm border border-slate-100">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 md:mb-4 flex items-center gap-2">
          <Book className="w-3 h-3" /> Definitions
        </h2>
        <div className="space-y-3 md:space-y-4">
          {wordEntry.definitions.map((def, idx) => (
            <div key={idx} className="flex gap-3 md:gap-4 items-start group">
              <span className="px-2 py-0.5 md:py-1 bg-indigo-50 text-indigo-700 text-xs font-bold rounded uppercase tracking-wide mt-0.5 shrink-0">
                {def.pos}
              </span>
              <div className="space-y-0.5 md:space-y-1">
                <p className="text-base md:text-lg font-medium text-slate-900">
                  {def.en}
                </p>
                <p className="text-sm md:text-base text-slate-500 font-normal">
                  {def.cn}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Conditional Rendering based on Content Type */}
      {isCultureContent(wordEntry) && (
        <>
          {/* Logic & Thinking Gap */}
          <div className="flex flex-col gap-4">
            <section className="bg-white rounded-xl md:rounded-2xl p-4 md:p-6 shadow-sm border border-slate-100">
              <h2 className="text-xs font-bold uppercase tracking-wider text-blue-500 mb-2 md:mb-3 flex items-center gap-2">
                <Brain className="w-3 h-3" /> Context Logic
              </h2>
              <p className="text-sm md:text-base text-slate-700 leading-relaxed">
                {wordEntry.context_logic}
              </p>
            </section>

            <section className="bg-amber-50/50 rounded-xl md:rounded-2xl p-4 md:p-6 shadow-sm border border-amber-100/50">
              <h2 className="text-xs font-bold uppercase tracking-wider text-amber-600 mb-2 md:mb-3 flex items-center gap-2">
                <Lightbulb className="w-3 h-3" /> Thinking Gap
              </h2>
              <p className="text-sm md:text-base text-slate-700 leading-relaxed italic">
                {wordEntry.thinking_gap}
              </p>
            </section>
          </div>

          {/* Cultural Insight - Highlighted */}
          <section className="relative overflow-hidden rounded-xl md:rounded-2xl bg-linear-to-br from-indigo-900 to-slate-900 text-white p-5 md:p-8 shadow-xl">
            <div className="absolute top-0 right-0 p-24 md:p-32 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
            <div className="relative z-10">
              <h2 className="text-xs md:text-sm font-bold uppercase tracking-widest text-indigo-200 mb-3 md:mb-4 flex items-center gap-2">
                <Globe className="w-3.5 h-3.5 md:w-4 md:h-4" /> Cultural Insight
              </h2>
              <p className="text-sm md:text-base font-light leading-relaxed text-indigo-50 font-serif">
                {wordEntry.cultural_insight}
              </p>
            </div>
          </section>

          {/* Examples */}
          <section className="bg-white rounded-xl md:rounded-2xl p-4 md:p-6 shadow-sm border border-slate-100">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 md:mb-4">
              Examples
            </h2>
            <div className="space-y-4 md:space-y-6">
              {wordEntry.examples.map((ex, idx) => (
                <div
                  key={idx}
                  className="pl-3 md:pl-4 border-l-2 border-slate-200 hover:border-indigo-400 transition-colors"
                >
                  <div className="mb-1">
                    <span className="text-xs font-semibold text-slate-400 uppercase mr-2">
                      [{ex.tag}]
                    </span>
                  </div>
                  <p className="text-slate-800 text-base md:text-lg mb-1">
                    {ex.sen}
                  </p>
                  <p className="text-sm md:text-base text-slate-500">
                    {ex.trans}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Cultural Connections */}
          <section className="bg-slate-100 rounded-xl md:rounded-2xl p-4 md:p-6">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 md:mb-4 flex items-center gap-2">
              <Link2 className="w-3 h-3" /> Connections
            </h2>
            <div className="flex flex-wrap gap-2 md:gap-3">
              {wordEntry.cultural_connections.map((conn, idx) => (
                <div
                  key={idx}
                  className="flex flex-col bg-white p-2.5 md:p-3 rounded-lg border border-slate-200 shadow-sm max-w-44 md:max-w-50"
                >
                  <span className="font-bold text-sm md:text-base text-slate-800 border-b border-slate-100 pb-1 mb-1">
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <section className="relative overflow-hidden rounded-xl md:rounded-2xl bg-linear-to-br from-purple-500 to-pink-500 text-white p-4 md:p-6 shadow-lg">
              <div className="absolute top-0 right-0 p-16 md:p-24 bg-white/10 rounded-full blur-2xl"></div>
              <div className="relative z-10">
                <h2 className="text-xs font-bold uppercase tracking-wider text-purple-100 mb-2 md:mb-3 flex items-center gap-2">
                  <Lightbulb className="w-3 h-3" /> ELI5
                </h2>
                <p className="text-sm md:text-base leading-relaxed text-white/95">
                  {wordEntry.tech_logic.eli5}
                </p>
              </div>
            </section>

            <section className="bg-white rounded-xl md:rounded-2xl p-4 md:p-6 shadow-sm border border-slate-100">
              <h2 className="text-xs font-bold uppercase tracking-wider text-blue-500 mb-2 md:mb-3 flex items-center gap-2">
                <Brain className="w-3 h-3" /> Technical Context
              </h2>
              <p className="text-sm md:text-base text-slate-700 leading-relaxed">
                {wordEntry.tech_logic.context_logic}
              </p>
            </section>
          </div>

          {/* Migration Bridge */}
          <section className="relative overflow-hidden rounded-xl md:rounded-2xl bg-linear-to-br from-slate-800 to-blue-900 text-white p-5 md:p-8 shadow-xl">
            <div className="absolute top-0 right-0 p-24 md:p-32 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
            <div className="relative z-10">
              <h2 className="text-xs md:text-sm font-bold uppercase tracking-widest text-blue-200 mb-4 md:mb-6 flex items-center gap-2">
                <Globe className="w-3.5 h-3.5 md:w-4 md:h-4" /> Migration Bridge
                (中文 → English)
              </h2>
              <div className="space-y-3 md:space-y-4">
                <div>
                  <span className="text-xs font-bold text-blue-200 uppercase tracking-wider">
                    Chinese Term
                  </span>
                  <p className="text-lg md:text-xl font-medium text-white mt-1">
                    {wordEntry.migration_bridge.cn_term}
                  </p>
                </div>
                <div>
                  <span className="text-xs font-bold text-blue-200 uppercase tracking-wider">
                    Mental Shift
                  </span>
                  <p className="text-sm md:text-base leading-relaxed text-blue-50 mt-1">
                    {wordEntry.migration_bridge.mental_shift}
                  </p>
                </div>
                <div>
                  <span className="text-xs font-bold text-blue-200 uppercase tracking-wider">
                    Nuance
                  </span>
                  <p className="text-sm md:text-base leading-relaxed text-blue-50 mt-1 italic">
                    {wordEntry.migration_bridge.nuance}
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Usage Scenarios */}
          <section className="bg-white rounded-xl md:rounded-2xl p-4 md:p-6 shadow-sm border border-slate-100">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 md:mb-4">
              Usage Scenarios
            </h2>
            <div className="space-y-4 md:space-y-6">
              {wordEntry.scenarios.map((scenario, idx) => (
                <div
                  key={idx}
                  className="pl-3 md:pl-4 border-l-2 border-purple-200 hover:border-purple-400 transition-colors"
                >
                  <div className="mb-2">
                    <span className="inline-block px-2 py-0.5 md:py-1 bg-purple-50 text-purple-700 text-xs font-bold rounded">
                      {scenario.type}
                    </span>
                  </div>
                  <p className="text-slate-800 text-sm md:text-base mb-2">
                    &ldquo;{scenario.sen}&rdquo;
                  </p>
                  <p className="text-slate-500 text-xs md:text-sm">
                    Tip: {scenario.tip}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Collocations */}
          <section className="bg-slate-100 rounded-xl md:rounded-2xl p-4 md:p-6">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 md:mb-4 flex items-center gap-2">
              <Link2 className="w-3 h-3" /> Common Collocations
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
              {wordEntry.collocations.map((coll, idx) => (
                <div
                  key={idx}
                  className="bg-white p-3 md:p-4 rounded-lg border border-slate-200 shadow-sm"
                >
                  <span className="font-bold text-slate-800 text-sm md:text-base block mb-1.5 md:mb-2">
                    {coll.phrase}
                  </span>
                  <span className="text-xs md:text-sm text-slate-600 leading-snug">
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

export default WordDetail;
