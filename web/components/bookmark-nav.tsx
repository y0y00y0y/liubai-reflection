"use client";

import Link from "next/link";

type TabKey = "home" | "insights" | "table";

const tabs: Array<{ key: TabKey; label: string; href: string }> = [
  { key: "home",     label: "记录", href: "/"        },
  { key: "table",    label: "看见", href: "/table"    },
  { key: "insights", label: "回顾", href: "/insights" },
];

export function BookmarkNav({ current }: { current: TabKey }) {
  return (
    <nav className="bookmark-nav">
      {tabs.map((tab) => (
        <Link key={tab.key} href={tab.href} className={`bookmark-tab ${current === tab.key ? "active" : ""}`}>
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
