import { buildServer } from "./app";
import { env } from "./config/env";

async function bootstrap() {
  const app = await buildServer();

  try {
    await app.listen({
      host: env.host,
      port: env.port,
    });
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
}

void bootstrap();