from collections import Counter
from datetime import date, datetime, timedelta

from app.models import AiDraft, JournalEntry, TableRow
from app.schemas import DashboardData, DayDetail, EntryListItem, InsightOverview, TableRowListItem
from app.services.llm_client import generate_text, is_llm_configured

EMOTION_META = {
    "happy": "开心",
    "calm": "平静",
    "sad": "低落",
    "anxious": "焦虑",
    "angry": "生气",
    "tired": "疲惫",
    "mixed": "复杂",
}

WEATHER_META = {
    "sunny": "晴天",
    "rainy": "下雨",
    "cloudy": "阴天",
    "windy": "刮风",
    "snowy": "下雪",
}


def format_display_date(value: datetime) -> str:
    weekday = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"][value.weekday()]
    return f"{value.year}年{value.month}月{value.day}日 {weekday}"


def extract_keywords(content: str) -> list[str]:
    keyword_map = [
        ("家庭", ["家", "父母", "妈妈", "爸爸", "亲人"]),
        ("关系", ["关系", "室友", "同事", "朋友", "导师"]),
        ("自我怀疑", ["怀疑", "害怕", "不敢", "不行", "做不到"]),
        ("行动卡住", ["拖延", "开始不了", "卡住", "不想开始"]),
        ("工作学习", ["任务", "学习", "代码", "项目", "工作"]),
        ("觉察", ["觉察", "发现", "意识到", "看见"]),
        ("期待", ["希望", "期待", "想要", "愿意"]),
        ("身体信号", ["没力气", "疲惫", "胸口", "紧张", "焦虑"]),
    ]
    return [label for label, fragments in keyword_map if any(fragment in content for fragment in fragments)][:4]


def label_for_emotion(key: str | None) -> str:
    return EMOTION_META.get(key or "mixed", "复杂")


def label_for_weather(key: str | None) -> str | None:
    if not key:
        return None
    return WEATHER_META.get(key, key)


def serialize_entry_list_item(entry: JournalEntry) -> EntryListItem:
    return EntryListItem(
        id=entry.id,
        title=entry.title or "未命名记录",
        content=entry.content,
        display_date=format_display_date(entry.created_at),
        date_key=entry.created_at.date().isoformat(),
        emotion_key=entry.emotion_key,
        emotion_label=entry.emotion_label_snapshot,
        weather_key=entry.weather_key,
        weather_label=entry.weather_label_snapshot,
        tags=[tag.tag_name for tag in entry.tags],
        keywords=extract_keywords(entry.content),
    )


def latest_insight_payload(ai_draft: AiDraft | None) -> dict | None:
    if ai_draft is None:
        return None
    return {
        "state": ai_draft.state,
        "emotion": ai_draft.emotion,
        "trigger": ai_draft.trigger,
        "bodyResponse": ai_draft.body_response,
        "belief": ai_draft.belief,
        "need": ai_draft.need,
        "values": ai_draft.values,
    }


def build_dashboard(entries: list[JournalEntry]) -> DashboardData:
    now = datetime.now()
    counts = Counter(entry.created_at.date().isoformat() for entry in entries if entry.created_at)
    activity = []
    for offset in range(34, -1, -1):
        current_day = now - timedelta(days=offset)
        date_key = current_day.date().isoformat()
        activity.append({"date": date_key, "day": current_day.day, "level": min(counts.get(date_key, 0), 3)})

    latest_draft = entries[0].ai_draft if entries else None
    return DashboardData(
        activity=activity,
        entries=[serialize_entry_list_item(entry) for entry in entries[:5]],
        latestInsight=latest_insight_payload(latest_draft),
    )


def build_day_detail(
    target_date: date,
    entries: list[JournalEntry],
    table_rows: list[TableRowListItem] | None = None,
) -> DayDetail:
    keywords_counter = Counter()
    emotion_counter = Counter()
    weather_counter = Counter()

    for entry in entries:
        keywords_counter.update(extract_keywords(entry.content))
        emotion_counter.update([entry.emotion_label_snapshot])
        if entry.weather_label_snapshot:
            weather_counter.update([entry.weather_label_snapshot])

    top_keywords = [value for value, _ in keywords_counter.most_common(5)]
    primary_emotion = emotion_counter.most_common(1)[0][0] if emotion_counter else None
    weather_summary = [value for value, _ in weather_counter.most_common(3)]
    if not entries:
        summary_text = "这一天还没有记录。"
    else:
        summary_text = (
            f"这一天共记录 {len(entries)} 条；"
            f"高频主题为 {' / '.join(top_keywords) if top_keywords else '未提取到明显主题'}；"
            f"情绪基调偏向 {primary_emotion or '复杂'}。"
        )

    return DayDetail(
        date=target_date.isoformat(),
        title=f"{target_date.month}月{target_date.day}日",
        top_keywords=top_keywords,
        primary_emotion=primary_emotion,
        weather_summary=weather_summary,
        entries=[serialize_entry_list_item(entry) for entry in entries],
        table_rows=table_rows or [],
        summary_text=summary_text,
    )


def _fallback_values_breakdown(raw_values: list[str]) -> list[dict]:
    counter: Counter = Counter()
    for value in raw_values:
        for token in value.split("/"):
            word = token.strip()
            if word:
                counter[word] += 1
    return [{"label": label, "count": count} for label, count in counter.most_common(9)]


def extract_values_breakdown(entries: list[JournalEntry]) -> list[dict]:
    raw_values = [entry.ai_draft.values for entry in entries if entry.ai_draft and entry.ai_draft.values]
    if not raw_values:
        return []
    return _fallback_values_breakdown(raw_values)


def generate_ai_summary(entries: list[JournalEntry], period: str, top_keywords: list[str], top_emotion: str) -> str:
    if not is_llm_configured():
        if period == "weekly":
            return f"最近一周较常出现的主题是 {' / '.join(top_keywords[:3]) or '仍在积累中'}。"
        return f"最近一月出现最多的情绪是 {top_emotion or '复杂'}。"

    recent = entries[:10] if period == "weekly" else entries[:30]
    excerpts = "\n".join(f"- {entry.content[:80]}" for entry in recent if entry.content)
    period_label = "一周" if period == "weekly" else "一个月"
    prompt = f"""以下是一个人最近{period_label}的部分日记片段：
{excerpts}

请用温和、简洁的语言，用 2-3 句话总结这段时间的心理状态和主要主题。
不要列清单，不要做诊断，用连贯的句子。"""

    try:
        return generate_text(
            "你是一位温柔的自我觉察教练，用温暖克制的语气写总结。",
            prompt,
        )
    except Exception:
        if period == "weekly":
            return f"最近一周较常出现的主题是 {' / '.join(top_keywords[:3]) or '仍在积累中'}。"
        return f"最近一月出现最多的情绪是 {top_emotion or '复杂'}。"


def _clip_text(value: str, limit: int = 96) -> str:
    text = " ".join(value.split())
    if len(text) <= limit:
        return text
    return f"{text[:limit].rstrip()}..."


def summarize_table_trace(row: TableRow) -> str:
    parts = [field.field_value.strip() for field in row.fields if field.field_value and field.field_value.strip()]
    if not parts:
        return "还没有填写内容。"
    return _clip_text(" / ".join(parts[:2]))


def build_recent_traces(entries: list[JournalEntry], table_rows: list[TableRow]) -> list[dict]:
    traces: list[dict] = []
    for entry in entries:
        traces.append(
            {
                "id": entry.id,
                "kind": "journal",
                "title": entry.title or "未命名记录",
                "summary": _clip_text(entry.ai_draft.trigger if entry.ai_draft and entry.ai_draft.trigger else entry.content),
                "date": entry.created_at.isoformat() if entry.created_at else "",
                "href": f"/journal/{entry.id}",
            }
        )

    for row in table_rows:
        traces.append(
            {
                "id": row.id,
                "kind": "seeing",
                "title": row.title or "看见记录",
                "summary": summarize_table_trace(row),
                "date": row.created_at.isoformat() if row.created_at else "",
                "href": f"/table/{row.id}",
            }
        )

    return sorted(traces, key=lambda item: item.get("date") or "", reverse=True)[:7]


def build_insight_overview(
    entries: list[JournalEntry],
    table_rows: list[TableRow] | None = None,
    weekly_summary: str | None = None,
    monthly_summary: str | None = None,
    weekly_summary_status: str = "fresh",
    monthly_summary_status: str = "fresh",
) -> InsightOverview:
    keyword_counter = Counter()
    emotion_counter = Counter()
    weather_counter = Counter()
    latest_drafts: list[dict] = []
    table_rows = table_rows or []

    today = date.today()
    week_start = today - timedelta(days=6)
    weather_week: dict[str, int] = {key: 0 for key in WEATHER_META}
    for entry in entries:
        if entry.created_at and entry.created_at.date() >= week_start:
            if entry.weather_key and entry.weather_key in WEATHER_META:
                weather_week[entry.weather_key] += 1

    for entry in entries[:6]:
        if entry.ai_draft:
            latest_drafts.append(
                {
                    "entry_id": entry.id,
                    "title": entry.title or "未命名记录",
                    "state": entry.ai_draft.state,
                    "emotion": entry.ai_draft.emotion,
                    "trigger": entry.ai_draft.trigger,
                }
            )

    for entry in entries:
        keyword_counter.update(extract_keywords(entry.content))
        emotion_counter.update([entry.emotion_label_snapshot])
        if entry.weather_label_snapshot:
            weather_counter.update([entry.weather_label_snapshot])

    keyword_breakdown = [{"label": label, "count": count} for label, count in keyword_counter.most_common(9)]
    top_keywords = [value for value, _ in keyword_counter.most_common(9)]
    emotion_breakdown = [{"label": label, "count": count} for label, count in emotion_counter.most_common()]
    weather_breakdown = [{"label": label, "count": count} for label, count in weather_counter.most_common()]
    top_emotion = emotion_breakdown[0]["label"] if emotion_breakdown else "复杂"

    return InsightOverview(
        top_keywords=top_keywords,
        keyword_breakdown=keyword_breakdown,
        emotion_breakdown=emotion_breakdown,
        weather_breakdown=weather_breakdown,
        weather_week=weather_week,
        values_breakdown=extract_values_breakdown(entries),
        weekly_summary=weekly_summary or generate_ai_summary(entries, "weekly", top_keywords, top_emotion),
        weekly_summary_status=weekly_summary_status,
        monthly_summary=monthly_summary or generate_ai_summary(entries, "monthly", top_keywords, top_emotion),
        monthly_summary_status=monthly_summary_status,
        latest_drafts=latest_drafts,
        recent_traces=build_recent_traces(entries, table_rows),
    )
