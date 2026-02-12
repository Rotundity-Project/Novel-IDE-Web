import { and, eq, inArray, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { AppError, ERROR_CODE, ok, schema } from "@novel/server-core";
import { getApiContext, handleRouteError, readJson, requireUserId } from "../../../../_utils";

export const runtime = "nodejs";

const paramsSchema = z.object({ id: z.string().uuid() });

const reorderSchema = z.object({
  orders: z.array(
    z.object({
      chapterId: z.string().uuid(),
      orderIndex: z.number().int().min(0),
    }),
  ),
});

export async function POST(
  request: Request,
  { params }: { params: { id: string } },
): Promise<NextResponse> {
  try {
    const ctx = await getApiContext();
    const userId = requireUserId(request, ctx);
    const p = paramsSchema.parse(params);
    const body = reorderSchema.parse(await readJson(request));

    const owner = await ctx.db
      .select({ userId: schema.works.userId })
      .from(schema.works)
      .where(eq(schema.works.id, p.id))
      .limit(1);

    if (!owner[0]) {
      throw new AppError({
        statusCode: 404,
        code: ERROR_CODE.WORK_001,
        message: "作品不存在",
      });
    }
    if (owner[0].userId !== userId) {
      throw new AppError({
        statusCode: 403,
        code: ERROR_CODE.WORK_002,
        message: "无权访问该作品",
      });
    }

    const chapterIds = body.orders.map((o) => o.chapterId);
    const existing = await ctx.db
      .select({ id: schema.chapters.id })
      .from(schema.chapters)
      .where(and(eq(schema.chapters.workId, p.id), inArray(schema.chapters.id, chapterIds)));

    if (existing.length !== chapterIds.length) {
      throw new AppError({
        statusCode: 404,
        code: ERROR_CODE.CHAPTER_001,
        message: "章节不存在",
      });
    }

    await ctx.db.transaction(async (tx: any) => {
      for (const order of body.orders) {
        await tx
          .update(schema.chapters)
          .set({ orderIndex: order.orderIndex, updatedAt: sql`now()` })
          .where(and(eq(schema.chapters.id, order.chapterId), eq(schema.chapters.workId, p.id)));
      }
    });

    return NextResponse.json(ok({}));
  } catch (error) {
    return handleRouteError(error);
  }
}
