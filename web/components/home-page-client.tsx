"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";

import { BookmarkNav } from "@/components/bookmark-nav";
import { EmotionIcon } from "@/components/emotion-icon";
import { WeatherIcon } from "@/components/weather-icon";
import { TOKEN_STORAGE_KEY, createEntry, fetchCurrentUser, fetchDashboard } from "@/lib/api";
import type { DashboardData } from "@/lib/types";

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

function compactDateKey(dateKey: string) {
  return dateKey.replace(/-/g, "");
}

export function HomePageClient({ initialDashboard }: { initialDashboard: DashboardData }) {
  const router = useRouter();
  const todayLabel = useMemo(() => {
    return new Intl.DateTimeFormat("zh-CN", {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "long",
    }).format(new Date());
  }, []);
  const [dashboard, setDashboard] = useState(initialDashboard);
  const [token, setToken] = useState<string | null>(null);
  const [userName, setUserName] = useState("");
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [emotionKey, setEmotionKey] = useState("anxious");
  const [weatherKey, setWeatherKey] = useState<string | null>(null);
  const [showMeta, setShowMeta] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [customTag, setCustomTag] = useState("");
  const [saveMessage, setSaveMessage] = useState(" ");
  const [isSavePending, startSaveTransition] = useTransition();

  useEffect(() => {
    const savedToken = window.localStorage.getItem(TOKEN_STORAGE_KEY);
    if (!savedToken) {
      setIsCheckingAuth(false);
      router.replace("/auth");
      return;
    }
    void fetchCurrentUser(savedToken)
      .then(async (user) => {
        setUserName(user.display_name);
        setToken(savedToken);
        await refreshDashboard(savedToken);
      })
      .catch(() => {
        window.localStorage.removeItem(TOKEN_STORAGE_KEY);
        router.replace("/auth");
      })
      .finally(() => {
        setIsCheckingAuth(false);
      });
  }, [router]);

  async function refreshDashboard(nextToken: string) {
    try {
      const data = await fetchDashboard(nextToken);
      setDashboard(data);
    } catch (error) {
      setSaveMessage(error instanceof Error ? error.message : "拉取数据失败");
    }
  }

  function toggleTag(tag: string) {
    setSelectedTags((current) => (current.includes(tag) ? current.filter((item) => item !== tag) : [...current, tag]));
  }

  function appendCustomTag() {
    const value = customTag.trim();
    if (!value || selectedTags.includes(value)) return;
    setSelectedTags((current) => [...current, value]);
    setCustomTag("");
  }

  function handleSaveEntry() {
    if (!token) {
      router.replace("/auth");
      return;
    }
    if (!content.trim()) {
      setSaveMessage("请先填写再保存。");
      return;
    }

    startSaveTransition(async () => {
      try {
        await createEntry(token, {
          title,
          content,
          emotion_key: emotionKey,
          weather_key: weatherKey,
          tags: selectedTags,
          source_page: "home",
        });
        setTitle("");
        setContent("");
        setSelectedTags([]);
        setCustomTag("");
        setWeatherKey(null);
        setSaveMessage("已保存，可以继续记录下一条。");
        await refreshDashboard(token);
      } catch (error) {
        setSaveMessage(error instanceof Error ? error.message : "保存失败");
      }
    });
  }

  const recentDaysLink = useMemo(() => {
    const reversed = [...dashboard.activity].reverse();
    const first = reversed.find((item) => item.level > 0);
    return first ? `/days/${first.date}` : "/insights";
  }, [dashboard.activity]);

  const heatmapWeeks = useMemo(() => {
    const sorted = [...dashboard.activity].sort((left, right) => left.date.localeCompare(right.date));
    const weeks: typeof sorted[] = [];
    for (let index = 0; index < sorted.length; index += 7) {
      weeks.push(sorted.slice(index, index + 7));
    }
    return weeks;
  }, [dashboard.activity]);

  function handleLogout() {
    window.localStorage.removeItem(TOKEN_STORAGE_KEY);
    router.replace("/auth");
  }

  if (isCheckingAuth) {
    return (
      <main className="subpage-shell">
        <p className="muted">正在验证登录状态...</p>
      </main>
    );
  }

  return (
    <main className="subpage-shell">
      <div className="top-bar">
        <BookmarkNav current="home" />
        <div className="top-account-actions">
          {userName ? <span className="user-id-pill">{userName}</span> : null}
          <button className="secondary-button" onClick={handleLogout} type="button">
            退出登录
          </button>
        </div>
      </div>

      <section className="home-layout">
        <section className="card home-record-card">
          <div className="section-head">
            <div>
              <p className="eyebrow">Home</p>
              <h1 className="page-title">随手记</h1>
              <p className="home-date">{todayLabel}</p>
            </div>
            <div className="home-card-actions">
              <Link className="text-button as-link structured-entry-button" href="/table">
                结构性记录
              </Link>
              <button className="text-button" onClick={() => setShowMeta((current) => !current)} type="button">
                {showMeta ? "收起" : "展开"}
              </button>
            </div>
          </div>

          <input
            className="input title-input"
            placeholder="给这一刻取个名字……"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
          <textarea
            className="textarea giant"
            placeholder={`我自由表达自己的声音，我信任自己的直觉与内在洞察
如果你有比较清晰的想法，或者想复盘，可以点击右上角的结构性记录，进入更深层记录`}
            value={content}
            onChange={(event) => setContent(event.target.value)}
          />

          {showMeta ? (
            <div className="meta-collapse compact">
              <div>
                <p className="meta-label">情绪</p>
                <div className="choice-row">
                  {EMOTIONS.map((emotion) => (
                    <button
                      key={emotion.key}
                      className={`chip-choice ${emotionKey === emotion.key ? "selected" : ""}`}
                      onClick={() => setEmotionKey(emotion.key)}
                      type="button"
                    >
                      <EmotionIcon emotionKey={emotion.key} size={20} />
                      <span>{emotion.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="meta-label">天气</p>
                <div className="choice-row">
                  {WEATHERS.map((weather) => (
                    <button
                      key={weather.key}
                      className={`chip-choice ${weatherKey === weather.key ? "selected" : ""}`}
                      onClick={() => setWeatherKey(weatherKey === weather.key ? null : weather.key)}
                      type="button"
                    >
                      <WeatherIcon weatherKey={weather.key} size={20} />
                      <span>{weather.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="meta-label">标签</p>
                <div className="tag-choice-row">
                  {PRESET_TAGS.map((tag) => (
                    <button
                      key={tag}
                      className={`tag-pill ${selectedTags.includes(tag) ? "selected" : ""}`}
                      onClick={() => toggleTag(tag)}
                      type="button"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
                <div className="custom-tag-row">
                  <input
                    className="input compact"
                    placeholder="自定义标签"
                    value={customTag}
                    onChange={(event) => setCustomTag(event.target.value)}
                  />
                  <button className="secondary-button" onClick={appendCustomTag} type="button">
                    添加
                  </button>
                </div>
              </div>
            </div>
          ) : null}

          <div className="composer-actions">
            <p className="muted">{saveMessage}</p>
            <button className="primary-button" disabled={isSavePending} onClick={handleSaveEntry} type="button">
              {isSavePending ? "保存中..." : "保存"}
            </button>
          </div>
        </section>

        <aside className="home-side-column">
          <section className="card heatmap-compact-card">
            <div className="section-head">
              <div>
                <p className="eyebrow">Calendar</p>
              </div>
              <Link className="text-button as-link recent-day-button" href={recentDaysLink}>
                最近
              </Link>
            </div>
            <div className="github-heatmap">
              <div className="weekday-column">
                <span>Mon</span>
                <span>Tue</span>
                <span>Wed</span>
                <span>Thu</span>
                <span>Fri</span>
                <span>Sat</span>
                <span>Sun</span>
              </div>
              <div className="week-columns">
                {heatmapWeeks.map((week, weekIndex) => (
                  <div className="week-column" key={`week-${weekIndex}`}>
                    {week.map((item) => (
                      <Link
                        key={item.date}
                        href={`/days/${item.date}`}
                        className={`heatmap-cell github level-${item.level}`}
                        title={item.date}
                        aria-label={item.date}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="card recent-side-card">
            <div className="section-head">
              <div>
                <p className="eyebrow">Recent</p>
              </div>
            </div>
            <div className="recent-side-list">
              {dashboard.entries.slice(0, 5).map((entry) => (
                <Link className="entry-card stacked" href={`/journal/${entry.id}`} key={entry.id}>
                  <div className="entry-topline">
                    <h3>{entry.title}</h3>
                    <span>{compactDateKey(entry.date_key)}</span>
                  </div>
                  <p>{entry.content}</p>
                  <div className="entry-meta-row">
                    <span>{entry.emotion_label}</span>
                    {entry.weather_label ? <span>{entry.weather_label}</span> : null}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        </aside>
      </section>
    </main>
  );
}
