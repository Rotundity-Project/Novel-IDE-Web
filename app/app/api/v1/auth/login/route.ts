import { eq } from "drizzle-orm";
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

const loginSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(1).max(200),
});

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const ctx = await getApiContext();
    const body = loginSchema.parse(await readJson(request));

    const normalizedEmail = body.email.toLowerCase();

    const found = await ctx.db
      .select({
        id: schema.users.id,
        email: schema.users.email,
        username: schema.users.username,
        createdAt: schema.users.createdAt,
        passwordHash: schema.users.passwordHash,
      })
      .from(schema.users)
      .where(eq(schema.users.email, normalizedEmail))
      .limit(1);

    const user = found[0];
    if (!user) {
      throw new AppError({
        statusCode: 401,
        code: ERROR_CODE.AUTH_002,
        message: "用户名或密码错误",
      });
    }

    const valid = await auth.verifyPassword(body.password, user.passwordHash);
    if (!valid) {
      throw new AppError({
        statusCode: 401,
        code: ERROR_CODE.AUTH_002,
        message: "用户名或密码错误",
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
    );
  } catch (error) {
    return handleRouteError(error);
  }
}

