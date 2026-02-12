import { NextResponse } from "next/server";
import { auth, ok } from "@novel/server-core";
import { getApiContext, handleRouteError, requireUserId } from "../../_utils";

export const runtime = "nodejs";

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const ctx = await getApiContext();
    const userId = requireUserId(request, ctx);

    await auth.revokeAllRefreshTokens({ redis: ctx.redis, userId });
    return NextResponse.json(ok({}, "登出成功"));
  } catch (error) {
    return handleRouteError(error);
  }
}

