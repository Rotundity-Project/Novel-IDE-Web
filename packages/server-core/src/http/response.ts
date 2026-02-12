import type { ApiError, ApiSuccess } from "./types";

/**
 * 构造统一的成功响应体：`{ success: true, data, message? }`。
 */
export function ok<T>(data: T, message?: string): ApiSuccess<T> {
  return {
    success: true,
    data,
    ...(message ? { message } : {}),
  };
}

/**
 * 构造统一的失败响应体：`{ success: false, error: { code, message, details? } }`。
 */
export function fail(code: string, message: string, details?: unknown): ApiError {
  return {
    success: false,
    error: {
      code,
      message,
      ...(details === undefined ? {} : { details }),
    },
  };
}
