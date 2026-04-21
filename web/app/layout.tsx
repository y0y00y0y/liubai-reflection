import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "留白 · 自我记录与觉察",
  description: "正式版前端，包含记录、轨迹、洞察与账户同步能力。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
