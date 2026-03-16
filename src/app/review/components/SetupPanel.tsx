"use client";

import { useState, useEffect } from "react";
import { X, Settings, Play, Loader2 } from "lucide-react";
import { VocabType } from "@/types";
import { fetchVocabListInfoAction } from "@/actions/vocab";
import { startSessionAction } from "@/actions/review";
import { UI_ERROR_MESSAGES } from "@/lib/constants/ui-message";
import { toast } from "sonner";
import { ReviewMode, SessionBridgeData } from "../type";

interface SetupPanelProps {
  onSessionStarted: (data: SessionBridgeData) => void;
  onExit: () => void;
}

export function SetupPanel({
  onSessionStarted,
  onExit,
}: SetupPanelProps) {
  const [vocabInfo, setVocabInfo] = useState({ tech: 0, culture: 0 });
  const [vocabType, setVocabType] = useState<VocabType>("culture");
  const [reviewMode, setReviewMode] = useState<ReviewMode>("random");
  const [rangeStart, setRangeStart] = useState(0);
  const [rangeEnd, setRangeEnd] = useState(0);
  const [randomCount, setRandomCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const currentVocabCount = vocabInfo[vocabType] || 0;

  useEffect(() => {
    fetchVocabListInfoAction()
      .then((res) => {
        if (res.success) setVocabInfo(res.data);
        else toast.error(UI_ERROR_MESSAGES[res.errorCode]);
      })
      .catch(() => toast.error(UI_ERROR_MESSAGES.UI_NETWORK_ERROR));
  }, []);

  useEffect(() => {
    setRangeEnd(Math.min(currentVocabCount, 10));
    setRandomCount(Math.min(currentVocabCount, 5));
  }, [currentVocabCount]);

  const handleStart = async () => {
    setIsLoading(true);
    try {
      const res = await startSessionAction({
        vocabType,
        reviewParams:
          reviewMode === "random"
            ? { reviewMode: "random", random_count: randomCount }
            : {
                reviewMode: "sequential",
                sequential_range: { start: rangeStart, end: rangeEnd },
              },
      });
      if (res.success) {
        onSessionStarted({
          sessionId: res.data.session.id,
          sessionStartTime: new Date(res.data.session.created_at).getTime(),
          reviewQueue: res.data.vocabList,
        });
      } else {
        toast.error(UI_ERROR_MESSAGES[res.errorCode]);
        setIsLoading(false);
      }
    } catch {
      toast.error(UI_ERROR_MESSAGES.UI_NETWORK_ERROR);
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto w-full bg-white rounded-2xl shadow-xl p-8 animate-in zoom-in-95 duration-300">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
          <Settings className="w-8 h-8 text-indigo-600" />
          Review Setup
        </h2>
        <button
          onClick={onExit}
          className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          <p className="text-base text-slate-500 text-right">
            Preparing your review session...
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* VocabType Selection */}
          <div className="space-y-3">
            <label className="text-sm font-bold text-slate-500 uppercase tracking-wider">
              Word VocabType
            </label>
            <div className="grid grid-cols-2 gap-4">
              {(["tech", "culture"] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setVocabType(cat)}
                  className={`
                  py-4 px-6 rounded-xl border-2 font-semibold text-lg capitalize transition-all
                  ${
                    vocabType === cat
                      ? "border-indigo-600 bg-indigo-50 text-indigo-700 shadow-sm"
                      : "border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                  }
                `}
                >
                  {cat}
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-400 text-right">
              Available Words: {currentVocabCount}
            </p>
          </div>

          {/* ReviewMode Selection */}
          <div className="space-y-3">
            <label className="text-sm font-bold text-slate-500 uppercase tracking-wider">
              Selection Mode
            </label>
            <div className="flex bg-slate-100 p-1 rounded-xl">
              {(["sequential", "random"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setReviewMode(m)}
                  className={`
                  flex-1 py-2.5 rounded-lg text-sm font-medium transition-all capitalize
                  ${
                    reviewMode === m
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }
                `}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Range/Count Inputs */}
          <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
            {reviewMode === "sequential" ? (
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-slate-500 mb-1">
                    Start Index
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={currentVocabCount}
                    value={rangeStart}
                    onChange={(e) => setRangeStart(Number(e.target.value))}
                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <span className="text-slate-400 mt-5">to</span>
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-slate-500 mb-1">
                    End Index
                  </label>
                  <input
                    type="number"
                    min={rangeStart}
                    max={currentVocabCount}
                    value={rangeEnd}
                    onChange={(e) => setRangeEnd(Number(e.target.value))}
                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">
                  Number of Words
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min={1}
                    max={currentVocabCount}
                    value={randomCount}
                    onChange={(e) => setRandomCount(Number(e.target.value))}
                    className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                  <span className="text-lg font-bold text-indigo-600 w-12 text-center">
                    {randomCount}
                  </span>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={handleStart}
            disabled={currentVocabCount === 0}
            className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-lg shadow-lg shadow-indigo-200 transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Play className="w-5 h-5 fill-current" />
            Start Review
          </button>
        </div>
      )}
    </div>
  );
}
