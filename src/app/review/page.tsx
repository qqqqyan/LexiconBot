"use client";

import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { completeSessionAction } from "@/actions/review";
import { useReviewSession } from "./hooks/useReviewSession";
import { SetupPanel } from "./components/SetupPanel";
import { ReviewPanel } from "./components/ReviewPanel";
import { SummaryPanel } from "./components/SummaryPanel";

export default function ReviewPage() {
  const router = useRouter();
  const { state, dispatch, savedSession } = useReviewSession();

  const onExit = () => router.push("/");
  const onRestart = () => dispatch({ type: "RESTART" });

  return (
    <div className="fixed inset-0 z-50 bg-slate-50 overflow-y-auto custom-scrollbar">
      <div className="min-h-screen flex flex-col">
        {state.step !== "setup" && (
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
          {state.step === "setup" && (
            <SetupPanel
              savedSession={savedSession}
              onSessionStarted={(data) =>
                dispatch({ type: "START_SESSION", payload: data })
              }
              onResume={() =>
                savedSession &&
                dispatch({ type: "RESTORE", payload: savedSession })
              }
              onExit={onExit}
            />
          )}
          {state.step === "review" && (
            <ReviewPanel
              reviewQueue={state.reviewQueue}
              currentIndex={state.currentIndex}
              elapsedMs={state.elapsedMs}
              onAnswerWord={(result, elapsedDelta) =>
                dispatch({ type: "ANSWER_WORD", payload: { ...result, elapsedDelta } })
              }
              onDrawerClose={(elapsedDelta) =>
                dispatch({ type: "UPDATE_ELAPSED", payload: { elapsedDelta } })
              }
              onComplete={(duration) => {
                if (state.sessionId) {
                  completeSessionAction(state.sessionId, duration).catch(
                    () => {}
                  );
                }
                dispatch({
                  type: "COMPLETE_SESSION",
                  payload: { totalDuration: duration },
                });
              }}
            />
          )}
          {state.step === "summary" && (
            <SummaryPanel
              results={state.results}
              totalDuration={state.totalDuration}
              onRestart={onRestart}
              onExit={onExit}
            />
          )}
        </div>
      </div>
    </div>
  );
}
