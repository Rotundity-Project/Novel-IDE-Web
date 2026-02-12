"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiRequest } from "../../../src/lib/api";
import { clearTokens } from "../../../src/lib/auth";
import { useRouter } from "next/navigation";

type WorkSummary = {
  id: string;
  title: string;
  description: string | null;
  chaptersCount: number;
  totalWords: number;
  updatedAt: string;
};

type WorksListResponse = {
  works: WorkSummary[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export default function WorksPage() {
  const router = useRouter();
  const [works, setWorks] = useState<WorkSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [creating, setCreating] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await apiRequest<WorksListResponse>("works");
      setWorks(res.data.works);
    } catch (e) {
      setError(e instanceof Error ? e.message : "加载失败");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function onCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCreating(true);
    setError(null);

    try {
      await apiRequest("works", {
        method: "POST",
        body: JSON.stringify({
          title,
          description: description.length > 0 ? description : null,
          coverUrl: null,
        }),
      });
      setTitle("");
      setDescription("");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "创建失败");
    } finally {
      setCreating(false);
    }
  }

  function onLogout() {
    clearTokens();
    router.replace("/login");
  }

  return (
    <main className="panel" style={{ maxWidth: 900, margin: "40px auto" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1>作品</h1>
        <button onClick={onLogout} type="button">
          登出
        </button>
      </header>

      <section style={{ marginTop: 20 }}>
        <h2 style={{ marginBottom: 8 }}>新建作品</h2>
        <form onSubmit={onCreate} style={{ display: "grid", gap: 12 }}>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="标题"
            required
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="描述（可选）"
            rows={3}
          />
          <div>
            <button type="submit" disabled={creating}>
              {creating ? "创建中..." : "创建"}
            </button>
          </div>
        </form>
      </section>

      <section style={{ marginTop: 28 }}>
        <h2 style={{ marginBottom: 8 }}>我的作品</h2>
        {loading ? <p>加载中...</p> : null}
        {error ? (
          <div role="alert" style={{ color: "#b00020" }}>
            {error}
          </div>
        ) : null}
        {!loading && works.length === 0 ? <p>暂无作品</p> : null}
        <ul style={{ display: "grid", gap: 10, paddingLeft: 18 }}>
          {works.map((work) => (
            <li key={work.id}>
              <Link href={`/works/${work.id}`}>{work.title}</Link>
              <div style={{ opacity: 0.8, fontSize: 13 }}>
                {work.chaptersCount} 章 · {work.totalWords} 字
              </div>
              {work.description ? (
                <div style={{ opacity: 0.9, marginTop: 4 }}>{work.description}</div>
              ) : null}
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}

