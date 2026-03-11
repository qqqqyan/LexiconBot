"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  getReviewStatusLabel,
  REVIEW_STATUS,
  VocabListItem,
  VocabType,
} from "@/types";
import {
  X,
  Check,
  HelpCircle,
  AlertCircle,
  Settings,
  Play,
  RotateCcw,
  Clock,
  BarChart3,
  BookOpen,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { ReviewMode, ReviewStep } from "./type";
import { ReviewStatusValue } from "@/types";
import {
  fetchVocabListInfoAction,
  updateVocabReviewStatusAction,
} from "@/actions/vocab";
import { WordDetail } from "@/components/WordDetail";
import { UI_ERROR_MESSAGES } from "@/lib/constants/ui-message";
import { completeSessionAction, startSessionAction } from "@/actions/review";

interface ReviewResult {
  wordId: string;
  word: string;
  status: ReviewStatusValue;
}

export default function ReviewPage() {
  const router = useRouter();

  // --- State ---
  const [step, setStep] = useState<ReviewStep>("setup");

  // Setup State
  const [vocabInfo, setVocabInfo] = useState({
    tech: 0,
    culture: 0,
  });
  const [vocabType, setVocabType] = useState<VocabType>("culture");
  const [reviewMode, setReviewMode] = useState<ReviewMode>("random");
  const [rangeStart, setRangeStart] = useState(1);
  const [rangeEnd, setRangeEnd] = useState(1);
  const [randomCount, setRandomCount] = useState(1);

  // Review State
  const [sessionId, setSessionId] = useState<string>();
  const [reviewQueue, setReviewQueue] = useState<VocabListItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [results, setResults] = useState<ReviewResult[]>([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState<number>(0);
  const [totalDuration, setTotalDuration] = useState<number>(0);

  // Loading
  const [isLoading, setIsLoading] = useState(false);

  const vocabInfoRef = useRef(vocabInfo);

  useEffect(() => {
    try {
      fetchVocabListInfoAction().then((res) => {
        if (res.success) {
          const vocabInfo = res.data;
          setVocabInfo(vocabInfo);
          vocabInfoRef.current = vocabInfo;
        } else {
          toast.error(UI_ERROR_MESSAGES[res.errorCode]);
        }
      });
    } catch {
      toast.error(UI_ERROR_MESSAGES.UI_NETWORK_ERROR);
    }
  }, []);

  useEffect(() => {
    const initialCount = vocabInfoRef.current[vocabType];
    setRangeEnd(Math.max(Math.min(initialCount, 10), 10));
    setRandomCount(Math.max(Math.min(initialCount, 5), 5));
  }, [vocabType]);

  // --- Computed Values ---

  const currentVocabCount = vocabInfo[vocabType] || 0;

  // --- Helpers ---

  const onExit = () => {
    router.push("/"); // Navigate back to main notebook page
  };

  // --- Actions ---

  const startReview = async () => {
    setIsLoading(true);
    try {
      const res = await startSessionAction({
        vocabType,
        reviewParams: {
          ...(reviewMode === "random"
            ? { reviewMode: "random", random_count: randomCount }
            : {
                reviewMode: "sequential",
                sequential_range: { start: rangeStart, end: rangeEnd },
              }),
        },
      });
      if (res.success) {
        setStep("review");
        setSessionId(res.data.session.id);
        setSessionStartTime(new Date(res.data.session.created_at).getTime());
        setReviewQueue(res.data.vocabList);
        setCurrentIndex(0);
        setResults([]);
      } else toast.error(UI_ERROR_MESSAGES[res.errorCode]);
    } catch {
      toast.error(UI_ERROR_MESSAGES.UI_NETWORK_ERROR);
      return;
    } finally {
      setIsLoading(false);
    }
  };

  const moveToNext = async (e?: React.MouseEvent<HTMLElement>) => {
    e?.stopPropagation();
    setIsDrawerOpen(false);
    if (currentIndex < reviewQueue.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setStep("summary");
      const duration = Date.now() - sessionStartTime;
      setTotalDuration(duration);

      if (!sessionId) {
        return;
      }
      completeSessionAction(sessionId, duration)
        .then((res) => {
          if (!res.success) {
            // TODO: 不成功时静默重试
          }
        })
        .catch(() => {
          toast.error(UI_ERROR_MESSAGES.UI_NETWORK_ERROR);
        });
    }
  };

  const handleOption = async (status: ReviewStatusValue) => {
    const currentWord = reviewQueue[currentIndex];

    const newResult: ReviewResult = {
      wordId: currentWord.id,
      word: currentWord.word,
      status,
    };
    setResults((prev) => [...prev, newResult]);

    updateVocabReviewStatusAction(currentWord.id, status)
      .then((res) => {
        if (!res.success) {
          // TODO: 不成功时静默重试
        }
      })
      .catch(() => {
        toast.error(UI_ERROR_MESSAGES.UI_NETWORK_ERROR);
      });

    if (status === REVIEW_STATUS.KNOWN) {
      moveToNext();
    } else {
      // Show drawer for Vague/Unknown
      setIsDrawerOpen(true);
    }
  };

  const restart = () => {
    setStep("setup");
    setResults([]);
    setReviewQueue([]);
    setIsDrawerOpen(false);
  };

  // --- Renderers ---

  const renderSetup = () => (
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
            onClick={startReview}
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

  const renderReviewCard = () => {
    const currentWord = reviewQueue[currentIndex];
    if (!currentWord) return null;

    return (
      <div className="relative w-full max-w-3xl mx-auto perspective-1000">
        {/* Progress Bar: inline on mobile, absolute on desktop */}
        <div className="flex items-center gap-4 text-slate-400 text-sm font-medium mb-4 md:mb-0 md:absolute md:-top-12 md:left-0 md:right-0">
          <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-500 transition-all duration-300 ease-out"
              style={{ width: `${(currentIndex / reviewQueue.length) * 100}%` }}
            />
          </div>
          <span>
            {currentIndex + 1} / {reviewQueue.length}
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
    );
  };

  const renderDrawer = () => {
    const currentWord = reviewQueue[currentIndex];
    if (!currentWord) return null;

    return (
      <>
        {/* Backdrop */}
        <div
          className={`fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 transition-opacity duration-300 ${isDrawerOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}
          onClick={(e) => moveToNext(e)}
        />

        {/* Drawer Panel */}
        <div
          className={`
            fixed top-0 right-0 h-full w-full md:w-175 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-out flex flex-col
            ${isDrawerOpen ? "translate-x-0" : "translate-x-full"}
          `}
        >
          {/* Header */}
          <div className="p-6 flex items-center justify-end shrink-0 ">
            <button
              onClick={moveToNext}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors z-10 relative top-3"
            >
              Next Word <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Content Scroll Area */}
          <div className="flex-1 overflow-y-auto p-6 relative bottom-20">
            {isDrawerOpen && <WordDetail id={currentWord.id} />}
          </div>
        </div>
      </>
    );
  };

  const renderSummary = () => {
    const minutes = Math.floor(totalDuration / 60000);
    const seconds = Math.floor((totalDuration % 60000) / 1000);

    const correctCount = results.filter(
      (r) => r.status === REVIEW_STATUS.KNOWN,
    ).length;
    const accuracy = Math.round((correctCount / results.length) * 100) || 0;

    return (
      <div className="max-w-4xl mx-auto w-full animate-in fade-in slide-in-from-bottom-8 duration-500 pb-24 md:pb-0">
        <div className="text-center mb-10">
          <h2 className="text-4xl font-bold text-slate-900 mb-2">
            Review Complete!
          </h2>
          <p className="text-slate-500">Here&apos;s how you performed today.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center">
            <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mb-4">
              <BookOpen className="w-6 h-6" />
            </div>
            <span className="text-3xl font-bold text-slate-900">
              {results.length}
            </span>
            <span className="text-sm text-slate-500 uppercase tracking-wider font-medium">
              Words Reviewed
            </span>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4">
              <BarChart3 className="w-6 h-6" />
            </div>
            <span className="text-3xl font-bold text-slate-900">
              {accuracy}%
            </span>
            <span className="text-sm text-slate-500 uppercase tracking-wider font-medium">
              Accuracy
            </span>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center">
            <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mb-4">
              <Clock className="w-6 h-6" />
            </div>
            <span className="text-3xl font-bold text-slate-900">
              {minutes}m {seconds}s
            </span>
            <span className="text-sm text-slate-500 uppercase tracking-wider font-medium">
              Duration
            </span>
          </div>
        </div>

        {/* Detailed List */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
            <h3 className="font-bold text-slate-700">Detailed Results</h3>
          </div>
          <div className="divide-y divide-slate-100">
            {results.map((res, idx) => (
              <div
                key={idx}
                className="px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <span className="text-sm text-slate-400 font-mono w-6">
                    {idx + 1}
                  </span>
                  <span className="font-medium text-slate-900">{res.word}</span>
                </div>
                <div className="flex items-center gap-6">
                  {/* <span className="text-xs text-slate-400 font-mono">
                    {(res.duration / 1000).toFixed(1)}s
                  </span> */}
                  <span
                    className={`
                    px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide
                    ${
                      res.status === REVIEW_STATUS.KNOWN
                        ? "bg-emerald-100 text-emerald-700"
                        : res.status === REVIEW_STATUS.VAGUE
                          ? "bg-amber-100 text-amber-700"
                          : "bg-rose-100 text-rose-700"
                    }
                  `}
                  >
                    {getReviewStatusLabel(res.status)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Mobile: fixed bottom bar / Desktop: inline */}
        <div className="fixed bottom-0 left-0 right-0 z-10 flex gap-3 p-4 bg-white/90 backdrop-blur-sm border-t border-slate-100 md:static md:bg-transparent md:border-0 md:p-0 md:mt-8 md:justify-center md:backdrop-blur-none">
          <button
            onClick={restart}
            className="flex-1 md:flex-none px-6 py-3 bg-white border border-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4" /> Review Again
          </button>
          <button
            onClick={onExit}
            className="flex-1 md:flex-none px-6 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
          >
            Back to Notebook
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-50 overflow-y-auto custom-scrollbar">
      <div className="min-h-screen flex flex-col">
        {/* Header (only for non-setup pages or just consistent) */}
        {step !== "setup" && (
          <div className="p-4 flex justify-between items-center max-w-7xl mx-auto w-full">
            <div className="font-bold text-slate-400 text-sm uppercase tracking-wider">
              Review Session
            </div>
            <button
              onClick={onExit}
              className="text-slate-400 hover:text-slate-600 p-2"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        )}

        <div className="flex-1 flex items-center justify-center p-4 md:p-8">
          {step === "setup" && renderSetup()}
          {step === "review" && renderReviewCard()}
          {step === "summary" && renderSummary()}
        </div>
      </div>

      {/* Drawer Portal */}
      {step === "review" && renderDrawer()}
    </div>
  );
}
