"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { apiRequest } from "../../../../src/lib/api";

type WorkDetail = {
  id: string;
  title: string;
  description: string | null;
  stats: {
    chaptersCount: number;
    totalWords: number;
  };
  updatedAt: string;
};

type ChapterSummary = {
  id: string;
  title: string | null;
  orderIndex: number;
  wordCount: number;
  updatedAt: string;
};

type ChaptersListResponse = {
  chapters: ChapterSummary[];
};

export default function WorkDetailPage() {
  const params = useParams<{ workId: string }>();
  const workId = useMemo(() => params.workId, [params.workId]);

  const [work, setWork] = useState<WorkDetail | null>(null);
  const [chapters, setChapters] = useState<ChapterSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [chapterTitle, setChapterTitle] = useState("");
  const [creating, setCreating] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [workRes, chaptersRes] = await Promise.all([
        apiRequest<WorkDetail>(`works/${workId}`),
        apiRequest<ChaptersListResponse>(`works/${workId}/chapters`),
      ]);
      setWork(workRes.data);
      setChapters(chaptersRes.data.chapters);
    } catch (e) {
      setError(e instanceof Error ? e.message : "加载失败");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [workId]);

  async function onCreateChapter(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCreating(true);
    setError(null);

    try {
      const nextOrderIndex =
        chapters.length === 0 ? 1 : Math.max(...chapters.map((c) => c.orderIndex)) + 1;
      await apiRequest(`works/${workId}/chapters`, {
        method: "POST",
        body: JSON.stringify({
          title: chapterTitle,
          orderIndex: nextOrderIndex,
        }),
      });
      setChapterTitle("");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "创建章节失败");
    } finally {
      setCreating(false);
    }
  }

  return (
    <main className="panel" style={{ maxWidth: 900, margin: "40px auto" }}>
      <nav style={{ marginBottom: 16 }}>
        <Link href="/works">← 返回作品列表</Link>
      </nav>

      {loading ? <p>加载中...</p> : null}
      {error ? (
        <div role="alert" style={{ color: "#b00020" }}>
          {error}
        </div>
      ) : null}

      {work ? (
        <>
          <header style={{ display: "grid", gap: 6 }}>
            <h1>{work.title}</h1>
            {work.description ? <p style={{ opacity: 0.9 }}>{work.description}</p> : null}
            <div style={{ opacity: 0.8, fontSize: 13 }}>
              {work.stats.chaptersCount} 章 · {work.stats.totalWords} 字
            </div>
          </header>

          <section style={{ marginTop: 22 }}>
            <h2 style={{ marginBottom: 8 }}>新建章节</h2>
            <form onSubmit={onCreateChapter} style={{ display: "grid", gap: 10 }}>
              <input
                value={chapterTitle}
                onChange={(e) => setChapterTitle(e.target.value)}
                placeholder="章节标题"
                required
              />
              <div>
                <button type="submit" disabled={creating}>
                  {creating ? "创建中..." : "创建章节"}
                </button>
              </div>
            </form>
          </section>

          <section style={{ marginTop: 28 }}>
            <h2 style={{ marginBottom: 8 }}>章节</h2>
            {chapters.length === 0 ? <p>暂无章节</p> : null}
            <ul style={{ display: "grid", gap: 10, paddingLeft: 18 }}>
              {chapters.map((chapter) => (
                <li key={chapter.id}>
                  <Link href={`/works/${workId}/chapters/${chapter.id}`}>
                    {chapter.orderIndex}. {chapter.title ?? "未命名"}
                  </Link>
                  <div style={{ opacity: 0.8, fontSize: 13 }}>{chapter.wordCount} 字</div>
                </li>
              ))}
            </ul>
          </section>
        </>
      ) : null}
    </main>
  );
}

