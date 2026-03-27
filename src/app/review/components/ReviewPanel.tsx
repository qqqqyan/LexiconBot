"use client";

import { useState, useRef, useEffect } from "react";
import { Check, HelpCircle, AlertCircle, ArrowRight } from "lucide-react";
import { REVIEW_STATUS, ReviewStatusValue, VocabListItem } from "@/types";
import { updateVocabReviewStatusAction } from "@/actions/vocab";
import { ReviewResult } from "../type";
import { WordDetail } from "../../(vacab)/components/WordDetail";

interface ReviewPanelProps {
  reviewQueue: VocabListItem[];
  currentIndex: number;
  elapsedMs: number;
  onAnswerWord: (result: ReviewResult, elapsedDelta: number) => void;
  onDrawerClose: (elapsedDelta: number) => void;
  onComplete: (duration: number) => void;
}

export function ReviewPanel({
  reviewQueue,
  currentIndex,
  elapsedMs,
  onAnswerWord,
  onDrawerClose,
  onComplete,
}: ReviewPanelProps) {
  // avoid flash
  const [localIndex, setLocalIndex] = useState(currentIndex);
  // true when the drawer is open for the last word
  const pendingCompleteRef = useRef(false);
  // drawer
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerWordId, setDrawerWordId] = useState<number | null>(null);
  // tracks time
  const activeStartRef = useRef(0);
  // cumulative active time
  const cumulativeElapsedRef = useRef(elapsedMs);

  useEffect(() => {
    activeStartRef.current = Date.now();
  }, []);

  // computed
  const currentWord = reviewQueue[localIndex];
  if (!currentWord) return null;

  const updateDuration = () => {
    const delta = Date.now() - activeStartRef.current;
    const cumulative = cumulativeElapsedRef.current + delta;

    // refresh start time
    activeStartRef.current = Date.now();

    return [delta, cumulative];
  };

  const closeDrawer = (e?: React.MouseEvent<HTMLElement>) => {
    e?.stopPropagation();
    // update review duration
    const [delta, cumulative] = updateDuration();
    cumulativeElapsedRef.current = cumulative;
    onDrawerClose(delta);

    // update UI state
    setIsDrawerOpen(false);
    setLocalIndex((prev) => prev + 1);

    if (pendingCompleteRef.current) {
      pendingCompleteRef.current = false;
      onComplete(cumulativeElapsedRef.current);
    }
  };

  const handleOption = (status: ReviewStatusValue) => {
    const wordId = currentWord.id;
    const result: ReviewResult = { wordId, word: currentWord.word, status };

    // update review duration
    const [delta, cumulative] = updateDuration();
    cumulativeElapsedRef.current = cumulative;

    // sync Domain State
    onAnswerWord(result, delta);
    updateVocabReviewStatusAction(wordId, status).catch(() => {});

    // update UI state
    const isLast = localIndex + 1 >= reviewQueue.length;

    // KNOWN: no drawer, advance immediately
    if (status === REVIEW_STATUS.KNOWN) {
      if (isLast) {
        onComplete(cumulativeElapsedRef.current);
        return;
      }
      setLocalIndex((prev) => prev + 1);
      return;
    }

    // VAGUE or UNKNOWN: open drawer; delta2 will be recorded in closeDrawer
    setDrawerWordId(wordId);
    setIsDrawerOpen(true);
    if (isLast) {
      pendingCompleteRef.current = true;
    }
  };

  return (
    <>
      {/* Review Card */}
      <div className="relative w-full max-w-3xl mx-auto perspective-1000">
        {/* Progress Bar */}
        <div className="flex items-center gap-4 text-slate-400 text-sm font-medium mb-4 md:mb-0 md:absolute md:-top-12 md:left-0 md:right-0">
          <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-500 transition-all duration-300 ease-out"
              style={{ width: `${(localIndex / reviewQueue.length) * 100}%` }}
            />
          </div>
          <span>
            {localIndex + 1} / {reviewQueue.length}
          </span>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-20 text-center border border-slate-100 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-linear-to-r from-indigo-500 via-purple-500 to-pink-500" />

          <h1 className="text-4xl md:text-7xl font-black text-slate-900 mb-6 md:mb-8 tracking-tight">
            {currentWord.word}
          </h1>

          {/* Action Buttons */}
          <div className="grid grid-cols-3 gap-3 md:gap-8 mt-8 md:mt-12">
            <button
              onClick={() => handleOption(REVIEW_STATUS.KNOWN)}
              className="group flex flex-col items-center gap-2 md:gap-3 p-3 md:p-6 rounded-xl md:rounded-2xl bg-emerald-50 hover:bg-emerald-100 border-2 border-emerald-100 hover:border-emerald-300 transition-all"
            >
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-emerald-200 text-emerald-700 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Check className="w-5 h-5 md:w-6 md:h-6" strokeWidth={3} />
              </div>
              <span className="font-bold text-emerald-800 text-sm md:text-base">
                Know
              </span>
            </button>

            <button
              onClick={() => handleOption(REVIEW_STATUS.VAGUE)}
              className="group flex flex-col items-center gap-2 md:gap-3 p-3 md:p-6 rounded-xl md:rounded-2xl bg-amber-50 hover:bg-amber-100 border-2 border-amber-100 hover:border-amber-300 transition-all"
            >
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-amber-200 text-amber-700 flex items-center justify-center group-hover:scale-110 transition-transform">
                <HelpCircle className="w-5 h-5 md:w-6 md:h-6" strokeWidth={3} />
              </div>
              <span className="font-bold text-amber-800 text-sm md:text-base">
                Vague
              </span>
            </button>

            <button
              onClick={() => handleOption(REVIEW_STATUS.UNKNOWN)}
              className="group flex flex-col items-center gap-2 md:gap-3 p-3 md:p-6 rounded-xl md:rounded-2xl bg-rose-50 hover:bg-rose-100 border-2 border-rose-100 hover:border-rose-300 transition-all"
            >
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-rose-200 text-rose-700 flex items-center justify-center group-hover:scale-110 transition-transform">
                <AlertCircle
                  className="w-5 h-5 md:w-6 md:h-6"
                  strokeWidth={3}
                />
              </div>
              <span className="font-bold text-rose-800 text-sm md:text-base">
                Don&apos;t Know
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 transition-opacity duration-300 ${isDrawerOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        onClick={closeDrawer}
      />

      {/* Drawer Panel */}
      <div
        className={`
          fixed top-0 right-0 h-full w-full md:w-175 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-out flex flex-col
          ${isDrawerOpen ? "translate-x-0" : "translate-x-full"}
        `}
      >
        <div className="p-6 flex items-center justify-end shrink-0">
          <button
            onClick={closeDrawer}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors z-10 relative top-3"
          >
            Continue <ArrowRight className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 relative bottom-20">
          {isDrawerOpen && drawerWordId && <WordDetail id={drawerWordId} />}
        </div>
      </div>
    </>
  );
}
