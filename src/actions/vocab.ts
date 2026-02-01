"use server";

import { fetchWordFromDify } from "@/services/dify";
import {
  getWordFromDb,
  saveWordToDb,
  getVocabByIdService,
  getVocabListService,
} from "@/services/vocabDb";

// 获取vocab列表
export async function fetchVocabListAction() {
  try {
    const data = await getVocabListService();
    return { success: true, data };
  } catch (error) {
    return { success: false, error: "无法获取单词列表" };
  }
}

// 获取单个vocab详情
export async function fetchVocabDetailAction(id: string) {
  try {
    const data = await getVocabByIdService(id);
    return { success: true, data };
  } catch (error) {
    return { success: false, error: "获取故事详情失败" };
  }
}

// 生成并保存vocab
export async function processVocabAction(word: string) {
  try {
    // 1. 查库
    const cached = await getWordFromDb(word);
    if (cached) return { success: true, data: cached, source: "db" };

    // 2. 调 AI
    const aiData = await fetchWordFromDify(word);

    // 3. 存库
    const wordData = await saveWordToDb(word, aiData);

    return { success: true, data: wordData };
  } catch (error) {
    console.error("BFF Error:", error);
    return { success: false, error: "处理失败" };
  }
}
