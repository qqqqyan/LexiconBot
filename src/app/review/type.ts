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
  sessionStartTime: number;
  reviewQueue: VocabListItem[];
}
