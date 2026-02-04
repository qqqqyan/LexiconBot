import { DifyWorkflowResponse, DifyWorkflowResponseRes } from "@/types";
import { SystemError, AppError } from "@/lib/errors";
import { DOMAIN_ERRORS } from "@/lib/constants/domain-errors";
import { DIFY_CODES } from "@/lib/constants/vendor-codes";

const DIFY_API_URL = process.env.DIFY_API_URL || "http://localhost:8080/v1";

/**
 * 辅助函数：清洗 AI 返回的 JSON 字符串
 */
function cleanJsonString(rawString: string): string {
  if (!rawString) return "{}";
  return rawString
    .replace(/```json\s*/g, "")
    .replace(/```\s*/g, "")
    .trim();
}

/**
 * 核心通用函数：调用 Dify Workflow
 * 负责处理 HTTP 请求、鉴权、基础错误拦截 (429/500) 和原始数据提取
 */
async function callDifyWorkflow(
  apiKey: string | undefined,
  inputs: Record<string, string>,
  logContext: string, // 用于日志，区分是请求单词还是故事
): Promise<string> {
  if (!apiKey) {
    throw new Error(`Missing Dify API Key for ${logContext}`);
  }

  try {
    console.log(`[Dify Service] Requesting ${logContext}...`);

    const response = await fetch(`${DIFY_API_URL}/workflows/run`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs,
        response_mode: "blocking",
        user: "abc-123",
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new SystemError(
        `Dify API Error (${response.status}): ${errorText}`,
      );
    }

    const resJson: DifyWorkflowResponse = await response.json();
    const errorMsg = resJson.data.error;

    if (errorMsg) {
      if (errorMsg.includes(DIFY_CODES.RATE_LIMIT)) {
        throw new AppError(
          `Dify Workflow Rate Limited`,
          DOMAIN_ERRORS.QUOTA_EXCEEDED,
        );
      }
      if (errorMsg.includes(DIFY_CODES.PLUGIN_UNAVAILABLE)) {
        throw new AppError(
          `Dify AI Service Unavailable`,
          DOMAIN_ERRORS.AI_PLUGIN_UNAVAILABLE,
        );
      }
      throw new SystemError(
        `Dify Workflow Response Error (${resJson.data.error})`,
      );
    }

    const rawAiContent = resJson.data.outputs.res;
    if (!rawAiContent) {
      throw new AppError(
        `Dify Workflow Outputs Empty`,
        DOMAIN_ERRORS.VOCAB_AI_GENERATION_FAILED,
      );
    }

    console.log(
      `[Dify Service] Response for ${logContext}: ${rawAiContent.slice(0, 150)}`,
    );
    return rawAiContent;
  } catch (error) {
    if (error instanceof AppError || error instanceof SystemError) {
      throw error;
    }
    throw new SystemError(`Dify Workflow Request Error (${error})`);
  }
}

// ------------------------------------------------------------------
// 业务函数
// ------------------------------------------------------------------

// 获取单词详情（需要 JSON 解析）
export async function fetchWordFromDify(
  word: string,
): Promise<DifyWorkflowResponseRes> {
  const rawContent = await callDifyWorkflow(
    process.env.VOCAB_DIFY_API_KEY,
    { word_or_phrase: word },
    "word",
  );

  try {
    const cleanString = cleanJsonString(rawContent);
    return JSON.parse(cleanString) as DifyWorkflowResponseRes;
  } catch (error) {
    throw new AppError(
      `Dify Outputs Parse Failed (${error})`,
      DOMAIN_ERRORS.VOCAB_GENERATION_PARSE_FAILED,
    );
  }
}

// 生成故事（直接返回字符串）
export async function generateStoryFromDify(words: string[]): Promise<string> {
  // 直接调用通用层并返回结果，无需 JSON 解析
  return await callDifyWorkflow(
    process.env.STORY_DIFY_API_KEY,
    { selected_words: words.join(", ") },
    "story",
  );
}
