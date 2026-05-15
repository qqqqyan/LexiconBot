"use server";

import { unstable_cache, revalidateTag } from "next/cache";
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
import { getSessionUserId } from "@/lib/session";

const getCachedVocabList = unstable_cache(
  (userId: string, type: VocabType) => getVocabListService(userId, type),
  ["vocab-list"],
  { tags: ["vocab-list"], revalidate: false },
);

const getCachedVocabDetail = unstable_cache(
  (id: number) => getVocabByIdService(id),
  ["vocab-detail"],
  { tags: ["vocab-detail"], revalidate: false },
);

const getCachedVocabListInfo = unstable_cache(
  (userId: string) => getVocabListInfoService(userId),
  ["vocab-list-info"],
  { tags: ["vocab-list-info"], revalidate: false },
);

export async function fetchVocabListAction(type: VocabType) {
  try {
    const userId = await getSessionUserId();
    const data = await getCachedVocabList(userId, type);
    return success(data);
  } catch (error) {
    if (error instanceof AppError) {
      return failure(error.code);
    }
    return failure(DOMAIN_ERRORS.UNKNOWN_ERROR);
  }
}

export async function fetchVocabDetailAction(id: number) {
  try {
    const data = await getCachedVocabDetail(id);
    return success(data);
  } catch (error) {
    if (error instanceof AppError) {
      return failure(error.code);
    }
    return failure(DOMAIN_ERRORS.UNKNOWN_ERROR);
  }
}

export async function processVocabAction(word: string, type: VocabType) {
  try {
    const userId = await getSessionUserId();

    // 1. 查库
    const cached = await getWordFromDb(word, type, userId);
    if (cached) {
      const WordDataDTO: VocabEntryDTO = {
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
    const wordData = await saveWordToDb(correctedWord, type, aiData.content, userId);

    // 4. 失效列表缓存
    revalidateTag("vocab-list", "max");
    revalidateTag("vocab-list-info", "max");

    // 5. 返回
    const WordDataDTO: VocabEntryDTO = {
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

export async function fetchVocabListInfoAction() {
  try {
    const userId = await getSessionUserId();
    const data = await getCachedVocabListInfo(userId);
    return success(data);
  } catch (error) {
    if (error instanceof AppError) {
      return failure(error.code);
    }
    return failure(DOMAIN_ERRORS.UNKNOWN_ERROR);
  }
}

export async function updateVocabReviewStatusAction(
  id: number,
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
