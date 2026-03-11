"use server";

import { fetchWordByType } from "@/services/dify";
import { AppError } from "@/lib/errors";
import {
  getWordFromDb,
  saveWordToDb,
  getVocabByIdService,
  getVocabListService,
  getVocabListInfoService,
  updateVocabReviewStatusService,
} from "@/services/vocabDb";
import { DOMAIN_ERRORS } from "@/lib/constants/domain-errors";
import { success, failure } from "./type";
import { ReviewStatusValue, VocabEntryDTO, VocabType } from "@/types";

// 获取vocab列表
export async function fetchVocabListAction(type: VocabType) {
  try {
    const data = await getVocabListService(type);
    return success(data);
  } catch (error) {
    if (error instanceof AppError) {
      return failure(error.code);
    }
    return failure(DOMAIN_ERRORS.UNKNOWN_ERROR);
  }
}

// 获取单个vocab详情
export async function fetchVocabDetailAction(id: string) {
  try {
    const data = await getVocabByIdService(id);
    return success(data);
  } catch (error) {
    if (error instanceof AppError) {
      return failure(error.code);
    }
    return failure(DOMAIN_ERRORS.UNKNOWN_ERROR);
  }
}

// 生成并保存vocab
export async function processVocabAction(word: string, type: VocabType) {
  try {
    let WordDataDTO: VocabEntryDTO;

    // 1. 查库
    const cached = await getWordFromDb(word, type);
    if (cached) {
      WordDataDTO = {
        meta: {
          status: "success",
          original_input: cached.word,
          corrected_word: null,
        },
        data: cached,
      };
      return success(WordDataDTO);
    }

    // 2. 调 AI
    const aiData = await fetchWordByType(word, type);

    if (aiData.status === "invalid") {
      return failure(DOMAIN_ERRORS.VOCAB_INVALID_INPUT);
    }

    if (!aiData.content) {
      return failure(DOMAIN_ERRORS.VOCAB_AI_GENERATION_FAILED);
    }

    // 3. 存库
    const correctedWord = aiData.corrected_word || word;
    const wordData = await saveWordToDb(correctedWord, type, aiData.content);

    // 4. 返回
    WordDataDTO = {
      meta: {
        status: aiData.status,
        original_input: aiData.original_input,
        corrected_word: aiData.corrected_word,
      },
      data: wordData,
    };
    return success(WordDataDTO);
  } catch (error) {
    if (error instanceof AppError) {
      return failure(error.code);
    }
    return failure(DOMAIN_ERRORS.UNKNOWN_ERROR);
  }
}

// 获取vocab列表信息
export async function fetchVocabListInfoAction() {
  try {
    const data = await getVocabListInfoService();
    return success(data);
  } catch (error) {
    if (error instanceof AppError) {
      return failure(error.code);
    }
    return failure(DOMAIN_ERRORS.UNKNOWN_ERROR);
  }
}

export async function updateVocabReviewStatusAction(
  id: string,
  newStatus: ReviewStatusValue,
) {
  try {
    await updateVocabReviewStatusService(id, newStatus);
    return success(null);
  } catch (error) {
    if (error instanceof AppError) {
      return failure(error.code);
    }
    return failure(DOMAIN_ERRORS.UNKNOWN_ERROR);
  }
}
