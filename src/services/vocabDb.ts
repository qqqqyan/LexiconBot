import { supabaseServer } from "@/lib/supabase";
import { AppError, SystemError } from "@/lib/errors";
import { DOMAIN_ERRORS } from "@/lib/constants/domain-errors";
import { SUPABASE_CODES } from "@/lib/constants/vendor-codes";
import {
  WordContent,
  VocabEntry,
  VocabType,
  ReviewVocabListParams,
  ReviewStatusValue,
} from "@/types";

const VOCAB_TABLE_NAME = process.env.VOCAB_TABLE_NAME || "";

export async function getWordFromDb(word: string, type: VocabType) {
  const { data, error } = await supabaseServer
    .from(VOCAB_TABLE_NAME)
    .select("*")
    .eq("word", word)
    .eq("type", type)
    .maybeSingle();

  if (error) throw new SystemError(error);
  return data as VocabEntry;
}

export async function getVocabByIdService(id: string) {
  const { data, error } = await supabaseServer
    .from(VOCAB_TABLE_NAME)
    .select("*")
    .eq("id", id)
    .single();

  if (error && error.code === SUPABASE_CODES.RECORD_NOT_FOUND) {
    throw new AppError("No vocab Found", DOMAIN_ERRORS.VOCAB_GET_DETAIL_FAILED);
  }

  if (error) throw new SystemError(error);

  return data as VocabEntry;
}

export async function saveWordToDb(
  word: string,
  type: VocabType,
  content: WordContent,
): Promise<VocabEntry> {
  const { data, error } = await supabaseServer
    .from(VOCAB_TABLE_NAME)
    .insert([{ word, type, content }])
    .select()
    .single();

  if (error) throw new SystemError(error);

  return data as VocabEntry;
}

export async function getVocabListService(type: VocabType) {
  const { data, error } = await supabaseServer
    .from(VOCAB_TABLE_NAME)
    .select("id, word, created_at")
    .eq("type", type)
    .order("created_at", { ascending: false });

  if (error) throw new SystemError(error);
  return data;
}

export async function getVocabListInfoService() {
  const [cultureRes, techRes] = await Promise.all([
    supabaseServer
      .from(VOCAB_TABLE_NAME)
      .select("id", { count: "exact", head: true })
      .eq("type", "culture"),
    supabaseServer
      .from(VOCAB_TABLE_NAME)
      .select("id", { count: "exact", head: true })
      .eq("type", "tech"),
  ]);

  if (cultureRes.error) throw new SystemError(cultureRes.error);
  if (techRes.error) throw new SystemError(techRes.error);

  return {
    culture: cultureRes.count ?? 0,
    tech: techRes.count ?? 0,
  };
}

export async function getReviewVocabListService(
  type: VocabType,
  params: ReviewVocabListParams,
) {
  if (params.reviewMode === "random") {
    const { data, error } = await supabaseServer
      .from(VOCAB_TABLE_NAME)
      .select("id, word, created_at")
      .eq("type", type);

    if (error) throw new SystemError(error);

    // Fisher-Yates shuffle and take random_count
    const shuffled = [...data];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled.slice(0, params.random_count);
  }

  // sequential mode: paginate by created_at ascending
  const { start, end } = params.sequential_range;
  const { data, error } = await supabaseServer
    .from(VOCAB_TABLE_NAME)
    .select("id, word, created_at")
    .eq("type", type)
    .order("created_at", { ascending: true })
    .range(start - 1, end - 1); // Supabase uses 0-based indexing

  if (error) throw new SystemError(error);
  return data;
}

export async function updateVocabReviewStatusService(
  id: string,
  newStatus: ReviewStatusValue,
) {
  const { error } = await supabaseServer.rpc("append_review_status", {
    vocab_id: id,
    new_status: newStatus,
  });

  if (error) throw new SystemError(error);
}
