import { describe, it, expect, vi } from "vitest";
import { AppError, SystemError } from "@/lib/errors";
import { DOMAIN_ERRORS } from "@/lib/constants/domain-errors";

describe("AppError", () => {
  it("stores the message and domain error code", () => {
    const err = new AppError("not found", DOMAIN_ERRORS.VOCAB_GET_DETAIL_FAILED);
    expect(err).toBeInstanceOf(Error);
    expect(err.name).toBe("AppError");
    expect(err.message).toBe("not found");
    expect(err.code).toBe(DOMAIN_ERRORS.VOCAB_GET_DETAIL_FAILED);
  });

  it("defaults to UNKNOWN_ERROR when no code is provided", () => {
    const err = new AppError("oops");
    expect(err.code).toBe(DOMAIN_ERRORS.UNKNOWN_ERROR);
  });
});

describe("SystemError", () => {
  it("wraps an Error object and logs the stack", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const original = new Error("db crashed");
    const err = new SystemError(original);

    expect(err).toBeInstanceOf(Error);
    expect(err.name).toBe("SystemError");
    expect(err.message).toBe("系统繁忙，请稍后再试");
    expect(spy).toHaveBeenCalledWith(
      expect.stringContaining("[SystemError]"),
    );
    spy.mockRestore();
  });

  it("wraps a plain object and logs JSON", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    new SystemError({ code: "PGRST116", message: "row not found" });

    expect(spy).toHaveBeenCalledWith(
      expect.stringContaining("PGRST116"),
    );
    spy.mockRestore();
  });

  it("wraps a primitive value and logs it as string", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    new SystemError("something broke");

    expect(spy).toHaveBeenCalledWith("[SystemError] something broke");
    spy.mockRestore();
  });
});
