import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { AppError, ERROR_CODE, ok, schema } from "@novel/server-core";
import { getApiContext, handleRouteError, requireUserId } from "../../_utils";

export const runtime = "nodejs";

export async function GET(request: Request): Promise<NextResponse> {
  try {
    const ctx = await getApiContext();
    const userId = requireUserId(request, ctx);

    const found = await ctx.db
      .select({
        id: schema.users.id,
        email: schema.users.email,
        username: schema.users.username,
        createdAt: schema.users.createdAt,
      })
      .from(schema.users)
      .where(eq(schema.users.id, userId))
      .limit(1);

    const user = found[0];
    if (!user) {
      throw new AppError({
        statusCode: 404,
        code: ERROR_CODE.USER_001,
        message: "用户不存在",
      });
    }

    return NextResponse.json(
      ok({
        id: user.id,
        email: user.email,
        username: user.username,
        avatarUrl: null,
        settings: {
          theme: "dark",
          editor: {
            fontSize: 16,
            lineHeight: 1.8,
            fontFamily: "serif",
          },
        },
        stats: {
          worksCount: 0,
          totalWords: 0,
          aiCalls: 0,
        },
        createdAt: user.createdAt.toISOString(),
      }),
    );
  } catch (error) {
    return handleRouteError(error);
  }
}

