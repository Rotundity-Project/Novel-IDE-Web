import type { FastifyInstance } from "fastify";

export function registerHealthRoutes(fastify: FastifyInstance): void {
  fastify.get("/health", async () => {
    return {
      success: true,
      data: {
        status: "ok",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
      },
    };
  });

  fastify.get("/api/v1/health", async () => {
    return {
      success: true,
      data: {
        status: "ok",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
      },
    };
  });
}