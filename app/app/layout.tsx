import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Novel-IDE-Web",
  description: "一个面向长篇小说创作的 Web 写作工作台，采用 IDE 风格界面，并提供 AI 协作写作能力。",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}