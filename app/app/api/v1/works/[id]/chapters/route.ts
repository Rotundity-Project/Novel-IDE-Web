import { asc, eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { AppError, ERROR_CODE, ok, schema } from "@novel/server-core";
import { getApiContext, handleRouteError, readJson, requireUserId } from "../../../_utils";

export const runtime = "nodejs";

const paramsSchema = z.object({ id: z.string().uuid() });

const createSchema = z.object({
  title: z.string().min(1).max(255),
  orderIndex: z.number().int().min(0),
});

async function assertWorkOwner(params: { db: any; workId: string; userId: string }) {
  const owner = await params.db
    .select({ userId: schema.works.userId })
    .from(schema.works)
    .where(eq(schema.works.id, params.workId))
    .limit(1);

  if (!owner[0]) {
    throw new AppError({
      statusCode: 404,
      code: ERROR_CODE.WORK_001,
      message: "作品不存在",
    });
  }
  if (owner[0].userId !== params.userId) {
    throw new AppError({
      statusCode: 403,
      code: ERROR_CODE.WORK_002,
      message: "无权访问该作品",
    });
  }
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } },
): Promise<NextResponse> {
  try {
    const ctx = await getApiContext();
    const userId = requireUserId(request, ctx);
    const p = paramsSchema.parse(params);

    await assertWorkOwner({ db: ctx.db, workId: p.id, userId });

    const list = await ctx.db
      .select({
        id: schema.chapters.id,
        title: schema.chapters.title,
        orderIndex: schema.chapters.orderIndex,
        wordCount: schema.chapters.wordCount,
        updatedAt: schema.chapters.updatedAt,
      })
      .from(schema.chapters)
      .where(eq(schema.chapters.workId, p.id))
      .orderBy(asc(schema.chapters.orderIndex));

    return NextResponse.json(
      ok({
        chapters: list.map((row: any) => ({
          id: row.id,
          title: row.title,
          orderIndex: row.orderIndex,
          wordCount: row.wordCount,
          updatedAt: row.updatedAt.toISOString(),
        })),
      }),
    );
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } },
): Promise<NextResponse> {
  try {
    const ctx = await getApiContext();
    const userId = requireUserId(request, ctx);
    const p = paramsSchema.parse(params);
    const body = createSchema.parse(await readJson(request));

    await assertWorkOwner({ db: ctx.db, workId: p.id, userId });

    const inserted = await ctx.db.transaction(async (tx: any) => {
      const created = await tx
        .insert(schema.chapters)
        .values({
          workId: p.id,
          title: body.title,
          orderIndex: body.orderIndex,
          content: null,
          wordCount: 0,
        })
        .returning({
          id: schema.chapters.id,
          workId: schema.chapters.workId,
          title: schema.chapters.title,
          content: schema.chapters.content,
          orderIndex: schema.chapters.orderIndex,
          wordCount: schema.chapters.wordCount,
          createdAt: schema.chapters.createdAt,
          updatedAt: schema.chapters.updatedAt,
        });

      await tx
        .update(schema.works)
        .set({
          chaptersCount: sql`${schema.works.chaptersCount} + 1`,
          updatedAt: sql`now()`,
        })
        .where(eq(schema.works.id, p.id));

      return created[0];
    });

    if (!inserted) {
      throw new AppError({
        statusCode: 500,
        code: ERROR_CODE.INTERNAL_001,
        message: "服务器内部错误",
      });
    }

    return NextResponse.json(
      ok({
        id: inserted.id,
        workId: inserted.workId,
        title: inserted.title,
        content: inserted.content,
        orderIndex: inserted.orderIndex,
        wordCount: inserted.wordCount,
        tags: [],
        createdAt: inserted.createdAt.toISOString(),
        updatedAt: inserted.updatedAt.toISOString(),
      }),
      { status: 201 },
    );
  } catch (error) {
    return handleRouteError(error);
  }
}
