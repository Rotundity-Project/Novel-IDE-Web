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

function parseIntOrFallback(value: string | undefined, fallback: number): number {
  if (!value) {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) {
    return fallback;
  }

  return parsed;
}

export type ServerEnv = Readonly<{
  nodeEnv: string;
  host: string;
  port: number;
  databaseUrl: string;
  redisUrl: string;
  jwtAccessSecret: string;
  jwtRefreshSecret: string;
  accessTokenTtlSeconds: number;
  refreshTokenTtlSeconds: number;
}>;

/**
 * 读取服务端运行所需环境变量，并提供可预测的默认值。
 *
 * - 用于 Next Route Handlers 与 Nest 服务复用
 * - 返回值会被冻结，避免运行时被意外修改
 */
export function getEnv(overrides?: Partial<ServerEnv>): ServerEnv {
  const env: ServerEnv = {
    nodeEnv: process.env.NODE_ENV ?? "development",
    host: process.env.HOST ?? "0.0.0.0",
    port: parsePort(process.env.PORT, 3001),
    databaseUrl:
      process.env.DATABASE_URL ??
      "postgresql://novel:novel_dev_password@localhost:5432/novel_ide_web",
    redisUrl: process.env.REDIS_URL ?? "redis://localhost:6379",
    jwtAccessSecret: process.env.JWT_ACCESS_SECRET ?? "dev_jwt_access_secret_change_me",
    jwtRefreshSecret:
      process.env.JWT_REFRESH_SECRET ?? "dev_jwt_refresh_secret_change_me",
    accessTokenTtlSeconds: parseIntOrFallback(process.env.ACCESS_TOKEN_TTL, 7200),
    refreshTokenTtlSeconds: parseIntOrFallback(
      process.env.REFRESH_TOKEN_TTL,
      60 * 60 * 24 * 30,
    ),
  };

  return Object.freeze({ ...env, ...overrides });
}
