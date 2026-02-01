"use server";

import { generateStoryFromDify } from "@/services/dify";
import {
  getStoryListService,
  getStoryByIdService,
  saveStoryService,
} from "@/services/storyDb";
import { supabaseServer } from "@/lib/supabase";

// 获取故事列表
export async function fetchStoryListAction() {
  try {
    const data = await getStoryListService();
    return { success: true, data };
  } catch (error) {
    return { success: false, error: "获取故事列表失败" };
  }
}

// 获取单个故事详情
export async function fetchStoryDetailAction(id: string) {
  try {
    const data = await getStoryByIdService(id);
    return { success: true, data };
  } catch (error) {
    return { success: false, error: "获取故事详情失败" };
  }
}

// 生成并保存故事
export async function generateAndSaveStoryAction(selectedWordIds: string[]) {
  try {
    // A. 预处理：根据 ID 查出单词原文 (Word Strings)
    // 不信任前端传来的字符串
    const { data: wordsData } = await supabaseServer
      .from("cultural-vocabulary")
      .select("word")
      .in("id", selectedWordIds);

    if (!wordsData || wordsData.length === 0) {
      throw new Error("未找到选中的单词");
    }

    const wordStrings = wordsData.map((w) => w.word);

    // B. 调用 Dify 生成
    const rawOutput = await generateStoryFromDify(wordStrings);

    // C. 解析 Dify 的输出 (正则切割)
    // 期望格式: [TITLE]: ... \n [STORY]: ...
    const titleMatch = rawOutput.match(/\[TITLE\]:\s*(.+)/);
    const storyMatch = rawOutput.match(/\[STORY\]:\s*([\s\S]*)/); // [\s\S] 匹配包括换行符的所有字符

    const title = titleMatch ? titleMatch[1].trim() : "Untitled Story";
    const content = storyMatch ? storyMatch[1].trim() : rawOutput;

    // D. 存入数据库
    const savedStory = await saveStoryService(
      title,
      content,
      selectedWordIds,
      wordStrings,
    );

    return { success: true, data: savedStory };
  } catch (error) {
    console.error("Story Generation Error:", error);
    return { success: false, error: "故事生成失败" };
  }
}
