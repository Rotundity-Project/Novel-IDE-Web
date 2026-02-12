import { eq, or } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { AppError, ERROR_CODE, auth, ok, schema } from "@novel/server-core";
import { createTokenId, getApiContext, handleRouteError, readJson } from "../../_utils";

export const runtime = "nodejs";

function toUserDto(row: { id: string; email: string; username: string; createdAt: Date }) {
  return {
    id: row.id,
    email: row.email,
    username: row.username,
    avatarUrl: null,
    createdAt: row.createdAt.toISOString(),
  };
}

const registerSchema = z.object({
  email: z.string().email().max(255),
  username: z.string().min(2).max(100),
  password: z.string().min(8).max(200),
});

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const ctx = await getApiContext();
    const body = registerSchema.parse(await readJson(request));

    const normalizedEmail = body.email.toLowerCase();

    const existing = await ctx.db
      .select({ id: schema.users.id })
      .from(schema.users)
      .where(or(eq(schema.users.email, normalizedEmail), eq(schema.users.username, body.username)))
      .limit(1);

    if (existing.length > 0) {
      throw new AppError({
        statusCode: 409,
        code: ERROR_CODE.AUTH_003,
        message: "邮箱或用户名已被注册",
      });
    }

    const passwordHash = await auth.hashPassword(body.password);

    try {
      const inserted = await ctx.db
        .insert(schema.users)
        .values({
          email: normalizedEmail,
          username: body.username,
          passwordHash,
        })
        .returning({
          id: schema.users.id,
          email: schema.users.email,
          username: schema.users.username,
          createdAt: schema.users.createdAt,
        });

      const user = inserted[0];
      if (!user) {
        throw new AppError({
          statusCode: 500,
          code: ERROR_CODE.INTERNAL_001,
          message: "服务器内部错误",
        });
      }

      const access = ctx.jwt.signAccessToken(user.id);
      const tokenId = createTokenId();
      const refresh = ctx.jwt.signRefreshToken(user.id, tokenId);
      await auth.saveRefreshToken({
        redis: ctx.redis,
        userId: user.id,
        tokenId,
        ttlSeconds: ctx.env.refreshTokenTtlSeconds,
      });

      return NextResponse.json(
        ok({
          user: toUserDto(user),
          tokens: {
            accessToken: access.token,
            refreshToken: refresh.token,
            expiresIn: access.expiresIn,
          },
        }),
        { status: 201 },
      );
    } catch (error: any) {
      if (error?.code === "23505") {
        throw new AppError({
          statusCode: 409,
          code: ERROR_CODE.AUTH_003,
          message: "邮箱或用户名已被注册",
        });
      }
      throw error;
    }
  } catch (error) {
    return handleRouteError(error);
  }
}

