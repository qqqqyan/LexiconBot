"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { VocabListItem } from "@/types";
import { X } from "lucide-react";
import { ReviewResult, ReviewStep, SessionBridgeData } from "./type";
import { SetupPanel } from "./components/SetupPanel";
import { ReviewPanel } from "./components/ReviewPanel";
import { SummaryPanel } from "./components/SummaryPanel";

export default function ReviewPage() {
  const router = useRouter();

  // orchestrator state
  const [step, setStep] = useState<ReviewStep>("setup");

  // Setup → Review bridge
  const [sessionId, setSessionId] = useState<string>();
  const [sessionStartTime, setSessionStartTime] = useState(0);
  const [reviewQueue, setReviewQueue] = useState<VocabListItem[]>([]);

  // Review → Summary bridge
  const [results, setResults] = useState<ReviewResult[]>([]);
  const [totalDuration, setTotalDuration] = useState(0);

  const onExit = () => router.push("/");

  const onRestart = () => setStep("setup");

  const handleSessionStarted = ({
    sessionId,
    sessionStartTime,
    reviewQueue,
  }: SessionBridgeData) => {
    setSessionId(sessionId);
    setSessionStartTime(sessionStartTime);
    setReviewQueue(reviewQueue);
    setStep("review");
  };

  const handleReviewComplete = (results: ReviewResult[], duration: number) => {
    setResults(results);
    setTotalDuration(duration);
    setStep("summary");
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-50 overflow-y-auto custom-scrollbar">
      <div className="min-h-screen flex flex-col">
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
          {step === "setup" && (
            <SetupPanel
              onSessionStarted={handleSessionStarted}
              onExit={onExit}
            />
          )}
          {step === "review" && (
            <ReviewPanel
              reviewQueue={reviewQueue}
              sessionId={sessionId}
              sessionStartTime={sessionStartTime}
              onComplete={handleReviewComplete}
            />
          )}
          {step === "summary" && (
            <SummaryPanel
              results={results}
              totalDuration={totalDuration}
              onRestart={onRestart}
              onExit={onExit}
            />
          )}
        </div>
      </div>
    </div>
  );
}
