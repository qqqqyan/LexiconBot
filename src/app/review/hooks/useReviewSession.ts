"use client";

import { useReducer, useEffect, useState, startTransition } from "react";
import { ReviewSessionState, ReviewAction, ReviewInProgress } from "../type";

const STORAGE_KEY = "lexiconbot_review_session";

function reducer(
  state: ReviewSessionState,
  action: ReviewAction,
): ReviewSessionState {
  switch (action.type) {
    case "START_SESSION":
      return {
        step: "review",
        sessionId: action.payload.sessionId,
        reviewQueue: action.payload.reviewQueue,
        currentIndex: 0,
        results: [],
        elapsedMs: 0,
      };
    case "ANSWER_WORD": {
      if (state.step !== "review") return state;
      const { elapsedDelta, ...result } = action.payload;
      return {
        ...state,
        results: [...state.results, result],
        currentIndex: state.currentIndex + 1,
        elapsedMs: state.elapsedMs + elapsedDelta,
      };
    }
    case "UPDATE_ELAPSED":
      if (state.step !== "review") return state;
      return {
        ...state,
        elapsedMs: state.elapsedMs + action.payload.elapsedDelta,
      };
    case "COMPLETE_SESSION":
      if (state.step !== "review") return state;
      return {
        step: "summary",
        results: state.results,
        totalDuration: action.payload.totalDuration,
      };
    case "RESTART":
      return { step: "setup" };
    case "RESTORE":
      return action.payload;
    default:
      return state;
  }
}

export function useReviewSession() {
  const [state, dispatch] = useReducer(reducer, { step: "setup" });
  const [savedSession, setSavedSession] = useState<ReviewInProgress | null>(
    null,
  );

  // On mount, read localStorage once to check for an unfinished session
  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as ReviewInProgress;
      if (parsed.step === "review") {
        startTransition(() => setSavedSession(parsed));
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  // Keep localStorage in sync: write when in review, clear otherwise
  useEffect(() => {
    if (state.step === "review") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [state]);

  // Once the user leaves setup (starts or resumes), the banner is no longer relevant
  useEffect(() => {
    if (state.step !== "setup") {
      startTransition(() => setSavedSession(null));
    }
  }, [state.step]);

  return { state, dispatch, savedSession };
}
