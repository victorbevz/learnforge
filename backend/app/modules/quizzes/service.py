from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.modules.quizzes.models import Quiz, QuizOption, QuizQuestion
from app.modules.quizzes.schemas import (
    QuizCreate,
    QuizOptionRead,
    QuizQuestionRead,
    QuizRead,
)


class QuizAlreadyExistsError(Exception):
    """Raised when a lesson already has a quiz."""


def find_quiz(db: Session, lesson_id: int) -> Quiz | None:
    """Find the quiz attached to a lesson."""
    query = select(Quiz).where(Quiz.lesson_id == lesson_id)
    return db.scalar(query)


def create_quiz(
    db: Session,
    lesson_id: int,
    data: QuizCreate,
) -> QuizRead:
    """Create a quiz with all questions and options atomically."""
    if find_quiz(db, lesson_id) is not None:
        raise QuizAlreadyExistsError("This lesson already has a quiz")

    try:
        quiz = Quiz(
            lesson_id=lesson_id,
            title=data.title,
        )
        db.add(quiz)
        db.flush()

        questions: list[QuizQuestionRead] = []

        for question_position, question_data in enumerate(data.questions):
            question = QuizQuestion(
                quiz_id=quiz.id,
                text=question_data.text,
                position=question_position,
            )
            db.add(question)
            db.flush()

            options = [
                QuizOption(
                    question_id=question.id,
                    text=option_data.text,
                    is_correct=option_data.is_correct,
                    position=option_position,
                )
                for option_position, option_data
                in enumerate(question_data.options)
            ]

            db.add_all(options)
            db.flush()

            questions.append(
                QuizQuestionRead(
                    id=question.id,
                    text=question.text,
                    position=question.position,
                    options=[
                        QuizOptionRead.model_validate(option)
                        for option in options
                    ],
                )
            )

        result = QuizRead(
            id=quiz.id,
            lesson_id=quiz.lesson_id,
            title=quiz.title,
            questions=questions,
        )

        db.commit()
        return result

    except IntegrityError as error:
        db.rollback()

        if find_quiz(db, lesson_id) is not None:
            raise QuizAlreadyExistsError(
                "This lesson already has a quiz"
            ) from error

        raise

    except Exception:
        db.rollback()
        raise

def get_quiz(db: Session, lesson_id: int) -> QuizRead | None:
    """Return a lesson quiz without exposing correct answers."""
    quiz = find_quiz(db, lesson_id)

    if quiz is None:
        return None

    questions = list(
        db.scalars(
            select(QuizQuestion)
            .where(QuizQuestion.quiz_id == quiz.id)
            .order_by(QuizQuestion.position, QuizQuestion.id)
        ).all()
    )

    options = list(
        db.scalars(
            select(QuizOption)
            .join(
                QuizQuestion,
                QuizQuestion.id == QuizOption.question_id,
            )
            .where(QuizQuestion.quiz_id == quiz.id)
            .order_by(QuizOption.position, QuizOption.id)
        ).all()
    )

    options_by_question: dict[int, list[QuizOptionRead]] = {}

    for option in options:
        options_by_question.setdefault(
            option.question_id,
            [],
        ).append(QuizOptionRead.model_validate(option))

    return QuizRead(
        id=quiz.id,
        lesson_id=quiz.lesson_id,
        title=quiz.title,
        questions=[
            QuizQuestionRead(
                id=question.id,
                text=question.text,
                position=question.position,
                options=options_by_question.get(question.id, []),
            )
            for question in questions
        ],
    )