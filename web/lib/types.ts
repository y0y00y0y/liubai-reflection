export type InsightDraft = {
  state: string;
  emotion: string;
  trigger: string;
  body_response?: string;
  bodyResponse?: string;
  belief: string;
  need: string;
  values: string;
};

export type Revision = {
  content: string;
  updated_at?: string | null;
};

export type JournalEntryListItem = {
  id: string;
  title: string;
  content: string;
  display_date: string;
  date_key: string;
  emotion_key: string;
  emotion_label: string;
  weather_key?: string | null;
  weather_label?: string | null;
  tags: string[];
  keywords: string[];
};

export type JournalEntryDetail = {
  id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
  emotion_key: string;
  emotion_label: string;
  weather_key?: string | null;
  weather_label?: string | null;
  tags: string[];
  ai_draft: InsightDraft | null;
  revision: Revision | null;
};

export type ActivityPoint = {
  date: string;
  day: number;
  level: number;
};

export type DashboardData = {
  activity: ActivityPoint[];
  entries: JournalEntryListItem[];
  latestInsight: {
    state: string;
    emotion: string;
    trigger: string;
    bodyResponse: string;
    belief: string;
    need: string;
    values: string;
  } | null;
};

export type DayDetail = {
  date: string;
  title: string;
  top_keywords: string[];
  primary_emotion?: string | null;
  weather_summary: string[];
  entries: JournalEntryListItem[];
  table_rows?: TableRowListItem[];
  summary_text: string;
};

export type InsightOverview = {
  top_keywords: string[];
  keyword_breakdown: Array<{ label: string; count: number }>;
  emotion_breakdown: Array<{ label: string; count: number }>;
  weather_breakdown: Array<{ label: string; count: number }>;
  /** 最近 7 天各天气 key 的出现次数，key 为 sunny/rainy/cloudy/windy/snowy */
  weather_week: Record<string, number>;
  /** 核心价值观词汇及频次，由 AI 从所有记录提炼 */
  values_breakdown: Array<{ label: string; count: number }>;
  weekly_summary: string;
  weekly_summary_status?: string;
  monthly_summary: string;
  monthly_summary_status?: string;
  review_portal: {
    kicker: string;
    title: string;
    paragraphs: string[];
  };
  latest_drafts: Array<{
    entry_id: string;
    title: string;
    state: string;
    emotion: string;
    trigger: string;
  }>;
  recent_traces?: Array<{
    id: string;
    kind: "journal" | "seeing";
    title: string;
    summary: string;
    date: string;
    href: string;
  }>;
};

export type TableTemplate = {
  key: string;
  name: string;
  description: string;
  fields: Array<{
    key: string;
    label: string;
    type: string;
  }>;
};

export type TableRowFieldValue = {
  key: string;
  label: string;
  value: string;
};

export type TableRowListItem = {
  id: string;
  template_key: string;
  title: string;
  status: string;
  created_at: string;
  summary: string;
};

export type TableRowDetail = {
  id: string;
  template_key: string;
  title: string;
  status: string;
  created_at: string;
  updated_at: string;
  fields: TableRowFieldValue[];
};
