import Fastify from "fastify";
import cors from "@fastify/cors";
import { env } from "./config/env";
import { registerRoutes } from "./routes/index";

export async function buildServer() {
  const app = Fastify({
    logger: env.nodeEnv !== "test",
  });

  await app.register(cors, {
    origin: true,
  });

  await registerRoutes(app);

  return app;
}
