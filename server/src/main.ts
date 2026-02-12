import "dotenv/config";
import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { getEnv } from "@novel/server-core";
import { AppModule } from "./app.module";

async function bootstrap() {
  const env = getEnv();
  const app = await NestFactory.create(AppModule, env.nodeEnv === "test" ? { logger: false } : {});

  app.enableCors({ origin: true });
  app.enableShutdownHooks();

  await app.listen(env.port, env.host);
}

void bootstrap();
