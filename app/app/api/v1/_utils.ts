import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import {
  AppError,
  ERROR_CODE,
  auth,
  createMockRedis,
  createNodeRedis,
  fail,
  getDb,
  getEnv,
} from "@novel/server-core";
import type { DbClient, Redis, ServerEnv } from "@novel/server-core";

const env = getEnv();
const { db } = getDb(env.databaseUrl);
const jwt = auth.createJwt({
  accessSecret: env.jwtAccessSecret,
  refreshSecret: env.jwtRefreshSecret,
  accessTokenTtlSeconds: env.accessTokenTtlSeconds,
  refreshTokenTtlSeconds: env.refreshTokenTtlSeconds,
});

let redisPromise: Promise<Redis> | null = null;

async function connectRedis(): Promise<Redis> {
  let redis = env.nodeEnv === "test" ? createMockRedis() : createNodeRedis(env.redisUrl);
  try {
    await redis.connect();
  } catch (error) {
    if (env.nodeEnv === "production") {
      throw error;
    }
    try {
      void redis.quit().catch(() => undefined);
    } catch {
      undefined;
    }
    redis = createMockRedis();
    await redis.connect();
  }
  return redis;
}

/**
 * Next `/api/v1/**` Route Handlers 的共享上下文。
 *
 * - db 为进程内单例（连接池复用）
 * - redis 在非生产环境允许降级为内存实现
 */
export async function getApiContext(): Promise<{
  env: ServerEnv;
  db: DbClient;
  redis: Redis;
  jwt: typeof jwt;
}> {
  if (!redisPromise) {
    redisPromise = connectRedis();
  }
  const redis = await redisPromise;
  return { env, db, redis, jwt };
}

export function createTokenId(): string {
  return randomUUID();
}

export async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new AppError({
      statusCode: 422,
      code: ERROR_CODE.VALIDATION_001,
      message: "参数验证失败",
    });
  }
}

export function getBearerToken(request: Request): string | null {
  const authorization = request.headers.get("authorization");
  if (!authorization) {
    return null;
  }

  const [scheme, token] = authorization.split(" ", 2);
  if (scheme !== "Bearer" || !token) {
    return null;
  }

  return token;
}

/**
 * 从 Authorization Bearer 中解析并校验 access token，返回 userId。
 *
 * 校验失败会抛出 AppError（AUTH_001）。
 */
export function requireUserId(request: Request, context: { jwt: typeof jwt }): string {
  const token = getBearerToken(request);
  if (!token) {
    throw new AppError({
      statusCode: 401,
      code: ERROR_CODE.AUTH_001,
      message: "Token 无效或已过期",
    });
  }

  const payload = context.jwt.verifyAccessToken(token);
  return payload.sub;
}

/**
 * 将 Route Handler 抛出的错误统一映射为 `{ success:false, error }`。
 *
 * - ZodError -> 422 VALIDATION_001
 * - AppError -> 透传 statusCode/code/message/details
 * - 其它错误 -> 500 INTERNAL_001（非生产附带 message/stack）
 */
export function handleRouteError(error: unknown): NextResponse {
  if (error instanceof ZodError) {
    return NextResponse.json(
      fail(ERROR_CODE.VALIDATION_001, "参数验证失败", { issues: error.issues }),
      { status: 422 },
    );
  }

  if (error instanceof AppError) {
    const appError = error;
    return NextResponse.json(fail(appError.code, appError.message, appError.details), {
      status: appError.statusCode,
    });
  }

  const details =
    env.nodeEnv === "production"
      ? undefined
      : error instanceof Error
        ? { message: error.message, stack: error.stack }
        : { error };

  return NextResponse.json(fail(ERROR_CODE.INTERNAL_001, "服务器内部错误", details), {
    status: 500,
  });
}
