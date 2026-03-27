import { ReviewStatusValue, VocabType, VocabListItem } from "@/types";

export type ReviewMode = "sequential" | "random";

export type ReviewStep = "setup" | "review" | "summary";

export interface ReviewResult {
  wordId: number;
  word: string;
  status: ReviewStatusValue;
}

export interface SessionBridgeData {
  sessionId: string;
  reviewQueue: VocabListItem[];
}

export type ReviewSessionState =
  | { step: "setup" }
  | {
      step: "review";
      sessionId: string;
      reviewQueue: VocabListItem[];
      currentIndex: number;
      results: ReviewResult[];
      elapsedMs: number;
    }
  | { step: "summary"; results: ReviewResult[]; totalDuration: number };

export type ReviewInProgress = Extract<ReviewSessionState, { step: "review" }>;

export type ReviewAction =
  | { type: "START_SESSION"; payload: SessionBridgeData }
  | { type: "ANSWER_WORD"; payload: ReviewResult & { elapsedDelta: number } }
  | { type: "UPDATE_ELAPSED"; payload: { elapsedDelta: number } }
  | { type: "COMPLETE_SESSION"; payload: { totalDuration: number } }
  | { type: "RESTART" }
  | { type: "RESTORE"; payload: ReviewInProgress };
