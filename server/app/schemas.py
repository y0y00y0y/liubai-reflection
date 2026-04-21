from datetime import datetime

from pydantic import BaseModel, EmailStr, Field


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserCreate(BaseModel):
    email: EmailStr
    display_name: str
    password: str


class UserRead(BaseModel):
    id: str
    email: EmailStr
    display_name: str

    model_config = {"from_attributes": True}


class LoginInput(BaseModel):
    email: EmailStr
    password: str


class PasswordResetRequest(BaseModel):
    email: EmailStr


class PasswordResetRequestResponse(BaseModel):
    message: str
    reset_token: str | None = None


class PasswordResetConfirm(BaseModel):
    token: str
    new_password: str


class MessageResponse(BaseModel):
    message: str


class InsightDraft(BaseModel):
    state: str
    emotion: str
    trigger: str
    body_response: str
    belief: str
    need: str
    values: str

    model_config = {"from_attributes": True}


class RevisionRead(BaseModel):
    content: str
    updated_at: datetime | None = None

    model_config = {"from_attributes": True}


class RevisionUpdate(BaseModel):
    content: str


class EntryCreate(BaseModel):
    title: str = ""
    content: str
    emotion_key: str = "mixed"
    weather_key: str | None = None
    tags: list[str] = Field(default_factory=list)
    source_page: str = "home"


class EntryUpdate(BaseModel):
    title: str | None = None
    content: str | None = None
    emotion_key: str | None = None
    weather_key: str | None = None
    tags: list[str] | None = None


class EntryListItem(BaseModel):
    id: str
    title: str
    content: str
    display_date: str
    date_key: str
    emotion_key: str
    emotion_label: str
    weather_key: str | None
    weather_label: str | None
    tags: list[str]
    keywords: list[str]


class EntryDetail(BaseModel):
    id: str
    title: str
    content: str
    created_at: datetime
    updated_at: datetime
    emotion_key: str
    emotion_label: str
    weather_key: str | None
    weather_label: str | None
    tags: list[str]
    ai_draft: InsightDraft | None
    revision: RevisionRead | None


class ActivityPoint(BaseModel):
    date: str
    day: int
    level: int


class DashboardData(BaseModel):
    activity: list[ActivityPoint]
    entries: list[EntryListItem]
    latest_insight: dict | None = Field(default=None, alias="latestInsight")

    model_config = {"populate_by_name": True}


class DayDetail(BaseModel):
    date: str
    title: str
    top_keywords: list[str]
    primary_emotion: str | None
    weather_summary: list[str]
    entries: list[EntryListItem]
    table_rows: list["TableRowListItem"] = []
    summary_text: str


class InsightOverview(BaseModel):
    top_keywords: list[str]
    keyword_breakdown: list[dict]
    emotion_breakdown: list[dict]
    weather_breakdown: list[dict]
    weather_week: dict
    values_breakdown: list[dict]
    weekly_summary: str
    weekly_summary_status: str = "fresh"
    monthly_summary: str
    monthly_summary_status: str = "fresh"
    latest_drafts: list[dict]
    recent_traces: list[dict] = Field(default_factory=list)


class TemplateField(BaseModel):
    key: str
    label: str
    type: str


class TableTemplate(BaseModel):
    key: str
    name: str
    description: str
    fields: list[TemplateField]


class TableRowFieldValue(BaseModel):
    key: str
    label: str
    value: str


class TableRowCreate(BaseModel):
    template_key: str
    title: str
    status: str = "active"
    fields: list[TableRowFieldValue] = Field(default_factory=list)


class TableRowUpdate(BaseModel):
    title: str | None = None
    status: str | None = None
    fields: list[TableRowFieldValue] | None = None


class TableAiDraftRequest(BaseModel):
    template_key: str
    free_text: str


class TableRowListItem(BaseModel):
    id: str
    template_key: str
    title: str
    status: str
    created_at: datetime
    summary: str

    model_config = {"from_attributes": True}


class TableRowDetail(BaseModel):
    id: str
    template_key: str
    title: str
    status: str
    created_at: datetime
    updated_at: datetime
    fields: list[TableRowFieldValue]
