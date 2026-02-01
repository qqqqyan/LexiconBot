import { supabaseServer } from "@/lib/supabase";

export async function getStoryListService() {
  const { data, error } = await supabaseServer
    .from("stories")
    .select("id, title, created_at, word_list")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data;
}

export async function getStoryByIdService(id: string) {
  const { data, error } = await supabaseServer
    .from("stories")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function saveStoryService(
  title: string,
  content: string,
  wordIds: string[],
  wordList: string[],
) {
  const { data, error } = await supabaseServer
    .from("stories")
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

  if (error) throw new Error(error.message);
  return data;
}
