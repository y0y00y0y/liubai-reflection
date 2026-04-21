"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { BookmarkNav } from "@/components/bookmark-nav";
import { WeatherIcon } from "@/components/weather-icon";
import { TOKEN_STORAGE_KEY, fetchCurrentUser, fetchInsightsOverview, regenerateInsightsOverview } from "@/lib/api";
import type { InsightOverview } from "@/lib/types";

/** 天气类型固定顺序与配色，颜色与 SVG 图标笔触色保持一致 */
const WEATHER_TYPES = [
  { key: "sunny",  label: "晴天", color: "#d4872a" },
  { key: "rainy",  label: "下雨", color: "#5a8fa8" },
  { key: "cloudy", label: "阴天", color: "#8a8880" },
  { key: "windy",  label: "刮风", color: "#7a9e8a" },
  { key: "snowy",  label: "下雪", color: "#7baec8" },
];

export function InsightsPageClient() {
  const router = useRouter();
  const detailRef = useRef<HTMLElement | null>(null);
  const [overview, setOverview] = useState<InsightOverview | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [focusedKeyword, setFocusedKeyword] = useState<string | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isRegenerating, setIsRegenerating] = useState(false);

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
        const data = await fetchInsightsOverview(savedToken);
        setOverview(data);
      })
      .catch(() => {
        window.localStorage.removeItem(TOKEN_STORAGE_KEY);
        router.replace("/auth");
      })
      .finally(() => {
        setIsCheckingAuth(false);
      });
  }, [router]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "Enter" || event.isComposing) return;
      if (!overview) return;
      if (event.target instanceof HTMLElement) {
        const interactiveTarget = event.target.closest("a, button, input, textarea, select, [contenteditable='true']");
        if (interactiveTarget) return;
      }
      event.preventDefault();
      scrollToDetail();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [overview]);

  const keywordItems = overview?.keyword_breakdown.slice(0, 9) ?? [];
  const valuesItems = (overview?.values_breakdown ?? []).slice(0, 9);
  const emotionMax = Math.max(...(overview?.emotion_breakdown.map((item) => item.count) ?? [1]), 1);
  const keywordMax = keywordItems.length
    ? Math.max(...keywordItems.map((item) => item.count))
    : 1;
  const portalKeywordLabels = [...keywordItems.map((item) => item.label), ...valuesItems.map((item) => item.label)];
  const portalKeywords = (
    portalKeywordLabels.length
      ? Array.from(new Set(portalKeywordLabels.filter(Boolean)))
      : ["记录", "疲惫", "关系", "身体", "稳定", "被理解"]
  ).slice(0, 8);
  const recentTraces =
    overview?.recent_traces?.length
      ? overview.recent_traces
      : overview?.latest_drafts.map((draft) => ({
          id: draft.entry_id,
          kind: "journal" as const,
          title: draft.title,
          summary: draft.trigger,
          date: "",
          href: `/journal/${draft.entry_id}`,
        })) ?? [];
  const visibleRecentTraces = recentTraces.slice(0, 7);

  if (isCheckingAuth) {
    return (
      <main className="subpage-shell">
        <p className="muted">正在验证登录状态...</p>
      </main>
    );
  }

  if (!overview) {
    return (
      <main className="subpage-shell">
        <BookmarkNav current="insights" />
        <p className="muted">正在汇总最近的觉察信息。</p>
      </main>
    );
  }

  function keywordLevel(count: number) {
    const ratio = count / Math.max(keywordMax, 1);
    if (ratio >= 0.76) return 4;
    if (ratio >= 0.51) return 3;
    if (ratio >= 0.26) return 2;
    return 1;
  }

  function emotionLevel(count: number) {
    const ratio = count / emotionMax;
    if (ratio >= 0.76) return 4;
    if (ratio >= 0.51) return 3;
    if (ratio >= 0.26) return 2;
    return 1;
  }

  function scrollToDetail(keyword?: string) {
    if (keyword) {
      setFocusedKeyword(keyword);
    }
    detailRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function handleRegenerateOverview() {
    if (!token) return;
    setIsRegenerating(true);
    try {
      const data = await regenerateInsightsOverview(token);
      setOverview(data);
    } finally {
      setIsRegenerating(false);
    }
  }

  return (
    <main className="subpage-shell insights-shell">
      <>
          <section className="review-portal">
            <BookmarkNav current="insights" />
            <div className="review-orb" aria-hidden="true" />

            <div className="review-keyword-field" aria-label="最近浮现的关键词">
              {portalKeywords.map((label, index) => (
                <button
                  className={`review-floating-keyword keyword-${index + 1}`}
                  key={label}
                  onClick={() => scrollToDetail(label)}
                  type="button"
                >
                  {label}
                </button>
              ))}
            </div>

            <section className="review-portal-copy">
              <p className="review-kicker">最近这一段</p>
              <h1>这段时间，你似乎一直在努力稳住自己。</h1>
              <p>有些事情反复占据注意力，也有一些珍视的东西正在慢慢变清楚。</p>
              <p>先不急着总结完整。我们只把它们放在这里看看。</p>
            </section>

            <button className="review-continue" onClick={() => scrollToDetail()} type="button">
              按 Enter，继续往下看
            </button>
          </section>

          <section className="review-detail" ref={detailRef}>
            <section className="review-narrative">
              <p className="review-section-label">这一段时间</p>
              {overview.weekly_summary_status === "stale" || overview.monthly_summary_status === "stale" ? (
                <div className="review-refresh-note">
                  <span>有新的记录加入。当前摘要保持为上一次整理的版本。</span>
                  <button onClick={handleRegenerateOverview} disabled={isRegenerating} type="button">
                    {isRegenerating ? "重新整理中..." : "重新整理"}
                  </button>
                </div>
              ) : null}
              <div className="review-summary-pair">
                <article>
                  <h2>近一周</h2>
                  <p>{overview.weekly_summary}</p>
                </article>
                <article>
                  <h2>再往前</h2>
                  <p>{overview.monthly_summary}</p>
                </article>
              </div>
            </section>

            <section className="review-two-column">
              <article className="review-soft-section">
                <p className="review-section-label">反复出现的主题</p>
                {keywordItems.length ? (
                  <div className="review-word-cloud">
                    {keywordItems.map((keyword) => (
                      <button
                        className={`review-word level-${keywordLevel(keyword.count)} ${
                          focusedKeyword === keyword.label ? "focused" : ""
                        }`}
                        key={keyword.label}
                        onClick={() => setFocusedKeyword(keyword.label)}
                        type="button"
                      >
                        {keyword.label}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="muted">还没有明显的主题，慢慢写，线索会自己浮现。</p>
                )}
              </article>

              <article className="review-soft-section">
                <p className="review-section-label">正在珍视的东西</p>
                {valuesItems.length ? (
                  <div className="review-value-list">
                    {valuesItems.map((item: { label: string; count: number }) => (
                      <button
                        className={`review-value ${focusedKeyword === item.label ? "focused" : ""}`}
                        key={item.label}
                        onClick={() => setFocusedKeyword(item.label)}
                        type="button"
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="muted">写得更多一点后，这里会慢慢浮现你反复珍视的东西。</p>
                )}
              </article>
            </section>

            <section className="review-climate">
              <article className="review-soft-section">
                <p className="review-section-label">情绪气候</p>
                <p className="review-climate-copy">
                  这些情绪不说明你做得不好，只是在提醒你：有些部分正在请求被看见。
                </p>
                <div className="review-emotion-list">
                  {overview.emotion_breakdown.map((item) => (
                    <span className={`review-emotion-word level-${emotionLevel(item.count)}`} key={item.label}>
                      {item.label}
                    </span>
                  ))}
                </div>
              </article>

              <article className="review-weather-note">
                <p className="review-section-label">天气</p>
                <div className="weather-week-chart">
                  {WEATHER_TYPES.map(({ key, label, color }) => {
                    const count = overview.weather_week?.[key] ?? 0;
                    return (
                      <div className="weather-week-row" key={key}>
                        <WeatherIcon weatherKey={key} size={22} className="weather-week-icon" />
                        <span className="weather-week-label">{label}</span>
                        <div className="weather-week-dots">
                          {Array.from({ length: 7 }, (_, i) => (
                            <span
                              key={i}
                              className="weather-week-dot"
                              style={i < count ? { borderColor: color, background: color } : undefined}
                            />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </article>
            </section>

            <section className="review-traces">
              <p className="review-section-label">最近留下的痕迹</p>
              <div className="review-trace-list">
                {visibleRecentTraces.map((trace) => (
                  <Link className="review-trace-item" href={trace.href || "/journal"} key={`${trace.kind}-${trace.id}`}>
                    <span>{trace.kind === "seeing" ? "看见" : "随手记"}</span>
                    <div>
                      <h3>{trace.title}</h3>
                      <p>{trace.summary}</p>
                    </div>
                  </Link>
                ))}
                {!visibleRecentTraces.length ? (
                  <p className="muted">最近的记录会放在这里，等你回头时慢慢看。</p>
                ) : null}
              </div>
            </section>
          </section>
      </>
    </main>
  );
}
