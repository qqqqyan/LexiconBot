"use server";

import { AppError } from "@/lib/errors";
import { success, failure } from "./type";
import { DOMAIN_ERRORS } from "@/lib/constants/domain-errors";
import { getReviewVocabListService } from "@/services/vocabDb";
import {
  createSessionService,
  completeSessionService,
} from "@/services/sessionDb";
import { CreateSessionParams } from "@/types";

// 获取复习列表 + 创建复习会话
export async function startSessionAction(params: CreateSessionParams) {
  try {
    const { vocabType, reviewParams } = params;
    const vocabList = await getReviewVocabListService(vocabType, reviewParams);

    const wordIds = vocabList.map((v) => v.id);
    const session = await createSessionService({
      vocabType,
      mode: reviewParams.reviewMode,
      wordIds,
    });
    return success({ session, vocabList });
  } catch (error) {
    if (error instanceof AppError) {
      return failure(error.code);
    }
    return failure(DOMAIN_ERRORS.UNKNOWN_ERROR);
  }
}

// 完成复习会话，标记 session 完成
export async function completeSessionAction(
  sessionId: string,
  duration: number,
) {
  try {
    const session = await completeSessionService(sessionId, duration);
    return success(session);
  } catch (error) {
    if (error instanceof AppError) {
      return failure(error.code);
    }
    return failure(DOMAIN_ERRORS.UNKNOWN_ERROR);
  }
}
