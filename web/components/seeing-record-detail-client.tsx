"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { BookmarkNav } from "@/components/bookmark-nav";
import { TOKEN_STORAGE_KEY, fetchCurrentUser, fetchTableRowDetail } from "@/lib/api";
import type { TableRowDetail } from "@/lib/types";

const TEMPLATE_LABELS: Record<string, string> = {
  event_log: "事件复盘",
  action_motivation: "动机辨认",
};

type SeeingRecordDetailClientProps = {
  rowId: string;
};

export function SeeingRecordDetailClient({ rowId }: SeeingRecordDetailClientProps) {
  const router = useRouter();
  const [record, setRecord] = useState<TableRowDetail | null>(null);
  const [message, setMessage] = useState("正在打开这一次看见。");
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
        const detail = await fetchTableRowDetail(savedToken, rowId);
        setRecord(detail);
        setMessage("");
      })
      .catch((error) => {
        window.localStorage.removeItem(TOKEN_STORAGE_KEY);
        setMessage(error instanceof Error ? error.message : "没有找到这条看见记录。");
      })
      .finally(() => {
        setIsCheckingAuth(false);
      });
  }, [router, rowId]);

  if (isCheckingAuth) {
    return (
      <main className="subpage-shell">
        <p className="muted">正在验证登录状态...</p>
      </main>
    );
  }

  return (
    <main className="subpage-shell seeing-record-page">
      <BookmarkNav current="table" />

      <section className="seeing-record-shell">
        {record ? (
          <>
            <header className="seeing-record-header">
              <p className="seeing-detail-kicker">{TEMPLATE_LABELS[record.template_key] ?? "看见记录"}</p>
              <h1>{record.title || "这一次看见"}</h1>
              <p>这是一条已经留下的记录。先不急着重写，只把当时看见的层次重新放到眼前。</p>
            </header>

            <section className="seeing-record-fields">
              {record.fields.map((field, index) => (
                <article className="seeing-record-field" key={`${field.key}-${index}`}>
                  <div className="seeing-record-question">
                    <span>{index + 1}</span>
                    <h2>{field.label}</h2>
                  </div>
                  <p>{field.value || "这一层当时还没有写下内容。"}</p>
                </article>
              ))}
            </section>

            <footer className="seeing-record-actions">
              <Link className="seeing-action-button primary" href="/insights">
                回到回顾
              </Link>
              <Link className="seeing-action-button" href="/table">
                写一条新的看见
              </Link>
            </footer>
          </>
        ) : (
          <section className="seeing-record-header">
            <p className="muted">{message}</p>
            <Link className="seeing-action-button" href="/insights">
              回到回顾
            </Link>
          </section>
        )}
      </section>
    </main>
  );
}
