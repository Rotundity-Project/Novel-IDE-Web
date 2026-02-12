"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { apiRequest } from "../../../../../../src/lib/api";
import { LexicalTextEditor } from "../../../../../../src/components/editor/LexicalTextEditor";

type ChapterDetail = {
  id: string;
  workId: string;
  title: string | null;
  content: string | null;
  orderIndex: number;
  wordCount: number;
  updatedAt: string;
};

export default function ChapterEditorPage() {
  const params = useParams<{ workId: string; chapterId: string }>();
  const workId = useMemo(() => params.workId, [params.workId]);
  const chapterId = useMemo(() => params.chapterId, [params.chapterId]);

  const [chapter, setChapter] = useState<ChapterDetail | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await apiRequest<ChapterDetail>(`chapters/${chapterId}`);
      setChapter(res.data);
      setTitle(res.data.title ?? "");
      setContent(res.data.content ?? "");
    } catch (e) {
      setError(e instanceof Error ? e.message : "加载失败");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [chapterId]);

  async function onSave() {
    setSaving(true);
    setError(null);
    try {
      const res = await apiRequest<ChapterDetail>(`chapters/${chapterId}`, {
        method: "PUT",
        body: JSON.stringify({
          title: title.length > 0 ? title : null,
          content,
          tags: [],
        }),
      });
      setChapter(res.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "保存失败");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="panel" style={{ maxWidth: 900, margin: "40px auto" }}>
      <nav style={{ marginBottom: 16 }}>
        <Link href={`/works/${workId}`}>← 返回章节列表</Link>
      </nav>

      {loading ? <p>加载中...</p> : null}
      {error ? (
        <div role="alert" style={{ color: "#b00020" }}>
          {error}
        </div>
      ) : null}

      {chapter ? (
        <>
          <header style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
            <div>
              <h1 style={{ marginBottom: 6 }}>
                第 {chapter.orderIndex} 章 · {chapter.wordCount} 字
              </h1>
              <div style={{ opacity: 0.8, fontSize: 13 }}>更新于 {chapter.updatedAt}</div>
            </div>
            <button type="button" onClick={onSave} disabled={saving}>
              {saving ? "保存中..." : "保存"}
            </button>
          </header>

          <section style={{ display: "grid", gap: 12, marginTop: 18 }}>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="章节标题" />
            <LexicalTextEditor initialText={content} onChangeText={setContent} />
          </section>
        </>
      ) : null}
    </main>
  );
}
