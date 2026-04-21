"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { BookmarkNav } from "@/components/bookmark-nav";
import { TOKEN_STORAGE_KEY, fetchCurrentUser, fetchDayDetail } from "@/lib/api";
import type { DayDetail } from "@/lib/types";

export function DayDetailPage({ date }: { date: string }) {
  const router = useRouter();
  const [detail, setDetail] = useState<DayDetail | null>(null);
  const [message, setMessage] = useState("当天感受生成中。");
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    const savedToken = window.localStorage.getItem(TOKEN_STORAGE_KEY);
    if (!savedToken) {
      setIsCheckingAuth(false);
      router.replace("/auth");
      return;
    }
    void fetchCurrentUser(savedToken)
      .then(async () => {
        const data = await fetchDayDetail(savedToken, date);
        setDetail(data);
        setMessage("这是你关于这一天的感受");
      })
      .catch((error) => {
        window.localStorage.removeItem(TOKEN_STORAGE_KEY);
        setMessage(error instanceof Error ? error.message : "加载失败");
        router.replace("/auth");
      })
      .finally(() => {
        setIsCheckingAuth(false);
      });
  }, [date, router]);

  if (isCheckingAuth) {
    return (
      <main className="subpage-shell">
        <p className="muted">正在验证登录状态...</p>
      </main>
    );
  }

  return (
    <main className="subpage-shell">
      <BookmarkNav current="home" />
      <div className="subpage-header">
        <div>
          <Link href="/" className="back-link">
            返回首页
          </Link>
          <h1>{detail?.title || date}</h1>
          <p className="muted">{message}</p>
        </div>
      </div>

      {detail ? (
        <section className="detail-grid">
          <article className="card">
            <p className="eyebrow">Summary</p>
            <p>{detail.summary_text}</p>
            <div className="tag-choice-row">
              {detail.top_keywords.map((keyword) => (
                <span className="tag-pill static" key={keyword}>
                  {keyword}
                </span>
              ))}
            </div>
            <p className="muted top-gap">主情绪：{detail.primary_emotion || "未归纳"}</p>
            <p className="muted">天气：{detail.weather_summary.join(" / ") || "未记录"}</p>
          </article>

          <article className="card detail-full">
            <p className="eyebrow">Entries · 记录</p>
            <div className="entry-stack">
              {detail.entries.map((entry) => (
                <Link className="entry-card" href={`/journal/${entry.id}`} key={entry.id}>
                  <div className="entry-topline">
                    <h3>{entry.title}</h3>
                    <span>{entry.display_date}</span>
                  </div>
                  <p>{entry.content}</p>
                </Link>
              ))}
              {!detail.entries.length ? <p className="muted">这天没有随手记录。</p> : null}
            </div>
          </article>

          {(detail.table_rows?.length ?? 0) > 0 ? (
            <article className="card detail-full">
              <p className="eyebrow">看见 · 结构化记录</p>
              <div className="entry-stack">
                {detail.table_rows!.map((row) => (
                  <article className="entry-card" key={row.id}>
                    <div className="entry-topline">
                      <h3>{row.title}</h3>
                      <span className="muted" style={{ fontSize: 13 }}>{row.template_key}</span>
                    </div>
                    <p>{row.summary}</p>
                  </article>
                ))}
              </div>
            </article>
          ) : null}
        </section>
      ) : null}
    </main>
  );
}
