import { ReviewMode } from "@/app/review/type";
import { VocabType } from "./vocab";

// 0=不认识, 1=模糊, 2=认识
export const REVIEW_STATUS = {
  UNKNOWN: 0,
  VAGUE: 1,
  KNOWN: 2,
} as const;

export const getReviewStatusLabel = (status: number) => {
  switch (status) {
    case REVIEW_STATUS.UNKNOWN:
      return "不认识";
    case REVIEW_STATUS.VAGUE:
      return "模糊";
    case REVIEW_STATUS.KNOWN:
      return "认识";
    default:
      return "未知";
  }
};
export type ReviewStatusValue =
  (typeof REVIEW_STATUS)[keyof typeof REVIEW_STATUS];

export interface SessionResult {
  vocabId: string;
  status: ReviewStatusValue;
}

export type ReviewVocabListParams =
  | { reviewMode: "random"; random_count: number }
  | {
      reviewMode: "sequential";
      sequential_range: { start: number; end: number };
    };

export interface ReviewSession {
  id: string;
  vocab_type: VocabType;
  mode: ReviewMode;
  word_ids: string[];
  created_at: string;
  completed_at: string | null;
  duration: number | null; // ms
}

export type CreateSessionParams = {
  vocabType: VocabType;
  reviewParams: ReviewVocabListParams;
};
