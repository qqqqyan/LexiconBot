import { vi } from "vitest";

/**
 * 创建一个可链式调用的 Supabase mock，模拟 .from().select().eq().single() 等链式调用模式。
 * 终端方法 (single, maybeSingle, order) 返回 Promise 解析为 { data, error }。
 */
export function createSupabaseMock(
  resolvedValue: { data: unknown; error: unknown } = { data: null, error: null },
) {
  const chainable: Record<string, ReturnType<typeof vi.fn>> = {};

  const methods = [
    "from",
    "select",
    "insert",
    "eq",
    "in",
    "order",
    "single",
    "maybeSingle",
  ];

  for (const method of methods) {
    chainable[method] = vi.fn().mockReturnValue(chainable);
  }

  // 终端方法返回 Promise
  chainable.single.mockResolvedValue(resolvedValue);
  chainable.maybeSingle.mockResolvedValue(resolvedValue);
  chainable.order.mockResolvedValue(resolvedValue);

  return chainable;
}
