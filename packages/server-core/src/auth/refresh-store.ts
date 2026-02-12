import type { Redis } from "../redis";

function refreshKey(tokenId: string): string {
  return `refresh:${tokenId}`;
}

function userRefreshSetKey(userId: string): string {
  return `user_refresh_set:${userId}`;
}

/**
 * 保存 refresh token。
 *
 * 写入两份索引：
 * - `refresh:<tokenId> -> userId`（校验 refresh token 的有效性）
 * - `user_refresh_set:<userId> -> Set<tokenId>`（用于全端登出）
 */
export async function saveRefreshToken(params: {
  redis: Redis;
  userId: string;
  tokenId: string;
  ttlSeconds: number;
}): Promise<void> {
  const { redis, userId, tokenId, ttlSeconds } = params;

  await redis.set(refreshKey(tokenId), userId, { EX: ttlSeconds });
  await redis.sAdd(userRefreshSetKey(userId), tokenId);
  await redis.expire(userRefreshSetKey(userId), ttlSeconds);
}

/**
 * 根据 refresh tokenId（jti）取回其绑定的 userId。
 *
 * 返回 null 表示该 refresh token 已撤销或过期。
 */
export async function getRefreshTokenUserId(params: {
  redis: Redis;
  tokenId: string;
}): Promise<string | null> {
  const { redis, tokenId } = params;
  return redis.get(refreshKey(tokenId));
}

/**
 * 撤销某个 userId 的所有 refresh token（全端登出）。
 *
 * 通过 `user_refresh_set:<userId>` 找到全部 tokenId，并批量删除对应 `refresh:<tokenId>`。
 */
export async function revokeAllRefreshTokens(params: {
  redis: Redis;
  userId: string;
}): Promise<void> {
  const { redis, userId } = params;
  const setKey = userRefreshSetKey(userId);
  const tokenIds = await redis.sMembers(setKey);
  if (tokenIds.length > 0) {
    await redis.del(tokenIds.map(refreshKey));
  }
  await redis.del(setKey);
}
