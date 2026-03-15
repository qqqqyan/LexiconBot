import { supabaseServer } from "@/lib/supabase";
import { AppError, SystemError } from "@/lib/errors";
import { DOMAIN_ERRORS } from "@/lib/constants/domain-errors";
import { SUPABASE_CODES } from "@/lib/constants/vendor-codes";

const STORY_TABLE_NAME = process.env.STORY_TABLE_NAME || "";

export async function getStoryListService() {
  const { data, error } = await supabaseServer
    .from(STORY_TABLE_NAME)
    .select("id, title, created_at, word_list")
    .order("created_at", { ascending: false });

  if (error) throw new SystemError(error);
  return data;
}

export async function getStoryByIdService(id: string) {
  const { data, error } = await supabaseServer
    .from(STORY_TABLE_NAME)
    .select("*")
    .eq("id", id)
    .single();

  if (error && error.code === SUPABASE_CODES.RECORD_NOT_FOUND) {
    throw new AppError("No story Found", DOMAIN_ERRORS.STORY_GET_DETAIL_FAILED);
  }

  if (error) throw new SystemError(error);

  return data;
}

export async function saveStoryService(
  title: string,
  content: string,
  wordIds: number[],
  wordList: string[],
) {
  const { data, error } = await supabaseServer
    .from(STORY_TABLE_NAME)
    .insert([
      {
        title,
        content,
        word_ids: wordIds,
        word_list: wordList,
      },
    ])
    .select()
    .single();

  if (error) throw new SystemError(error);
  return data;
}
