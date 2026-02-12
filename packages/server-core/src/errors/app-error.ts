import type { ErrorCode } from "./error-codes";

type AppErrorOptions = {
  statusCode: number;
  code: ErrorCode | string;
  message: string;
  details?: unknown;
};

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: unknown;

  public constructor(options: AppErrorOptions) {
    super(options.message);
    this.name = "AppError";
    this.statusCode = options.statusCode;
    this.code = options.code;
    this.details = options.details;
  }
}

