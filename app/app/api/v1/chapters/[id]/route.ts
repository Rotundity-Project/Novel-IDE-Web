import { eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { AppError, ERROR_CODE, ok, schema } from "@novel/server-core";
import { getApiContext, handleRouteError, readJson, requireUserId } from "../../_utils";

export const runtime = "nodejs";

const paramsSchema = z.object({ id: z.string().uuid() });

const updateSchema = z
  .object({
    title: z.string().min(1).max(255).optional(),
    content: z.string().max(5_000_000).nullable().optional(),
    tags: z.array(z.string()).optional(),
  })
  .refine((v) => v.title !== undefined || v.content !== undefined || v.tags !== undefined);

function countWords(content: string | null): number {
  if (!content) {
    return 0;
  }
  return content.replace(/\s+/g, "").length;
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } },
): Promise<NextResponse> {
  try {
    const ctx = await getApiContext();
    const userId = requireUserId(request, ctx);
    const p = paramsSchema.parse(params);

    const found = await ctx.db
      .select({
        id: schema.chapters.id,
        workId: schema.chapters.workId,
        title: schema.chapters.title,
        content: schema.chapters.content,
        orderIndex: schema.chapters.orderIndex,
        wordCount: schema.chapters.wordCount,
        createdAt: schema.chapters.createdAt,
        updatedAt: schema.chapters.updatedAt,
        workUserId: schema.works.userId,
      })
      .from(schema.chapters)
      .innerJoin(schema.works, eq(schema.works.id, schema.chapters.workId))
      .where(eq(schema.chapters.id, p.id))
      .limit(1);

    const chapter = found[0];
    if (!chapter) {
      throw new AppError({
        statusCode: 404,
        code: ERROR_CODE.CHAPTER_001,
        message: "章节不存在",
      });
    }
    if (chapter.workUserId !== userId) {
      throw new AppError({
        statusCode: 403,
        code: ERROR_CODE.WORK_002,
        message: "无权访问该作品",
      });
    }

    return NextResponse.json(
      ok({
        id: chapter.id,
        workId: chapter.workId,
        title: chapter.title,
        content: chapter.content,
        orderIndex: chapter.orderIndex,
        wordCount: chapter.wordCount,
        tags: [],
        createdAt: chapter.createdAt.toISOString(),
        updatedAt: chapter.updatedAt.toISOString(),
      }),
    );
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } },
): Promise<NextResponse> {
  try {
    const ctx = await getApiContext();
    const userId = requireUserId(request, ctx);
    const p = paramsSchema.parse(params);
    const body = updateSchema.parse(await readJson(request));

    const result = await ctx.db.transaction(async (tx: any) => {
      const found = await tx
        .select({
          id: schema.chapters.id,
          workId: schema.chapters.workId,
          wordCount: schema.chapters.wordCount,
          workUserId: schema.works.userId,
        })
        .from(schema.chapters)
        .innerJoin(schema.works, eq(schema.works.id, schema.chapters.workId))
        .where(eq(schema.chapters.id, p.id))
        .limit(1);

      const existing = found[0];
      if (!existing) {
        throw new AppError({
          statusCode: 404,
          code: ERROR_CODE.CHAPTER_001,
          message: "章节不存在",
        });
      }
      if (existing.workUserId !== userId) {
        throw new AppError({
          statusCode: 403,
          code: ERROR_CODE.WORK_002,
          message: "无权访问该作品",
        });
      }

      const newWordCount = body.content === undefined ? existing.wordCount : countWords(body.content);

      const updated = await tx
        .update(schema.chapters)
        .set({
          ...(body.title === undefined ? {} : { title: body.title }),
          ...(body.content === undefined ? {} : { content: body.content }),
          ...(body.content === undefined ? {} : { wordCount: newWordCount }),
          updatedAt: sql`now()`,
        })
        .where(eq(schema.chapters.id, p.id))
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

      const chapter = updated[0];
      if (!chapter) {
        throw new AppError({
          statusCode: 500,
          code: ERROR_CODE.INTERNAL_001,
          message: "服务器内部错误",
        });
      }

      if (newWordCount !== existing.wordCount) {
        await tx
          .update(schema.works)
          .set({
            totalWords: sql`${schema.works.totalWords} + ${newWordCount - existing.wordCount}`,
            updatedAt: sql`now()`,
          })
          .where(eq(schema.works.id, existing.workId));
      }

      return chapter;
    });

    return NextResponse.json(
      ok({
        id: result.id,
        workId: result.workId,
        title: result.title,
        content: result.content,
        orderIndex: result.orderIndex,
        wordCount: result.wordCount,
        tags: [],
        createdAt: result.createdAt.toISOString(),
        updatedAt: result.updatedAt.toISOString(),
      }),
    );
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } },
): Promise<NextResponse> {
  try {
    const ctx = await getApiContext();
    const userId = requireUserId(request, ctx);
    const p = paramsSchema.parse(params);

    await ctx.db.transaction(async (tx: any) => {
      const found = await tx
        .select({
          id: schema.chapters.id,
          workId: schema.chapters.workId,
          wordCount: schema.chapters.wordCount,
          workUserId: schema.works.userId,
        })
        .from(schema.chapters)
        .innerJoin(schema.works, eq(schema.works.id, schema.chapters.workId))
        .where(eq(schema.chapters.id, p.id))
        .limit(1);

      const existing = found[0];
      if (!existing) {
        throw new AppError({
          statusCode: 404,
          code: ERROR_CODE.CHAPTER_001,
          message: "章节不存在",
        });
      }
      if (existing.workUserId !== userId) {
        throw new AppError({
          statusCode: 403,
          code: ERROR_CODE.WORK_002,
          message: "无权访问该作品",
        });
      }

      await tx.delete(schema.chapters).where(eq(schema.chapters.id, p.id));

      await tx
        .update(schema.works)
        .set({
          chaptersCount: sql`${schema.works.chaptersCount} - 1`,
          totalWords: sql`${schema.works.totalWords} - ${existing.wordCount}`,
          updatedAt: sql`now()`,
        })
        .where(eq(schema.works.id, existing.workId));
    });

    return NextResponse.json(ok({}));
  } catch (error) {
    return handleRouteError(error);
  }
}
