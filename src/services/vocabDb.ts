import { supabaseServer } from "@/lib/supabase";
import { WordContent, VocabEntry } from "@/types";

export async function getWordFromDb(word: string) {
  const { data, error } = await supabaseServer
    .from("cultural-vocabulary")
    .select("*")
    .eq("word", word)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data as VocabEntry;
}

export async function getVocabByIdService(id: string) {
  const { data, error } = await supabaseServer
    .from("cultural-vocabulary")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw new Error(error.message);
  return data as VocabEntry;
}

export async function saveWordToDb(
  word: string,
  content: WordContent,
): Promise<VocabEntry> {
  const { data, error } = await supabaseServer
    .from("cultural-vocabulary")
    .insert([{ word, content }])
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as VocabEntry;
}

export async function getVocabListService() {
  const { data, error } = await supabaseServer
    .from("cultural-vocabulary")
    .select("id, word, created_at")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data;
}
