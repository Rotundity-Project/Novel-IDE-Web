"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { apiRequest } from "../../../src/lib/api";
import { setTokens } from "../../../src/lib/auth";

type RegisterResponse = {
  user: {
    id: string;
    email: string;
    username: string;
  };
  tokens: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  };
};

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    // Client-side validation
    if (password.length < 8) {
      setError("密码长度至少需要 8 个字符");
      return;
    }

    setSubmitting(true);

    try {
      const result = await apiRequest<RegisterResponse>("auth/register", {
        method: "POST",
        auth: false,
        body: JSON.stringify({ email, username, password }),
      });

      setTokens({
        accessToken: result.data.tokens.accessToken,
        refreshToken: result.data.tokens.refreshToken,
        expiresIn: result.data.tokens.expiresIn,
      });
      router.replace("/works");
    } catch (e) {
      setError(e instanceof Error ? e.message : "注册失败");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="home">
      <div className="panel" style={{ width: "100%", maxWidth: 400, padding: "2.5rem" }}>
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <h1 style={{ fontSize: "1.75rem", marginBottom: "0.5rem" }}>创建账号</h1>
          <p style={{ color: "#6b7280", margin: 0 }}>加入 Novel IDE 开始您的创作之旅</p>
        </div>

        <form onSubmit={onSubmit} style={{ display: "grid", gap: "1.25rem" }}>
          <div>
            <label className="form-label">邮箱</label>
            <input
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              placeholder="name@example.com"
              required
              disabled={submitting}
            />
          </div>

          <div>
            <label className="form-label">用户名</label>
            <input
              className="input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              type="text"
              placeholder="您的笔名"
              required
              disabled={submitting}
            />
          </div>

          <div>
            <label className="form-label">密码</label>
            <div className="input-group">
              <input
                className="input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type={showPassword ? "text" : "password"}
                placeholder="设置登录密码"
                required
                disabled={submitting}
                style={{ paddingRight: "3rem" }}
              />
              <button
                type="button"
                className="input-suffix-btn"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                aria-label={showPassword ? "隐藏密码" : "显示密码"}
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24M1 1l22 22"/></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                )}
              </button>
            </div>
            {password.length > 0 && password.length < 8 && (
              <p style={{ color: "#ef4444", fontSize: "0.75rem", marginTop: "0.25rem", marginBottom: 0 }}>
                密码长度至少需要 8 个字符
              </p>
            )}
          </div>

          {error ? (
            <div className="alert" role="alert">
              {error}
            </div>
          ) : null}

          <button type="submit" className="btn btn-primary" disabled={submitting || (password.length > 0 && password.length < 8)}>
            {submitting ? "注册中..." : "立即注册"}
          </button>
          
          <div style={{ textAlign: "center", fontSize: "0.875rem", color: "#6b7280" }}>
            已有账号？{" "}
            <Link href="/login" className="link">
              直接登录
            </Link>
          </div>
        </form>
      </div>
    </main>
  );
}
