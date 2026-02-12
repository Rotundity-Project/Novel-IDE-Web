"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { apiRequest } from "../../../src/lib/api";
import { setTokens } from "../../../src/lib/auth";

type LoginResponse = {
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

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const result = await apiRequest<LoginResponse>("auth/login", {
        method: "POST",
        auth: false,
        body: JSON.stringify({ email, password }),
      });

      setTokens({
        accessToken: result.data.tokens.accessToken,
        refreshToken: result.data.tokens.refreshToken,
        expiresIn: result.data.tokens.expiresIn,
      });
      router.replace("/works");
    } catch (e) {
      setError(e instanceof Error ? e.message : "登录失败");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="home">
      <div className="panel" style={{ width: "100%", maxWidth: 400, padding: "2.5rem" }}>
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <h1 style={{ fontSize: "1.75rem", marginBottom: "0.5rem" }}>欢迎回来</h1>
          <p style={{ color: "#6b7280", margin: 0 }}>登录 Novel IDE 继续创作</p>
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
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
              <label className="form-label" style={{ marginBottom: 0 }}>密码</label>
            </div>
            <div className="input-group">
              <input
                className="input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type={showPassword ? "text" : "password"}
                placeholder="请输入密码"
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
          </div>

          {error ? (
            <div className="alert" role="alert">
              {error}
            </div>
          ) : null}

          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? "登录中..." : "登录"}
          </button>
          
          <div style={{ textAlign: "center", fontSize: "0.875rem", color: "#6b7280" }}>
            还没有账号？{" "}
            <Link href="/register" className="link">
              立即注册
            </Link>
          </div>
        </form>
      </div>
    </main>
  );
}
