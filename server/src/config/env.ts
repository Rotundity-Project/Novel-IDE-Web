import "dotenv/config";

function parsePort(value: string | undefined, fallback: number): number {
  if (!value) {
    return fallback;
  }

  const port = Number.parseInt(value, 10);
  if (Number.isNaN(port) || port < 1 || port > 65535) {
    return fallback;
  }

  return port;
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  host: process.env.HOST ?? "0.0.0.0",
  port: parsePort(process.env.PORT, 3001),
  databaseUrl:
    process.env.DATABASE_URL ??
    "postgresql://novel:novel_dev_password@localhost:5432/novel_ide_web",
  redisUrl: process.env.REDIS_URL ?? "redis://localhost:6379",
} as const;