"use client";

import { useMemo } from "react";
import {
  RotateCcw,
  BookOpen,
  BarChart3,
  Clock,
} from "lucide-react";
import { REVIEW_STATUS, getReviewStatusLabel } from "@/types";
import { ReviewResult } from "../type";

interface SummaryPanelProps {
  results: ReviewResult[];
  totalDuration: number;
  onRestart: () => void;
  onExit: () => void;
}

export function SummaryPanel({
  results,
  totalDuration,
  onRestart,
  onExit,
}: SummaryPanelProps) {
  const stats = useMemo(() => {
    const correctCount = results.filter(
      (r) => r.status === REVIEW_STATUS.KNOWN,
    ).length;
    const accuracy = Math.round((correctCount / results.length) * 100) || 0;
    const minutes = Math.floor(totalDuration / 60000);
    const seconds = Math.floor((totalDuration % 60000) / 1000);
    return { accuracy, minutes, seconds };
  }, [results, totalDuration]);

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
            {stats.accuracy}%
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
            {stats.minutes}m {stats.seconds}s
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
          ))}
        </div>
      </div>

      {/* Mobile: fixed bottom bar / Desktop: inline */}
      <div className="fixed bottom-0 left-0 right-0 z-10 flex gap-3 p-4 bg-white/90 backdrop-blur-sm border-t border-slate-100 md:static md:bg-transparent md:border-0 md:p-0 md:mt-8 md:justify-center md:backdrop-blur-none">
        <button
          onClick={onRestart}
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
}
