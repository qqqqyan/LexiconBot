"use server";

import { unstable_cache, revalidateTag } from "next/cache";
import { generateStoryFromDify } from "@/services/dify";
import {
  getStoryListService,
  getStoryByIdService,
  saveStoryService,
} from "@/services/storyDb";
import { supabaseServer } from "@/lib/supabase";
import { AppError } from "@/lib/errors";
import { DOMAIN_ERRORS } from "@/lib/constants/domain-errors";
import { success, failure } from "./type";

const getCachedStoryList = unstable_cache(
  () => getStoryListService(),
  ["story-list"],
  { tags: ["story-list"], revalidate: false },
);

const getCachedStoryDetail = unstable_cache(
  (id: number) => getStoryByIdService(id),
  ["story-detail"],
  { tags: ["story-detail"], revalidate: false },
);

// 获取故事列表
export async function fetchStoryListAction() {
  try {
    const data = await getCachedStoryList();
    return success(data);
  } catch (error) {
    if (error instanceof AppError) {
      return failure(error.code);
    }
    return failure(DOMAIN_ERRORS.UNKNOWN_ERROR);
  }
}

// 获取单个故事详情
export async function fetchStoryDetailAction(id: number) {
  try {
    const data = await getCachedStoryDetail(id);
    return success(data);
  } catch (error) {
    if (error instanceof AppError) {
      return failure(error.code);
    }
    return failure(DOMAIN_ERRORS.UNKNOWN_ERROR);
  }
}

// 生成并保存故事
export async function generateAndSaveStoryAction(selectedWordIds: number[]) {
  try {
    // A. 预处理：根据 ID 查出单词原文 (Word Strings)
    // 不信任前端传来的字符串
    const { data: wordsData } = await supabaseServer
      .from("cultural-vocabulary")
      .select("word")
      .in("id", selectedWordIds);

    if (!wordsData || wordsData.length === 0) {
      throw new AppError(
        "can't find the words selected",
        DOMAIN_ERRORS.STORY_GET_DETAIL_FAILED,
      );
    }

    const wordStrings = wordsData.map((w) => w.word);

    // B. 调用 Dify 生成
    const rawOutput = await generateStoryFromDify(wordStrings);

    // C. 解析 Dify 的输出 (正则切割)
    // 期望格式: [TITLE]: ... \n [STORY]: ...
    const titleMatch = rawOutput.match(/\[TITLE\]:\s*(.+)/);
    const storyMatch = rawOutput.match(/\[STORY\]:\s*([\s\S]*)/);

    const title = titleMatch ? titleMatch[1].trim() : "Untitled Story";
    const content = storyMatch ? storyMatch[1].trim() : rawOutput;

    // D. 存入数据库
    const savedStory = await saveStoryService(
      title,
      content,
      selectedWordIds,
      wordStrings,
    );

    // E. 失效列表缓存
    revalidateTag("story-list", "max");

    return success(savedStory);
  } catch (error) {
    if (error instanceof AppError) {
      return failure(error.code);
    }
    return failure(DOMAIN_ERRORS.UNKNOWN_ERROR);
  }
}
