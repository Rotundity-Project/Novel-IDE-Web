"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { getAccessToken } from "../src/lib/auth";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    const token = getAccessToken();
    router.replace(token ? "/works" : "/login");
  }, [router]);

  return (
    <main className="panel" style={{ maxWidth: 520, margin: "40px auto" }}>
      <h1>Novel-IDE-Web</h1>
      <p>跳转中...</p>
    </main>
  );
}
