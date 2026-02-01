import { WordContent, DifyWorkflowResponse } from "@/types";

/**
 * 辅助函数：清洗 AI 返回的 JSON 字符串
 * AI 经常会返回 ```json {...} ``` 格式，需要去掉 Markdown 标记
 */
function cleanJsonString(rawString: string): string {
  if (!rawString) return "{}";
  // 1. 去掉 ```json 和 ``` 包裹
  const clean = rawString.replace(/```json\s*/g, "").replace(/```\s*/g, "");
  // 2. 去掉首尾可能的空白字符
  return clean.trim();
}

export async function fetchWordFromDify(word: string): Promise<WordContent> {
  const VOCAB_DIFY_API_KEY = process.env.VOCAB_DIFY_API_KEY;
  const DIFY_API_URL = process.env.DIFY_API_URL || "http://localhost:8080/v1";

  if (!VOCAB_DIFY_API_KEY) {
    throw new Error("Missing VOCAB_DIFY_API_KEY in environment variables");
  }

  try {
    console.log(`[Dify Service] Requesting workflow for: ${word}`);

    const response = await fetch(`${DIFY_API_URL}/workflows/run`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${VOCAB_DIFY_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: {
          word_or_phrase: word, // 对应你 Dify 里的输入变量名
        },
        response_mode: "blocking",
        user: "abc-123", // 建议后续换成真实的用户 ID
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Dify API Error (${response.status}): ${errorText}`);
    }

    const resJson: DifyWorkflowResponse = await response.json();

    // ---------------------------------------------------------
    // 关键步骤：解析 Dify 的输出
    // ---------------------------------------------------------
    // Dify Workflow 的结果在 data.outputs 里。
    // 具体的 key 取决于你在 Dify "结束" 节点设置的变量名 (例如 text, result, output 等)
    // 这里我们做一个防错处理：取 outputs 里的第一个 value，或者尝试找 'text' / 'result'
    const outputs = resJson.data.outputs;

    console.log(outputs);
    if (!outputs) {
      throw new Error("Dify workflow returned no outputs");
    }

    // 尝试获取原始 JSON 字符串
    // 假设你的 Workflow 输出变量名为 'result' 或 'text'，或者直接取第一个非空值
    const rawAiContent = outputs["res"];

    if (typeof rawAiContent !== "string") {
      // 如果 Dify 直接返回了 JSON 对象（没被 stringify），那最好不过
      if (typeof rawAiContent === "object") {
        return rawAiContent as WordContent;
      }
      throw new Error("Unknown output format from Dify");
    }

    // 清洗并解析 JSON
    const cleanString = cleanJsonString(rawAiContent);
    const parsedData = JSON.parse(cleanString) as WordContent;

    return parsedData;
  } catch (error) {
    console.error("[Dify Service] Failed to fetch word:", error);
    throw error;
  }
}

export async function generateStoryFromDify(words: string[]): Promise<string> {
  const DIFY_API_KEY = process.env.STORY_DIFY_API_KEY;
  // 这里的 URL 需要指向你的 Dify 实例，通常是以 /v1 结尾
  const DIFY_API_URL = process.env.DIFY_API_URL || "http://localhost:8080/v1";

  if (!DIFY_API_KEY) {
    throw new Error("Missing DIFY_API_KEY in environment variables");
  }

  // 1. 构造 Prompt 输入
  // 确保这里的 key (selected_words) 与你在 Dify "开始" 节点里定义的变量名完全一致！
  const inputs = {
    selected_words: words.join(", "),
  };

  try {
    console.log(
      `[Dify Story Service] Generating story for words: ${words.join(", ")}`,
    );

    // 2. 发起请求
    const response = await fetch(`${DIFY_API_URL}/workflows/run`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${DIFY_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: inputs,
        response_mode: "blocking",
        user: "abc-123",
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Dify API Error (${response.status}): ${errorText}`);
    }

    // 3. 解析响应
    const resJson: DifyWorkflowResponse = await response.json();
    const outputs = resJson.data.outputs;

    if (!outputs) {
      throw new Error(
        "Dify workflow returned no outputs. Check your Workflow 'End' node.",
      );
    }

    // 4. 提取内容 (容错处理)
    let rawContent = outputs["res"];

    if (typeof rawContent !== "string") {
      if (typeof rawContent === "object" && rawContent !== null) {
        rawContent = rawContent || JSON.stringify(rawContent);
      } else {
        throw new Error(
          `Dify output format error: expected string, got ${typeof rawContent}`,
        );
      }
    }

    // 5. 简单的清洗 (去除可能的首尾引号)
    let cleanContent = rawContent.trim();
    cleanContent = cleanContent
      .replace(/^```(markdown)?/i, "")
      .replace(/```$/, "")
      .trim();

    return cleanContent;
  } catch (error) {
    console.error("[Dify Story Service] Failed to generate story:", error);
    throw error;
  }
}
