import { NextResponse } from "next/server";
import { ok } from "@novel/server-core";
import { handleRouteError } from "../_utils";

export const runtime = "nodejs";

export async function GET(): Promise<NextResponse> {
  try {
    return NextResponse.json(
      ok({
        status: "ok",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
      }),
    );
  } catch (error) {
    return handleRouteError(error);
  }
}

