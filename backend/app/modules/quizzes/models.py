from sqlalchemy import (
    CheckConstraint,
    ForeignKey,
    Index,
    String,
    Text,
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