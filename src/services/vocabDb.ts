import { supabaseServer } from "@/lib/supabase";
import { AppError, SystemError } from "@/lib/errors";
import { DOMAIN_ERRORS } from "@/lib/constants/domain-errors";
import { SUPABASE_CODES } from "@/lib/constants/vendor-codes";
import { WordContent, VocabEntry } from "@/types";

const VOCAB_TABLE_NAME = process.env.VOCAB_TABLE_NAME || "";

export async function getWordFromDb(word: string) {
  const { data, error } = await supabaseServer
    .from(VOCAB_TABLE_NAME)
    .select("*")
    .eq("word", word)
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
  content: WordContent,
): Promise<VocabEntry> {
  const { data, error } = await supabaseServer
    .from(VOCAB_TABLE_NAME)
    .insert([{ word, content }])
    .select()
    .single();

  if (error) throw new SystemError(error);

  return data as VocabEntry;
}

export async function getVocabListService() {
  const { data, error } = await supabaseServer
    .from(VOCAB_TABLE_NAME)
    .select("id, word, created_at")
    .order("created_at", { ascending: false });

  if (error) throw new SystemError(error);
  return data;
}
