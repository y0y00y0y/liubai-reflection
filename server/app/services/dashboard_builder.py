from collections import Counter
from datetime import datetime, timedelta

from app.models import JournalEntry
from app.schemas import DashboardData, DashboardEntry


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

    return [
        label
        for label, fragments in keyword_map
        if any(fragment in content for fragment in fragments)
    ][:4]


def format_display_date(value: datetime) -> str:
    weekday = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"][value.weekday()]
    return f"{value.year}年{value.month}月{value.day}日 {weekday}"


def build_dashboard(entries: list[JournalEntry]) -> DashboardData:
    now = datetime.now()
    counts = Counter(entry.created_at.date().isoformat() for entry in entries if entry.created_at)
    activity = []

    for offset in range(34, -1, -1):
        day = now - timedelta(days=offset)
        date_key = day.date().isoformat()
        activity.append(
            {
                "date": date_key,
                "day": day.day,
                "level": min(counts.get(date_key, 0), 3),
            }
        )

    dashboard_entries = []
    for entry in entries:
        insight = entry.insight
        dashboard_entries.append(
            DashboardEntry(
                id=entry.id,
                title=entry.title,
                content=entry.content,
                displayDate=format_display_date(entry.created_at),
                state=insight.state if insight else "未分析",
                keywords=extract_keywords(entry.content),
            )
        )

    latest_insight = None
    if entries and entries[0].insight:
        insight = entries[0].insight
        latest_insight = {
            "state": insight.state,
            "emotion": insight.emotion,
            "trigger": insight.trigger,
            "bodyResponse": insight.body_response,
            "belief": insight.belief,
            "need": insight.need,
            "values": insight.values,
        }

    return DashboardData(
        activity=activity,
        entries=dashboard_entries,
        latestInsight=latest_insight,
    )
