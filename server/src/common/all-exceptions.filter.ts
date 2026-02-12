import { Catch, HttpException, HttpStatus } from "@nestjs/common";
import type { ArgumentsHost, ExceptionFilter } from "@nestjs/common";
import { HttpAdapterHost } from "@nestjs/core";
import { ZodError } from "zod";
import { AppError, ERROR_CODE, fail, getEnv } from "@novel/server-core";

@Catch()
/**
 * Nest 全局异常过滤器。
 *
 * 将框架/业务错误统一映射为与 Next Route Handlers 一致的 `{ success, data/error }` 结构。
 */
export class AllExceptionsFilter implements ExceptionFilter {
  public constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  public catch(exception: unknown, host: ArgumentsHost) {
    const { httpAdapter } = this.httpAdapterHost;
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();

    if (exception instanceof ZodError) {
      httpAdapter.reply(
        response,
        fail(ERROR_CODE.VALIDATION_001, "参数验证失败", { issues: exception.issues }),
        422,
      );
      return;
    }

    if (exception instanceof AppError) {
      httpAdapter.reply(
        response,
        fail(exception.code, exception.message, exception.details),
        exception.statusCode,
      );
      return;
    }

    if (exception instanceof HttpException) {
      const statusCode = exception.getStatus();
      if (statusCode === HttpStatus.NOT_FOUND) {
        httpAdapter.reply(response, fail(ERROR_CODE.NOT_FOUND_001, "资源不存在"), 404);
        return;
      }

      httpAdapter.reply(
        response,
        fail(
          ERROR_CODE.INTERNAL_001,
          "服务器内部错误",
          getEnv().nodeEnv === "production" ? undefined : exception.getResponse(),
        ),
        statusCode,
      );
      return;
    }

    httpAdapter.reply(
      response,
      fail(
        ERROR_CODE.INTERNAL_001,
        "服务器内部错误",
        getEnv().nodeEnv === "production"
          ? undefined
          : exception instanceof Error
            ? { message: exception.message, stack: exception.stack }
            : { exception },
      ),
      500,
    );
  }
}
