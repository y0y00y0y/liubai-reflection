import type {
  DashboardData,
  DayDetail,
  InsightOverview,
  JournalEntryDetail,
  TableTemplate,
  TableRowDetail,
  TableRowListItem,
} from "@/lib/types";

export const mockDashboard: DashboardData = {
  activity: Array.from({ length: 35 }).map((_, index) => ({
    date: `2026-04-${String((index % 28) + 1).padStart(2, "0")}`,
    day: (index % 28) + 1,
    level: index % 4,
  })),
  entries: [
    {
      id: "1",
      title: "今天先把心里的混乱写下来",
      content: "我感觉自己有点卡住，但只要开始写，就能稍微看到里面到底在拉扯什么。",
      display_date: "2026年4月9日 周四",
      date_key: "2026-04-09",
      emotion_key: "anxious",
      emotion_label: "焦虑",
      weather_key: "cloudy",
      weather_label: "阴天",
      tags: ["成长", "工作"],
      keywords: ["行动卡住", "觉察", "工作学习"],
    },
    {
      id: "2",
      title: "关系里我真正想要的是什么",
      content: "和朋友聊天之后，我发现自己不是想证明自己，而是想被理解。",
      display_date: "2026年4月8日 周三",
      date_key: "2026-04-08",
      emotion_key: "sad",
      emotion_label: "低落",
      weather_key: "rainy",
      weather_label: "下雨",
      tags: ["关系"],
      keywords: ["关系", "期待", "觉察"],
    },
  ],
  latestInsight: {
    state: "摇摆",
    emotion: "焦虑",
    trigger: "面对不确定任务时，内在的担心会先于行动出现。",
    bodyResponse: "身体偏向收紧和无力，像想先退一步。",
    belief: "如果我不能很快做好，就代表自己不够好。",
    need: "把任务拆小，并先允许自己从混乱里慢慢看清楚。",
    values: "诚实 / 坚定",
  },
};

export const mockEntryDetail: JournalEntryDetail = {
  id: "1",
  title: "今天先把心里的混乱写下来",
  content: "我感觉自己有点卡住，但只要开始写，就能稍微看到里面到底在拉扯什么。",
  created_at: "2026-04-09T09:00:00.000Z",
  updated_at: "2026-04-09T09:30:00.000Z",
  emotion_key: "anxious",
  emotion_label: "焦虑",
  weather_key: "cloudy",
  weather_label: "阴天",
  tags: ["成长", "工作"],
  ai_draft: {
    state: "摇摆",
    emotion: "焦虑",
    trigger: "面对任务时，担心自己开始不好。",
    bodyResponse: "胸口发紧，能量下沉。",
    belief: "做不好就会显得能力不够。",
    need: "先拆小，再允许自己慢一点进入。",
    values: "诚实 / 坚定",
  },
  revision: {
    content: "我真正需要的不是立刻高效，而是先承认自己有点怕，然后带着怕也开始。",
    updated_at: "2026-04-09T10:00:00.000Z",
  },
};

export const mockDayDetail: DayDetail = {
  date: "2026-04-09",
  title: "4 月 9 日",
  top_keywords: ["行动卡住", "觉察", "工作学习"],
  primary_emotion: "焦虑",
  weather_summary: ["阴天"],
  entries: mockDashboard.entries,
  summary_text: "这一天共记录 2 条；主题主要围绕开始困难、关系期待与自我觉察。",
};

export const mockInsightOverview: InsightOverview = {
  top_keywords: ["关系", "成长", "工作学习", "行动卡住", "觉察"],
  keyword_breakdown: [
    { label: "关系", count: 5 },
    { label: "成长", count: 4 },
    { label: "工作学习", count: 3 },
    { label: "行动卡住", count: 2 },
    { label: "觉察", count: 2 },
  ],
  emotion_breakdown: [
    { label: "焦虑", count: 4 },
    { label: "低落", count: 2 },
    { label: "平静", count: 1 },
  ],
  weather_breakdown: [
    { label: "阴天", count: 3 },
    { label: "下雨", count: 2 },
  ],
  weather_week: { sunny: 1, rainy: 2, cloudy: 3, windy: 0, snowy: 0 },
  values_breakdown: [
    { label: "被认可", count: 4 },
    { label: "诚实", count: 3 },
    { label: "关怀", count: 2 },
    { label: "自由", count: 2 },
  ],
  weekly_summary: "这一周更多在处理开始困难和关系期待。",
  monthly_summary: "这一月的记录里，成长和关系是最稳定的两条线索。",
  review_portal: {
    kicker: "最近这一段",
    title: "这段时间，关系和成长似乎反复浮现。",
    paragraphs: [
      "有些期待正在被慢慢看见，也有一些行动的阻力还停在原地。",
      "先不急着总结完整，我们只把这些线索放在这里看看。",
    ],
  },
  latest_drafts: [
    {
      entry_id: "1",
      title: "今天先把心里的混乱写下来",
      state: "摇摆",
      emotion: "焦虑",
      trigger: "面对任务时的压力感。",
    },
  ],
};

export const mockTableTemplates: TableTemplate[] = [
  {
    key: "event_log",
    name: "事件",
    description: "记录发生了什么，以及当时和之后的反馈。",
    fields: [
      { key: "event_date", label: "日期", type: "date" },
      { key: "emotion", label: "情绪", type: "text" },
      { key: "weather", label: "天气", type: "text" },
      { key: "event_summary", label: "事件概述", type: "textarea" },
    ],
  },
  {
    key: "action_motivation",
    name: "行动动机",
    description: "拆解想做一件事的动机来源与阻力。",
    fields: [
      { key: "goal", label: "想做的事情", type: "text" },
      { key: "fear_driver", label: "更偏恐惧驱动", type: "boolean" },
      { key: "hope_driver", label: "更偏希望驱动", type: "boolean" },
      { key: "next_step", label: "最小下一步", type: "textarea" },
    ],
  },
  {
    key: "deep_reflection",
    name: "深度觉察",
    description: "拆解触发、身体、感受、信念与支持性行动。",
    fields: [
      { key: "topic", label: "主题", type: "text" },
      { key: "trigger", label: "触发情境", type: "textarea" },
      { key: "body_response", label: "身体反应", type: "textarea" },
      { key: "supportive_action", label: "支持性行动", type: "textarea" },
    ],
  },
];

export const mockTableRows: TableRowListItem[] = [
  {
    id: "row-1",
    template_key: "event_log",
    title: "团队会议后的价值观感受",
    status: "active",
    created_at: "2026-04-09T10:00:00.000Z",
    summary: "勇敢 / 正直 / 坚定",
  },
  {
    id: "row-2",
    template_key: "action_motivation",
    title: "是否继续去木兰实习",
    status: "active",
    created_at: "2026-04-09T11:00:00.000Z",
    summary: "希望驱动多于恐惧驱动",
  },
];

export const mockTableRowDetail: TableRowDetail = {
  id: "row-1",
  template_key: "event_log",
  title: "团队会议后的价值观感受",
  status: "active",
  created_at: "2026-04-09T10:00:00.000Z",
  updated_at: "2026-04-09T10:00:00.000Z",
  fields: [
    { key: "event_date", label: "日期", value: "2025/4/17" },
    { key: "emotion", label: "情绪", value: "good" },
    { key: "weather", label: "天气", value: "晴天" },
    { key: "event_summary", label: "事件概述", value: "使命感会议后更清楚自己的价值观。" },
  ],
};
