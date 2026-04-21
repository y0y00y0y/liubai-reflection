from datetime import date, datetime
from uuid import uuid4

from sqlalchemy import Date, DateTime, ForeignKey, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    display_name: Mapped[str] = mapped_column(String(100))
    password_hash: Mapped[str] = mapped_column(String(255))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    entries: Mapped[list["JournalEntry"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    weekly_snapshots: Mapped[list["WeeklySnapshot"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )
    monthly_snapshots: Mapped[list["MonthlySnapshot"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )
    password_reset_tokens: Mapped[list["PasswordResetToken"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )


class PasswordResetToken(Base):
    __tablename__ = "password_reset_tokens"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), index=True)
    token_hash: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)
    used_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    user: Mapped["User"] = relationship(back_populates="password_reset_tokens")


class JournalEntry(Base):
    __tablename__ = "journal_entries"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), index=True)
    title: Mapped[str] = mapped_column(String(200), default="")
    content: Mapped[str] = mapped_column(Text())
    emotion_key: Mapped[str] = mapped_column(String(50), default="mixed")
    emotion_label_snapshot: Mapped[str] = mapped_column(String(50), default="复杂")
    weather_key: Mapped[str | None] = mapped_column(String(50), nullable=True)
    weather_label_snapshot: Mapped[str | None] = mapped_column(String(50), nullable=True)
    source_page: Mapped[str] = mapped_column(String(50), default="home")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), index=True)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    user: Mapped["User"] = relationship(back_populates="entries")
    tags: Mapped[list["EntryTag"]] = relationship(back_populates="entry", cascade="all, delete-orphan")
    ai_draft: Mapped["AiDraft | None"] = relationship(
        back_populates="entry", cascade="all, delete-orphan", uselist=False
    )
    revision: Mapped["EntryRevision | None"] = relationship(
        back_populates="entry", cascade="all, delete-orphan", uselist=False
    )


class EntryTag(Base):
    __tablename__ = "entry_tags"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    entry_id: Mapped[str] = mapped_column(String(36), ForeignKey("journal_entries.id"), index=True)
    tag_name: Mapped[str] = mapped_column(String(100))
    tag_source: Mapped[str] = mapped_column(String(20), default="custom")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    entry: Mapped["JournalEntry"] = relationship(back_populates="tags")


class AiDraft(Base):
    __tablename__ = "entry_ai_drafts"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    entry_id: Mapped[str] = mapped_column(String(36), ForeignKey("journal_entries.id"), unique=True, index=True)
    state: Mapped[str] = mapped_column(String(50))
    emotion: Mapped[str] = mapped_column(String(50))
    trigger: Mapped[str] = mapped_column(Text())
    body_response: Mapped[str] = mapped_column(Text())
    belief: Mapped[str] = mapped_column(Text())
    need: Mapped[str] = mapped_column(Text())
    values: Mapped[str] = mapped_column(String(200))
    model_name: Mapped[str] = mapped_column(String(100), default="heuristic")
    prompt_version: Mapped[str] = mapped_column(String(50), default="v1")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    entry: Mapped["JournalEntry"] = relationship(back_populates="ai_draft")


class EntryRevision(Base):
    __tablename__ = "entry_user_revisions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    entry_id: Mapped[str] = mapped_column(String(36), ForeignKey("journal_entries.id"), unique=True, index=True)
    content: Mapped[str] = mapped_column(Text(), default="")
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    entry: Mapped["JournalEntry"] = relationship(back_populates="revision")


class WeeklySnapshot(Base):
    __tablename__ = "weekly_snapshots"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), index=True)
    period_start: Mapped[date] = mapped_column(Date())
    period_end: Mapped[date] = mapped_column(Date())
    summary_text_ai: Mapped[str] = mapped_column(Text(), default="")
    summary_text_user: Mapped[str] = mapped_column(Text(), default="")
    status: Mapped[str] = mapped_column(String(20), default="fresh")
    generated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    regenerated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    user: Mapped["User"] = relationship(back_populates="weekly_snapshots")


class MonthlySnapshot(Base):
    __tablename__ = "monthly_snapshots"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), index=True)
    period_start: Mapped[date] = mapped_column(Date())
    period_end: Mapped[date] = mapped_column(Date())
    summary_text_ai: Mapped[str] = mapped_column(Text(), default="")
    summary_text_user: Mapped[str] = mapped_column(Text(), default="")
    status: Mapped[str] = mapped_column(String(20), default="fresh")
    generated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    regenerated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    user: Mapped["User"] = relationship(back_populates="monthly_snapshots")


class TableRow(Base):
    __tablename__ = "table_rows"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), index=True)
    template_key: Mapped[str] = mapped_column(String(50), index=True)
    title: Mapped[str] = mapped_column(String(200))
    status: Mapped[str] = mapped_column(String(50), default="active")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    fields: Mapped[list["TableRowField"]] = relationship(
        back_populates="row", cascade="all, delete-orphan"
    )


class TableRowField(Base):
    __tablename__ = "table_row_fields"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    row_id: Mapped[str] = mapped_column(String(36), ForeignKey("table_rows.id"), index=True)
    field_key: Mapped[str] = mapped_column(String(100))
    field_label_snapshot: Mapped[str] = mapped_column(String(200))
    field_value: Mapped[str] = mapped_column(Text(), default="")

    row: Mapped["TableRow"] = relationship(back_populates="fields")
