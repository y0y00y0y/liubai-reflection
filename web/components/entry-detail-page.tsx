"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

import { BookmarkNav } from "@/components/bookmark-nav";
import { EmotionIcon } from "@/components/emotion-icon";
import { WeatherIcon } from "@/components/weather-icon";
import { TOKEN_STORAGE_KEY, fetchCurrentUser, fetchEntryDetail, regenerateAiDraft, saveRevision, updateEntry } from "@/lib/api";
import type { JournalEntryDetail } from "@/lib/types";

const EMOTIONS = [
  { key: "happy", label: "开心" },
  { key: "calm", label: "平静" },
  { key: "sad", label: "低落" },
  { key: "anxious", label: "焦虑" },
  { key: "angry", label: "生气" },
  { key: "tired", label: "疲惫" },
];

const WEATHERS = [
  { key: "sunny", label: "晴天" },
  { key: "rainy", label: "下雨" },
  { key: "cloudy", label: "阴天" },
  { key: "windy", label: "刮风" },
  { key: "snowy", label: "下雪" },
];

const PRESET_TAGS = ["家庭", "关系", "学习", "工作", "身体", "成长"];

export function EntryDetailPage({ entryId }: { entryId: string }) {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [entry, setEntry] = useState<JournalEntryDetail | null>(null);
  const [revision, setRevision] = useState("");
  const [message, setMessage] = useState("正在加载记录详情。");
  const [isPending, startTransition] = useTransition();
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
        setToken(savedToken);
        await load(savedToken);
      })
      .catch(() => {
        window.localStorage.removeItem(TOKEN_STORAGE_KEY);
        router.replace("/auth");
      })
      .finally(() => {
        setIsCheckingAuth(false);
      });
  }, [entryId, router]);

  async function load(currentToken: string) {
    try {
      const data = await fetchEntryDetail(currentToken, entryId);
      setEntry(data);
      setRevision(data.revision?.content || "");
      setMessage("看到这条记录你感受到了什么呢。");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "加载失败");
    }
  }

  function handleSaveEntry() {
    if (!token || !entry) return;
    startTransition(async () => {
      const data = await updateEntry(token, entryId, {
        title: entry.title,
        content: entry.content,
        emotion_key: entry.emotion_key,
        weather_key: entry.weather_key,
        tags: entry.tags,
      });
      setEntry(data);
      setMessage("修改已保存。");
    });
  }

  function handleSaveRevision() {
    if (!token) return;
    startTransition(async () => {
      await saveRevision(token, entryId, revision);
      setMessage("人工修订稿已保存。");
      await load(token);
    });
  }

  function handleRegenerate() {
    if (!token) return;
    startTransition(async () => {
      await regenerateAiDraft(token, entryId);
      setMessage("AI 原稿已重新生成。");
      await load(token);
    });
  }

  if (isCheckingAuth) {
    return (
      <main className="subpage-shell">
        <p className="muted">正在验证登录状态...</p>
      </main>
    );
  }

  if (!entry) {
    return (
      <main className="subpage-shell">
        <BookmarkNav current="home" />
        <p className="muted">{message}</p>
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
          <h1>{entry.title || "未命名记录"}</h1>
          <p className="muted">{message}</p>
        </div>
        <Link href={`/days/${entry.created_at.slice(0, 10)}`} className="secondary-button as-link">
          查看当天详情
        </Link>
      </div>

      <section className="detail-grid">
        <article className="card">
          <p className="eyebrow">Entry</p>
          <input
            className="input"
            value={entry.title}
            onChange={(event) => setEntry({ ...entry, title: event.target.value })}
          />
          <textarea
            className="textarea large"
            value={entry.content}
            onChange={(event) => setEntry({ ...entry, content: event.target.value })}
          />
          <p className="meta-label top-gap">情绪</p>
          <div className="choice-row">
            {EMOTIONS.map((em) => (
              <button
                key={em.key}
                type="button"
                className={`chip-choice ${entry.emotion_key === em.key ? "selected" : ""}`}
                onClick={() => setEntry({ ...entry, emotion_key: em.key, emotion_label: em.label })}
              >
                <EmotionIcon emotionKey={em.key} size={18} />
                <span>{em.label}</span>
              </button>
            ))}
          </div>

          <p className="meta-label top-gap">天气</p>
          <div className="choice-row">
            <button
              type="button"
              className={`chip-choice ${!entry.weather_key ? "selected" : ""}`}
              onClick={() => setEntry({ ...entry, weather_key: null, weather_label: null })}
            >
              <span>不记录</span>
            </button>
            {WEATHERS.map((w) => (
              <button
                key={w.key}
                type="button"
                className={`chip-choice ${entry.weather_key === w.key ? "selected" : ""}`}
                onClick={() => setEntry({ ...entry, weather_key: w.key, weather_label: w.label })}
              >
                <WeatherIcon weatherKey={w.key} size={18} />
                <span>{w.label}</span>
              </button>
            ))}
          </div>

          <p className="meta-label top-gap">标签</p>
          <div className="tag-choice-row">
            {PRESET_TAGS.map((tag) => (
              <button
                key={tag}
                type="button"
                className={`tag-pill ${entry.tags.includes(tag) ? "selected" : ""}`}
                onClick={() => {
                  const next = entry.tags.includes(tag)
                    ? entry.tags.filter((t) => t !== tag)
                    : [...entry.tags, tag];
                  setEntry({ ...entry, tags: next });
                }}
              >
                {tag}
              </button>
            ))}
          </div>
          <div className="detail-actions">
            <button className="primary-button" disabled={isPending} onClick={handleSaveEntry} type="button">
              保存记录
            </button>
            <button className="secondary-button" disabled={isPending} onClick={handleRegenerate} type="button">
              重新整理
            </button>
          </div>
        </article>

        <article className="card">
          <p className="eyebrow">AI Draft</p>
          {entry.ai_draft ? (
            <div className="draft-stack">
              <div className="draft-block"><strong>状态</strong><p>{entry.ai_draft.state}</p></div>
              <div className="draft-block"><strong>情绪</strong><p>{entry.ai_draft.emotion}</p></div>
              <div className="draft-block"><strong>触发事件</strong><p>{entry.ai_draft.trigger}</p></div>
              <div className="draft-block"><strong>身体反应</strong><p>{entry.ai_draft.bodyResponse || entry.ai_draft.body_response}</p></div>
              <div className="draft-block"><strong>限制性信念</strong><p>{entry.ai_draft.belief}</p></div>
              <div className="draft-block"><strong>底层需求</strong><p>{entry.ai_draft.need}</p></div>
            </div>
          ) : (
            <p className="muted">未生成。</p>
          )}
        </article>

        <article className="card detail-full">
          <div className="section-head">
            <div>
              <p className="eyebrow">Revision</p>
              <h2>修订</h2>
            </div>
            <button className="primary-button" disabled={isPending} onClick={handleSaveRevision} type="button">
              保存修订稿
            </button>
          </div>
          <textarea className="textarea large" value={revision} onChange={(event) => setRevision(event.target.value)} />
        </article>
      </section>
    </main>
  );
}
