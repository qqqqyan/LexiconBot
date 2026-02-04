import { ErrorCodeType, DOMAIN_ERRORS } from "@/lib/constants/domain-errors";

// 业务逻辑错误（预期内的，如：ID不存在，余额不足）-> 可以直接展示给用户
export class AppError extends Error {
  constructor(
    public message: string,
    public code: ErrorCodeType = DOMAIN_ERRORS.UNKNOWN_ERROR,
  ) {
    super(message);
    this.name = "AppError";
  }
}

// 系统级错误（预期外的，如：数据库挂了，API 500）-> 需要隐藏细节
export class SystemError extends Error {
  constructor(public originalError: unknown) {
    super("系统繁忙，请稍后再试"); // 统一对外的口径
    this.name = "SystemError";

    this.logDetailedError();
  }

  private logDetailedError() {
    if (this.originalError instanceof Error) {
      console.error(`[SystemError] ${this.originalError.stack}`);
    } else if (
      typeof this.originalError === "object" &&
      this.originalError !== null
    ) {
      console.error(`[SystemError] ${JSON.stringify(this.originalError)}`);
    } else {
      console.error(`[SystemError] ${String(this.originalError)}`);
    }
  }
}
