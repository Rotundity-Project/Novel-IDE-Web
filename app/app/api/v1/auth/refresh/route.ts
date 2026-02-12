import { NextResponse } from "next/server";
import { z } from "zod";
import { AppError, ERROR_CODE, auth, ok } from "@novel/server-core";
import { getApiContext, handleRouteError, readJson } from "../../_utils";

export const runtime = "nodejs";

const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const ctx = await getApiContext();
    const body = refreshSchema.parse(await readJson(request));

    const payload = ctx.jwt.verifyRefreshToken(body.refreshToken);
    const storedUserId = await auth.getRefreshTokenUserId({
      redis: ctx.redis,
      tokenId: payload.jti,
    });

    if (!storedUserId || storedUserId !== payload.sub) {
      throw new AppError({
        statusCode: 401,
        code: ERROR_CODE.AUTH_004,
        message: "Token 刷新失败",
      });
    }

    const access = ctx.jwt.signAccessToken(payload.sub);
    return NextResponse.json(
      ok({
        accessToken: access.token,
        expiresIn: access.expiresIn,
      }),
    );
  } catch (error) {
    return handleRouteError(error);
  }
}

