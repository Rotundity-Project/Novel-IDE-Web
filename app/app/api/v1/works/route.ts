import { asc, desc, eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { AppError, ERROR_CODE, ok, schema } from "@novel/server-core";
import { getApiContext, handleRouteError, readJson, requireUserId } from "../_utils";

export const runtime = "nodejs";

const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.enum(["createdAt", "updatedAt", "title"]).default("updatedAt"),
  order: z.enum(["asc", "desc"]).default("desc"),
});

const createWorkSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().max(5000).nullable().optional(),
  coverUrl: z.string().url().nullable().optional(),
});

export async function GET(request: Request): Promise<NextResponse> {
  try {
    const ctx = await getApiContext();
    const userId = requireUserId(request, ctx);

    const url = new URL(request.url);
    const query = listQuerySchema.parse(Object.fromEntries(url.searchParams.entries()));

    const offset = (query.page - 1) * query.limit;
    const sortColumn =
      query.sortBy === "createdAt"
        ? schema.works.createdAt
        : query.sortBy === "title"
          ? schema.works.title
          : schema.works.updatedAt;
    const sortOrder = query.order === "asc" ? asc(sortColumn) : desc(sortColumn);

    const [items, totalRows] = await Promise.all([
      ctx.db
        .select({
          id: schema.works.id,
          title: schema.works.title,
          description: schema.works.description,
          chaptersCount: schema.works.chaptersCount,
          totalWords: schema.works.totalWords,
          updatedAt: schema.works.updatedAt,
        })
        .from(schema.works)
        .where(eq(schema.works.userId, userId))
        .orderBy(sortOrder)
        .limit(query.limit)
        .offset(offset),
      ctx.db
        .select({ total: sql<number>`count(*)` })
        .from(schema.works)
        .where(eq(schema.works.userId, userId)),
    ]);

    const total = Number(totalRows[0]?.total ?? 0);
    const totalPages = Math.max(1, Math.ceil(total / query.limit));

    return NextResponse.json(
      ok({
        works: items.map((row: any) => ({
          id: row.id,
          title: row.title,
          description: row.description,
          coverUrl: null,
          chaptersCount: row.chaptersCount,
          totalWords: row.totalWords,
          updatedAt: row.updatedAt.toISOString(),
        })),
        pagination: {
          page: query.page,
          limit: query.limit,
          total,
          totalPages,
        },
      }),
    );
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const ctx = await getApiContext();
    const userId = requireUserId(request, ctx);
    const body = createWorkSchema.parse(await readJson(request));

    const inserted = await ctx.db
      .insert(schema.works)
      .values({
        userId,
        title: body.title,
        description: body.description ?? null,
      })
      .returning({
        id: schema.works.id,
        userId: schema.works.userId,
        title: schema.works.title,
        description: schema.works.description,
        createdAt: schema.works.createdAt,
        updatedAt: schema.works.updatedAt,
      });

    const work = inserted[0];
    if (!work) {
      throw new AppError({
        statusCode: 500,
        code: ERROR_CODE.INTERNAL_001,
        message: "服务器内部错误",
      });
    }

    return NextResponse.json(
      ok({
        id: work.id,
        title: work.title,
        description: work.description,
        coverUrl: body.coverUrl ?? null,
        userId: work.userId,
        createdAt: work.createdAt.toISOString(),
        updatedAt: work.updatedAt.toISOString(),
      }),
      { status: 201 },
    );
  } catch (error) {
    return handleRouteError(error);
  }
}
