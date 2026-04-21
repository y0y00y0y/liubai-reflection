from collections import Counter
from datetime import date, datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.deps import get_current_user
from app.db import get_db
from app.models import AiDraft, EntryRevision, EntryTag, JournalEntry, MonthlySnapshot, TableRow, TableRowField, User, WeeklySnapshot
from app.schemas import (
    DashboardData,
    DayDetail,
    EntryCreate,
    EntryDetail,
    EntryListItem,
    EntryUpdate,
    InsightDraft,
    InsightOverview,
    RevisionRead,
    RevisionUpdate,
    TableAiDraftRequest,
    TableTemplate,
    TableRowCreate,
    TableRowDetail,
    TableRowFieldValue,
    TableRowListItem,
    TableRowUpdate,
)
from app.services.entry_presenter import (
    build_dashboard,
    build_day_detail,
    build_insight_overview,
    extract_keywords,
    generate_ai_summary,
    label_for_emotion,
    label_for_weather,
    serialize_entry_list_item,
)
from app.services.insight_extractor import extract_insight
from app.services.table_ai import extract_table_fields
from app.services.table_templates import get_table_templates

router = APIRouter(prefix="/api", tags=["entries"])


def query_entries_for_user(db: Session, user_id: str) -> list[JournalEntry]:
    statement = (
        select(JournalEntry)
        .where(JournalEntry.user_id == user_id, JournalEntry.deleted_at.is_(None))
        .options(joinedload(JournalEntry.tags), joinedload(JournalEntry.ai_draft), joinedload(JournalEntry.revision))
        .order_by(JournalEntry.created_at.desc())
    )
    return list(db.scalars(statement).unique())


def mark_snapshots_stale(current_user: User) -> None:
    for snapshot in current_user.weekly_snapshots:
        snapshot.status = "stale"
    for snapshot in current_user.monthly_snapshots:
        snapshot.status = "stale"


def apply_tags(entry: JournalEntry, tags: list[str]) -> None:
    entry.tags.clear()
    seen: set[str] = set()
    for raw_tag in tags:
        tag_name = raw_tag.strip()
        if not tag_name or tag_name in seen:
            continue
        seen.add(tag_name)
        entry.tags.append(
            EntryTag(
                tag_name=tag_name,
                tag_source="preset" if tag_name in {"家庭", "关系", "学习", "工作", "身体", "成长"} else "custom",
            )
        )


def ensure_ai_draft(entry: JournalEntry, payload: InsightDraft) -> None:
    if entry.ai_draft is None:
        entry.ai_draft = AiDraft(
            state=payload.state,
            emotion=payload.emotion,
            trigger=payload.trigger,
            body_response=payload.body_response,
            belief=payload.belief,
            need=payload.need,
            values=payload.values,
            model_name="heuristic",
            prompt_version="v1",
        )
        return

    entry.ai_draft.state = payload.state
    entry.ai_draft.emotion = payload.emotion
    entry.ai_draft.trigger = payload.trigger
    entry.ai_draft.body_response = payload.body_response
    entry.ai_draft.belief = payload.belief
    entry.ai_draft.need = payload.need
    entry.ai_draft.values = payload.values


def serialize_entry_detail(entry: JournalEntry) -> EntryDetail:
    return EntryDetail(
        id=entry.id,
        title=entry.title or "",
        content=entry.content,
        created_at=entry.created_at,
        updated_at=entry.updated_at,
        emotion_key=entry.emotion_key,
        emotion_label=entry.emotion_label_snapshot,
        weather_key=entry.weather_key,
        weather_label=entry.weather_label_snapshot,
        tags=[tag.tag_name for tag in entry.tags],
        ai_draft=entry.ai_draft,
        revision=entry.revision,
    )


def serialize_table_row(row: TableRow) -> TableRowDetail:
    return TableRowDetail(
        id=row.id,
        template_key=row.template_key,
        title=row.title,
        status=row.status,
        created_at=row.created_at,
        updated_at=row.updated_at,
        fields=[
            TableRowFieldValue(key=field.field_key, label=field.field_label_snapshot, value=field.field_value)
            for field in row.fields
        ],
    )


def summarize_table_row(row: TableRow) -> str:
    parts = [field.field_value.strip() for field in row.fields[:2] if field.field_value.strip()]
    return " / ".join(parts) if parts else "还没有填写内容。"


def apply_table_fields(row: TableRow, fields: list[TableRowFieldValue]) -> None:
    row.fields.clear()
    for field in fields:
        row.fields.append(
            TableRowField(
                field_key=field.key,
                field_label_snapshot=field.label,
                field_value=field.value,
            )
        )


@router.get("/dashboard/demo", response_model=DashboardData)
def demo_dashboard() -> DashboardData:
    base_date = datetime(2026, 4, 8)
    activity = []
    for offset in range(35):
        day = base_date - timedelta(days=34 - offset)
        activity.append({"date": day.strftime("%Y-%m-%d"), "day": day.day, "level": offset % 4})

    entries = [
        EntryListItem(
            id="1",
            title="任务很多时，我最先失去的是开始感",
            content="今天面对复杂任务的时候，我发现自己先被吓住了，而不是先行动。",
            display_date="2026年4月8日 周三",
            date_key="2026-04-08",
            emotion_key="anxious",
            emotion_label="焦虑",
            weather_key="cloudy",
            weather_label="阴天",
            tags=["工作", "学习"],
            keywords=["工作学习", "行动卡住", "身体信号"],
        )
    ]
    return DashboardData(
        activity=activity,
        entries=entries,
        latestInsight={
            "state": "迷茫",
            "emotion": "焦虑",
            "trigger": "复杂任务与不确定性同时出现，抬高了开始门槛。",
            "bodyResponse": "身体趋向收紧、无力和轻微回避。",
            "belief": "如果我不能很快做好，可能代表我不够好。",
            "need": "需要把任务拆小，并先恢复一部分掌控感。",
            "values": "诚实 / 坚定",
        },
    )


@router.get("/dashboard", response_model=DashboardData)
def user_dashboard(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> DashboardData:
    return build_dashboard(query_entries_for_user(db, current_user.id))


@router.get("/calendar/heatmap", response_model=list[dict])
def heatmap(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[dict]:
    return build_dashboard(query_entries_for_user(db, current_user.id)).activity


@router.get("/entries", response_model=list[EntryListItem])
def list_entries(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[EntryListItem]:
    return [serialize_entry_list_item(entry) for entry in query_entries_for_user(db, current_user.id)]


@router.get("/entries/{entry_id}", response_model=EntryDetail)
def get_entry(
    entry_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> EntryDetail:
    statement = (
        select(JournalEntry)
        .where(JournalEntry.id == entry_id, JournalEntry.user_id == current_user.id, JournalEntry.deleted_at.is_(None))
        .options(joinedload(JournalEntry.tags), joinedload(JournalEntry.ai_draft), joinedload(JournalEntry.revision))
    )
    entry = db.scalar(statement)
    if entry is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Entry not found")
    return serialize_entry_detail(entry)


@router.post("/entries", response_model=EntryDetail)
def create_entry(
    payload: EntryCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> EntryDetail:
    entry = JournalEntry(
        user_id=current_user.id,
        title=payload.title.strip(),
        content=payload.content.strip(),
        emotion_key=payload.emotion_key,
        emotion_label_snapshot=label_for_emotion(payload.emotion_key),
        weather_key=payload.weather_key,
        weather_label_snapshot=label_for_weather(payload.weather_key),
        source_page=payload.source_page,
    )
    apply_tags(entry, payload.tags)
    db.add(entry)
    db.flush()

    ai_payload = extract_insight(entry.content)
    ensure_ai_draft(entry, ai_payload)
    if entry.revision is None:
        entry.revision = EntryRevision(content="")
    mark_snapshots_stale(current_user)
    db.commit()
    db.refresh(entry)
    return serialize_entry_detail(entry)


@router.patch("/entries/{entry_id}", response_model=EntryDetail)
def update_entry(
    entry_id: str,
    payload: EntryUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> EntryDetail:
    statement = (
        select(JournalEntry)
        .where(JournalEntry.id == entry_id, JournalEntry.user_id == current_user.id, JournalEntry.deleted_at.is_(None))
        .options(joinedload(JournalEntry.tags), joinedload(JournalEntry.ai_draft), joinedload(JournalEntry.revision))
    )
    entry = db.scalar(statement)
    if entry is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Entry not found")

    if payload.title is not None:
        entry.title = payload.title.strip()
    if payload.content is not None:
        entry.content = payload.content.strip()
        ensure_ai_draft(entry, extract_insight(entry.content))
    if payload.emotion_key is not None:
        entry.emotion_key = payload.emotion_key
        entry.emotion_label_snapshot = label_for_emotion(payload.emotion_key)
    if payload.weather_key is not None:
        entry.weather_key = payload.weather_key
        entry.weather_label_snapshot = label_for_weather(payload.weather_key)
    if payload.tags is not None:
        apply_tags(entry, payload.tags)

    mark_snapshots_stale(current_user)
    db.commit()
    db.refresh(entry)
    return serialize_entry_detail(entry)


@router.delete("/entries/{entry_id}")
def delete_entry(
    entry_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict[str, str]:
    statement = select(JournalEntry).where(
        JournalEntry.id == entry_id, JournalEntry.user_id == current_user.id, JournalEntry.deleted_at.is_(None)
    )
    entry = db.scalar(statement)
    if entry is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Entry not found")
    entry.deleted_at = datetime.utcnow()
    mark_snapshots_stale(current_user)
    db.commit()
    return {"status": "deleted"}


@router.get("/entries/{entry_id}/ai-draft", response_model=InsightDraft)
def get_ai_draft(
    entry_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> InsightDraft:
    entry = db.scalar(
        select(JournalEntry)
        .where(JournalEntry.id == entry_id, JournalEntry.user_id == current_user.id, JournalEntry.deleted_at.is_(None))
        .options(joinedload(JournalEntry.ai_draft))
    )
    if entry is None or entry.ai_draft is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="AI draft not found")
    return entry.ai_draft


@router.post("/entries/{entry_id}/ai-draft/regenerate", response_model=InsightDraft)
def regenerate_ai_draft(
    entry_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> InsightDraft:
    entry = db.scalar(
        select(JournalEntry)
        .where(JournalEntry.id == entry_id, JournalEntry.user_id == current_user.id, JournalEntry.deleted_at.is_(None))
        .options(joinedload(JournalEntry.ai_draft))
    )
    if entry is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Entry not found")
    payload = extract_insight(entry.content)
    ensure_ai_draft(entry, payload)
    mark_snapshots_stale(current_user)
    db.commit()
    return payload


@router.get("/entries/{entry_id}/revision", response_model=RevisionRead)
def get_revision(
    entry_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> RevisionRead:
    entry = db.scalar(
        select(JournalEntry)
        .where(JournalEntry.id == entry_id, JournalEntry.user_id == current_user.id, JournalEntry.deleted_at.is_(None))
        .options(joinedload(JournalEntry.revision))
    )
    if entry is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Entry not found")
    if entry.revision is None:
        return RevisionRead(content="", updated_at=None)
    return entry.revision


@router.put("/entries/{entry_id}/revision", response_model=RevisionRead)
def update_revision(
    entry_id: str,
    payload: RevisionUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> RevisionRead:
    entry = db.scalar(
        select(JournalEntry)
        .where(JournalEntry.id == entry_id, JournalEntry.user_id == current_user.id, JournalEntry.deleted_at.is_(None))
        .options(joinedload(JournalEntry.revision))
    )
    if entry is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Entry not found")
    if entry.revision is None:
        entry.revision = EntryRevision(content=payload.content)
    else:
        entry.revision.content = payload.content
    db.commit()
    db.refresh(entry.revision)
    return entry.revision


@router.get("/days/{target_date}", response_model=DayDetail)
def day_detail(
    target_date: date,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> DayDetail:
    entries = [
        entry
        for entry in query_entries_for_user(db, current_user.id)
        if entry.created_at.date().isoformat() == target_date.isoformat()
    ]
    # 同时查询当天的看见记录
    row_statement = (
        select(TableRow)
        .where(TableRow.user_id == current_user.id)
        .options(joinedload(TableRow.fields))
        .order_by(TableRow.created_at.asc())
    )
    all_rows = list(db.scalars(row_statement).unique())
    day_rows = [row for row in all_rows if row.created_at.date().isoformat() == target_date.isoformat()]
    day_table_rows = [
        TableRowListItem(
            id=row.id,
            template_key=row.template_key,
            title=row.title,
            status=row.status,
            created_at=row.created_at,
            summary=summarize_table_row(row),
        )
        for row in day_rows
    ]
    return build_day_detail(target_date, entries, day_table_rows)


def summarize_period_inputs(entries: list[JournalEntry]) -> tuple[list[str], str]:
    keyword_counter: Counter[str] = Counter()
    emotion_counter: Counter[str] = Counter()
    for entry in entries:
        keyword_counter.update(extract_keywords(entry.content))
        if entry.emotion_label_snapshot:
            emotion_counter.update([entry.emotion_label_snapshot])
    top_keywords = [value for value, _ in keyword_counter.most_common(9)]
    top_emotion = emotion_counter.most_common(1)[0][0] if emotion_counter else "复杂"
    return top_keywords, top_emotion


def entries_in_period(entries: list[JournalEntry], period_start: date, period_end: date) -> list[JournalEntry]:
    return [
        entry
        for entry in entries
        if entry.created_at and period_start <= entry.created_at.date() <= period_end
    ]


def get_or_create_weekly_snapshot(
    db: Session,
    current_user: User,
    entries: list[JournalEntry],
    *,
    force: bool = False,
) -> WeeklySnapshot:
    today = date.today()
    period_start = today - timedelta(days=6)
    period_end = today
    snapshot = db.scalar(
        select(WeeklySnapshot).where(
            WeeklySnapshot.user_id == current_user.id,
            WeeklySnapshot.period_start == period_start,
            WeeklySnapshot.period_end == period_end,
        )
    )
    if snapshot is None:
        snapshot = WeeklySnapshot(user_id=current_user.id, period_start=period_start, period_end=period_end)
        db.add(snapshot)

    should_generate = force or not snapshot.summary_text_ai or (snapshot.status == "stale" and not snapshot.summary_text_ai)
    if should_generate:
        period_entries = entries_in_period(entries, period_start, period_end)
        top_keywords, top_emotion = summarize_period_inputs(period_entries)
        snapshot.summary_text_ai = generate_ai_summary(period_entries, "weekly", top_keywords, top_emotion)
        snapshot.status = "fresh"
        snapshot.regenerated_at = datetime.utcnow()
    return snapshot


def get_or_create_monthly_snapshot(
    db: Session,
    current_user: User,
    entries: list[JournalEntry],
    *,
    force: bool = False,
) -> MonthlySnapshot:
    today = date.today()
    period_start = today - timedelta(days=29)
    period_end = today
    snapshot = db.scalar(
        select(MonthlySnapshot).where(
            MonthlySnapshot.user_id == current_user.id,
            MonthlySnapshot.period_start == period_start,
            MonthlySnapshot.period_end == period_end,
        )
    )
    if snapshot is None:
        snapshot = MonthlySnapshot(user_id=current_user.id, period_start=period_start, period_end=period_end)
        db.add(snapshot)

    should_generate = force or not snapshot.summary_text_ai or (snapshot.status == "stale" and not snapshot.summary_text_ai)
    if should_generate:
        period_entries = entries_in_period(entries, period_start, period_end)
        top_keywords, top_emotion = summarize_period_inputs(period_entries)
        snapshot.summary_text_ai = generate_ai_summary(period_entries, "monthly", top_keywords, top_emotion)
        snapshot.status = "fresh"
        snapshot.regenerated_at = datetime.utcnow()
    return snapshot


@router.get("/insights/overview", response_model=InsightOverview)
def insights_overview(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> InsightOverview:
    row_statement = (
        select(TableRow)
        .where(TableRow.user_id == current_user.id)
        .options(joinedload(TableRow.fields))
        .order_by(TableRow.created_at.desc())
    )
    table_rows = list(db.scalars(row_statement).unique())
    entries = query_entries_for_user(db, current_user.id)
    weekly_snapshot = get_or_create_weekly_snapshot(db, current_user, entries)
    monthly_snapshot = get_or_create_monthly_snapshot(db, current_user, entries)
    db.commit()
    return build_insight_overview(
        entries,
        table_rows,
        weekly_summary=weekly_snapshot.summary_text_ai,
        monthly_summary=monthly_snapshot.summary_text_ai,
        weekly_summary_status=weekly_snapshot.status,
        monthly_summary_status=monthly_snapshot.status,
    )


@router.post("/insights/overview/regenerate", response_model=InsightOverview)
def regenerate_insights_overview(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> InsightOverview:
    row_statement = (
        select(TableRow)
        .where(TableRow.user_id == current_user.id)
        .options(joinedload(TableRow.fields))
        .order_by(TableRow.created_at.desc())
    )
    table_rows = list(db.scalars(row_statement).unique())
    entries = query_entries_for_user(db, current_user.id)
    weekly_snapshot = get_or_create_weekly_snapshot(db, current_user, entries, force=True)
    monthly_snapshot = get_or_create_monthly_snapshot(db, current_user, entries, force=True)
    db.commit()
    return build_insight_overview(
        entries,
        table_rows,
        weekly_summary=weekly_snapshot.summary_text_ai,
        monthly_summary=monthly_snapshot.summary_text_ai,
        weekly_summary_status=weekly_snapshot.status,
        monthly_summary_status=monthly_snapshot.status,
    )



@router.get("/table/templates", response_model=list[TableTemplate])
def table_templates() -> list[TableTemplate]:
    return get_table_templates()


@router.get("/table/rows", response_model=list[TableRowListItem])
def list_table_rows(
    template_key: str | None = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[TableRowListItem]:
    statement = (
        select(TableRow)
        .where(TableRow.user_id == current_user.id)
        .options(joinedload(TableRow.fields))
        .order_by(TableRow.updated_at.desc())
    )
    rows = list(db.scalars(statement).unique())
    if template_key:
        rows = [row for row in rows if row.template_key == template_key]
    return [
        TableRowListItem(
            id=row.id,
            template_key=row.template_key,
            title=row.title,
            status=row.status,
            created_at=row.created_at,
            summary=summarize_table_row(row),
        )
        for row in rows
    ]


@router.post("/table/rows", response_model=TableRowDetail)
def create_table_row(
    payload: TableRowCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> TableRowDetail:
    row = TableRow(
        user_id=current_user.id,
        template_key=payload.template_key,
        title=payload.title,
        status=payload.status,
    )
    apply_table_fields(row, payload.fields)
    db.add(row)
    mark_snapshots_stale(current_user)
    db.commit()
    db.refresh(row)
    return serialize_table_row(row)


@router.get("/table/rows/{row_id}", response_model=TableRowDetail)
def get_table_row(
    row_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> TableRowDetail:
    statement = (
        select(TableRow)
        .where(TableRow.id == row_id, TableRow.user_id == current_user.id)
        .options(joinedload(TableRow.fields))
    )
    row = db.scalar(statement)
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Table row not found")
    return serialize_table_row(row)


@router.patch("/table/rows/{row_id}", response_model=TableRowDetail)
def update_table_row(
    row_id: str,
    payload: TableRowUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> TableRowDetail:
    statement = (
        select(TableRow)
        .where(TableRow.id == row_id, TableRow.user_id == current_user.id)
        .options(joinedload(TableRow.fields))
    )
    row = db.scalar(statement)
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Table row not found")
    if payload.title is not None:
        row.title = payload.title
    if payload.status is not None:
        row.status = payload.status
    if payload.fields is not None:
        apply_table_fields(row, payload.fields)
    mark_snapshots_stale(current_user)
    db.commit()
    db.refresh(row)
    return serialize_table_row(row)


@router.post("/table/rows/ai-draft", response_model=dict)
def table_row_ai_draft(
    payload: TableAiDraftRequest,
    current_user: User = Depends(get_current_user),
) -> dict:
    """
    看见页 AI 整理接口：将用户自由文本提取为结构化字段预览。
    返回 dict，key 为字段 key，value 为提取到的值。
    不写入数据库，仅返回预览结果供前端展示和编辑。
    """
    templates = get_table_templates()
    template = next((t for t in templates if t.key == payload.template_key), None)
    if template is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="未知模板")

    fields = [{"key": f.key, "label": f.label} for f in template.fields]
    return extract_table_fields(payload.template_key, payload.free_text, fields)
