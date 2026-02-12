import jwt from "jsonwebtoken";
import { AppError } from "../errors/app-error";
import { ERROR_CODE } from "../errors/error-codes";

type AccessTokenPayload = {
  sub: string;
  type: "access";
};

type RefreshTokenPayload = {
  sub: string;
  type: "refresh";
  jti: string;
};

export type JwtConfig = Readonly<{
  accessSecret: string;
  refreshSecret: string;
  accessTokenTtlSeconds: number;
  refreshTokenTtlSeconds: number;
}>;

/**
 * 创建一组 JWT 工具函数。
 *
 * - access token: `{ sub, type: "access" }`
 * - refresh token: `{ sub, type: "refresh", jti }`
 * - 校验失败时抛出 AppError（用于统一映射到 API 错误响应）
 */
export function createJwt(config: JwtConfig) {
  return {
    signAccessToken: (userId: string): { token: string; expiresIn: number } => {
      return {
        token: jwt.sign(
          { sub: userId, type: "access" } satisfies AccessTokenPayload,
          config.accessSecret,
          { expiresIn: config.accessTokenTtlSeconds },
        ),
        expiresIn: config.accessTokenTtlSeconds,
      };
    },
    signRefreshToken: (
      userId: string,
      tokenId: string,
    ): { token: string; expiresIn: number } => {
      return {
        token: jwt.sign(
          { sub: userId, type: "refresh", jti: tokenId } satisfies RefreshTokenPayload,
          config.refreshSecret,
          { expiresIn: config.refreshTokenTtlSeconds },
        ),
        expiresIn: config.refreshTokenTtlSeconds,
      };
    },
    verifyAccessToken: (token: string): AccessTokenPayload => {
      try {
        const payload = jwt.verify(token, config.accessSecret) as Partial<AccessTokenPayload>;
        if (payload.type !== "access" || typeof payload.sub !== "string") {
          throw new Error("invalid access token");
        }
        return { sub: payload.sub, type: "access" };
      } catch {
        throw new AppError({
          statusCode: 401,
          code: ERROR_CODE.AUTH_001,
          message: "Token 无效或已过期",
        });
      }
    },
    verifyRefreshToken: (token: string): RefreshTokenPayload => {
      try {
        const payload = jwt.verify(token, config.refreshSecret) as Partial<RefreshTokenPayload>;
        if (
          payload.type !== "refresh" ||
          typeof payload.sub !== "string" ||
          typeof payload.jti !== "string"
        ) {
          throw new Error("invalid refresh token");
        }
        return { sub: payload.sub, type: "refresh", jti: payload.jti };
      } catch {
        throw new AppError({
          statusCode: 401,
          code: ERROR_CODE.AUTH_004,
          message: "Token 刷新失败",
        });
      }
    },
  };
}
