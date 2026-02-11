import type { FastifyInstance } from "fastify";
import { registerHealthRoutes } from "./health.routes";

export async function registerRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.get("/api/v1", async () => {
    return {
      success: true,
      data: {
        service: "novel-studio-web-server",
        version: "0.1.0",
      },
    };
  });

  registerHealthRoutes(fastify);
}