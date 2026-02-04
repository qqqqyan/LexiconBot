import { ErrorCodeType } from "@/lib/constants/domain-errors";

export function success<T>(data: T) {
  return { success: true as const, data };
}

export function failure(errorCode: ErrorCodeType) {
  return { success: false as const, errorCode };
}
