import { and, eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { AppError, ERROR_CODE, ok, schema } from "@novel/server-core";
import { getApiContext, handleRouteError, readJson, requireUserId } from "../../_utils";

export const runtime = "nodejs";

const paramsSchema = z.object({ id: z.string().uuid() });

const updateSchema = z
  .object({
    title: z.string().min(1).max(255).optional(),
    description: z.string().max(5000).nullable().optional(),
  })
  .refine((v) => v.title !== undefined || v.description !== undefined);

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
        id: schema.works.id,
        userId: schema.works.userId,
        title: schema.works.title,
        description: schema.works.description,
        chaptersCount: schema.works.chaptersCount,
        totalWords: schema.works.totalWords,
        createdAt: schema.works.createdAt,
        updatedAt: schema.works.updatedAt,
      })
      .from(schema.works)
      .where(eq(schema.works.id, p.id))
      .limit(1);

    const work = found[0];
    if (!work) {
      throw new AppError({
        statusCode: 404,
        code: ERROR_CODE.WORK_001,
        message: "作品不存在",
      });
    }
    if (work.userId !== userId) {
      throw new AppError({
        statusCode: 403,
        code: ERROR_CODE.WORK_002,
        message: "无权访问该作品",
      });
    }

    return NextResponse.json(
      ok({
        id: work.id,
        title: work.title,
        description: work.description,
        coverUrl: null,
        settings: {
          defaultAgentId: null,
        },
        stats: {
          chaptersCount: work.chaptersCount,
          totalWords: work.totalWords,
          charactersCount: 0,
        },
        createdAt: work.createdAt.toISOString(),
        updatedAt: work.updatedAt.toISOString(),
      }),
    );
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } },
): Promise<NextResponse> {
  try {
    const ctx = await getApiContext();
    const userId = requireUserId(request, ctx);
    const p = paramsSchema.parse(params);
    const body = updateSchema.parse(await readJson(request));

    const updated = await ctx.db
      .update(schema.works)
      .set({
        ...(body.title === undefined ? {} : { title: body.title }),
        ...(body.description === undefined ? {} : { description: body.description }),
        updatedAt: sql`now()`,
      })
      .where(and(eq(schema.works.id, p.id), eq(schema.works.userId, userId)))
      .returning({
        id: schema.works.id,
        userId: schema.works.userId,
        title: schema.works.title,
        description: schema.works.description,
        createdAt: schema.works.createdAt,
        updatedAt: schema.works.updatedAt,
      });

    const work = updated[0];
    if (!work) {
      throw new AppError({
        statusCode: 404,
        code: ERROR_CODE.WORK_001,
        message: "作品不存在",
      });
    }

    return NextResponse.json(
      ok({
        id: work.id,
        title: work.title,
        description: work.description,
        coverUrl: null,
        userId: work.userId,
        createdAt: work.createdAt.toISOString(),
        updatedAt: work.updatedAt.toISOString(),
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

    const deleted = await ctx.db
      .delete(schema.works)
      .where(and(eq(schema.works.id, p.id), eq(schema.works.userId, userId)))
      .returning({ id: schema.works.id });

    if (deleted.length === 0) {
      throw new AppError({
        statusCode: 404,
        code: ERROR_CODE.WORK_001,
        message: "作品不存在",
      });
    }

    return NextResponse.json(ok({}, "作品已删除"));
  } catch (error) {
    return handleRouteError(error);
  }
}
