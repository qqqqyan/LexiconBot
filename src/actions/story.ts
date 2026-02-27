"use server";

import { generateStoryFromDify } from "@/services/dify";
import {
  getStoryListService,
  getStoryByIdService,
  saveStoryService,
} from "@/services/storyDb";
import { getWordsByIdsService } from "@/services/vocabDb";
import { AppError } from "@/lib/errors";
import { DOMAIN_ERRORS } from "@/lib/constants/domain-errors";
import { success, failure } from "./type";

// 获取故事列表
export async function fetchStoryListAction() {
  try {
    const data = await getStoryListService();
    return success(data);
  } catch (error) {
    if (error instanceof AppError) {
      return failure(error.code);
    }
    return failure(DOMAIN_ERRORS.UNKNOWN_ERROR);
  }
}

// 获取单个故事详情
export async function fetchStoryDetailAction(id: string) {
  try {
    const data = await getStoryByIdService(id);
    return success(data);
  } catch (error) {
    if (error instanceof AppError) {
      return failure(error.code);
    }
    return failure(DOMAIN_ERRORS.UNKNOWN_ERROR);
  }
}

// 生成并保存故事
export async function generateAndSaveStoryAction(selectedWordIds: string[]) {
  try {
    // A. 预处理：根据 ID 查出单词原文 (Word Strings)
    // 不信任前端传来的字符串
    const wordStrings = await getWordsByIdsService(selectedWordIds);

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

    return success(savedStory);
  } catch (error) {
    if (error instanceof AppError) {
      return failure(error.code);
    }
    return failure(DOMAIN_ERRORS.UNKNOWN_ERROR);
  }
}
