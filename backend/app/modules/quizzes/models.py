from datetime import datetime

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    ForeignKey,
    Index,
    JSON,
    String,
    Text,
    func,
    text,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class Quiz(Base):
    __tablename__ = "quizzes"

    id: Mapped[int] = mapped_column(primary_key=True)

    lesson_id: Mapped[int] = mapped_column(
        ForeignKey("lessons.id", ondelete="CASCADE"),
        unique=True,
    )

    title: Mapped[str] = mapped_column(String(200))


class QuizQuestion(Base):
    __tablename__ = "quiz_questions"
    __table_args__ = (
        CheckConstraint(
            "position >= 0",
            name="ck_quiz_questions_position",
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True)

    quiz_id: Mapped[int] = mapped_column(
        ForeignKey("quizzes.id", ondelete="CASCADE"),
        index=True,
    )

    text: Mapped[str] = mapped_column(Text)
    position: Mapped[int] = mapped_column(default=0)


class QuizOption(Base):
    __tablename__ = "quiz_options"
    __table_args__ = (
        CheckConstraint(
            "position >= 0",
            name="ck_quiz_options_position",
        ),
        Index(
            "uq_quiz_options_correct_per_question",
            "question_id",
            unique=True,
            postgresql_where=text("is_correct"),
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True)

    question_id: Mapped[int] = mapped_column(
        ForeignKey("quiz_questions.id", ondelete="CASCADE"),
        index=True,
    )

    text: Mapped[str] = mapped_column(String(1000))
    is_correct: Mapped[bool] = mapped_column(default=False)
    position: Mapped[int] = mapped_column(default=0)


class QuizAttempt(Base):
    __tablename__ = "quiz_attempts"
    __table_args__ = (
        Index("ix_quiz_attempts_lesson_user_id", "lesson_id", "user_id", "id"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    lesson_id: Mapped[int] = mapped_column(
        ForeignKey("lessons.id", ondelete="CASCADE"),
    )
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
    )
    quiz_title: Mapped[str] = mapped_column(String(200))
    total_questions: Mapped[int]
    correct_answers: Mapped[int]
    score_percent: Mapped[float]
    answers: Mapped[list[dict[str, str | bool]]] = mapped_column(JSON)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )
