import { getAccessToken } from "./auth";

export type ApiSuccess<T> = {
  success: true;
  data: T;
  message?: string;
};

export type ApiFailure = {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

export class ApiError extends Error {
  public readonly code: string;
  public readonly details?: unknown;

  public constructor(code: string, message: string, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.details = details;
  }
}

function getApiBaseUrl(): string {
  const configured = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (configured) {
    return configured;
  }

  return "";
}

function buildUrl(path: string): string {
  const base = getApiBaseUrl().replace(/\/+$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${base}/api/v1${normalizedPath}`;
}

export async function apiRequest<T>(
  path: string,
  init?: RequestInit & { auth?: boolean },
): Promise<ApiSuccess<T>> {
  const url = buildUrl(path);
  const headers = new Headers(init?.headers);
  headers.set("Accept", "application/json");
  headers.set("Content-Type", "application/json");

  if (init?.auth !== false) {
    const token = getAccessToken();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }

  let response: Response;
  try {
    response = await fetch(url, {
      ...init,
      headers,
    });
  } catch (error) {
    throw new ApiError(
      "NETWORK_001",
      "无法连接到后端服务，请确认网络或 NEXT_PUBLIC_API_BASE_URL 配置正确",
      { url, error },
    );
  }

  if (response.status === 204) {
    return { success: true, data: undefined as T };
  }

  const contentType = response.headers.get("content-type") ?? "";
  const rawBody = await response.text();
  const trimmedBody = rawBody.trim();

  const looksLikeJson =
    contentType.includes("application/json") ||
    trimmedBody.startsWith("{") ||
    trimmedBody.startsWith("[");

  let parsed: unknown = undefined;
  if (trimmedBody && looksLikeJson) {
    try {
      parsed = JSON.parse(trimmedBody) as unknown;
    } catch {
      parsed = undefined;
    }
  }

  const isObjectRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === "object" && value !== null;

  const isApiSuccess = (value: unknown): value is ApiSuccess<T> =>
    isObjectRecord(value) && value.success === true && "data" in value;

  const isApiFailure = (value: unknown): value is ApiFailure => {
    if (!isObjectRecord(value) || value.success !== false) {
      return false;
    }
    const error = value.error;
    return (
      isObjectRecord(error) &&
      typeof error.code === "string" &&
      typeof error.message === "string"
    );
  };

  if (!response.ok) {
    if (isApiFailure(parsed)) {
      throw new ApiError(parsed.error.code, parsed.error.message, parsed.error.details);
    }
    throw new ApiError(
      `HTTP_${response.status}`,
      `后端服务异常（${response.status}）`,
      {
        url,
        status: response.status,
        contentType,
        bodySnippet: trimmedBody.slice(0, 500),
      },
    );
  }

  if (isApiSuccess(parsed)) {
    return parsed;
  }
  if (isApiFailure(parsed)) {
    throw new ApiError(parsed.error.code, parsed.error.message, parsed.error.details);
  }

  throw new ApiError("API_002", "后端返回了非预期响应格式", {
    url,
    status: response.status,
    contentType,
    bodySnippet: trimmedBody.slice(0, 500),
  });
}
