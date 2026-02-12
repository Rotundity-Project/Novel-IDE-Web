import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

export { schema };

export type DbClient = ReturnType<typeof drizzle<typeof schema>>;

type DbCache = {
  databaseUrl: string;
  pool: Pool;
  db: DbClient;
};

let cache: DbCache | null = null;

/**
 * 获取 Drizzle DB 客户端与底层连接池。
 *
 * - 进程内按 databaseUrl 做单例缓存，避免在 Route Handler 中重复创建连接池
 * - 应用退出时调用 closeDb() 释放资源
 */
export function getDb(databaseUrl: string): { db: DbClient; pool: Pool } {
  if (cache && cache.databaseUrl === databaseUrl) {
    return { db: cache.db, pool: cache.pool };
  }

  const pool = new Pool({ connectionString: databaseUrl });
  const db = drizzle(pool, { schema });
  cache = { databaseUrl, pool, db };

  return { db, pool };
}

/**
 * 关闭当前缓存的连接池。
 *
 * 适用于 Nest shutdown hook、或测试/脚本中主动释放连接。
 */
export async function closeDb(): Promise<void> {
  if (!cache) {
    return;
  }

  await cache.pool.end();
  cache = null;
}
