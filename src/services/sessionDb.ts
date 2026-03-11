import { supabaseServer } from "@/lib/supabase";
import { SystemError } from "@/lib/errors";
import { ReviewSession, VocabType } from "@/types";
import { ReviewMode } from "@/app/review/type";

const SESSION_TABLE_NAME = process.env.REVIEW_SESSION_TABLE_NAME || "";

/**
 * Create a new review session in Supabase
 */
export async function createSessionService(params: {
  vocabType: VocabType;
  mode: ReviewMode;
  wordIds: string[];
}) {
  const { vocabType, mode, wordIds } = params;

  const { data, error } = await supabaseServer
    .from(SESSION_TABLE_NAME)
    .insert([
      {
        vocab_type: vocabType,
        mode: mode,
        word_ids: wordIds,
      },
    ])
    .select()
    .single();

  if (error) throw new SystemError(error);

  return data as ReviewSession;
}

/**
 * Complete a session with results
 */
export async function completeSessionService(
  sessionId: string,
  duration: number,
): Promise<ReviewSession> {
  const { data, error } = await supabaseServer
    .from(SESSION_TABLE_NAME)
    .update({
      completed_at: new Date().toISOString(),
      duration,
    })
    .eq("id", sessionId)
    .select()
    .single();

  if (error) throw new SystemError(error);

  return data as ReviewSession;
}
