from sqlalchemy import delete, select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.orm import Session

from app.modules.lessons.lesson_progress import LessonProgress
from app.modules.lessons.progress_schemas import LessonProgressRead


def get_progress(
        db: Session,
        user_id: int,
        lesson_id: int,
) -> LessonProgressRead:
    query = select(LessonProgress).where(
        LessonProgress.user_id == user_id,
        LessonProgress.lesson_id == lesson_id,
    )
    progress = db.scalar(query)

    return LessonProgressRead(
        lesson_id=lesson_id,
        is_completed=progress is not None,
        completed_at=progress.completed_at if progress is not None else None,
    )

def complete_lesson(
        db:Session,
        user_id: int,
        lesson_id: int,
) -> LessonProgressRead:
    statement = (
        insert(LessonProgress)
        .values(user_id=user_id, lesson_id=lesson_id)
        .on_conflict_do_nothing(
            constraint="uq_lesson_progress_user_lesson"
        )
    )

    db.execute(statement)
    db.commit()

    return get_progress(db, user_id, lesson_id)

def reset_progress(
    db: Session,
    user_id: int,
    lesson_id: int,
) -> LessonProgressRead:
    statement = delete(LessonProgress).where(
        LessonProgress.user_id == user_id,
        LessonProgress.lesson_id == lesson_id,
    )

    db.execute(statement)
    db.commit()

    return LessonProgressRead(
        lesson_id=lesson_id,
        is_completed=False,
        completed_at=None,
    )