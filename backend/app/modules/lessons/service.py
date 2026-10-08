from sqlalchemy import select
from sqlalchemy.orm import Session

from app.modules.lessons.models import Lesson
from app.modules.lessons.schemas import LessonCreate, LessonUpdate

def create_lesson(
        db: Session,
        topic_id: int,
        data: LessonCreate,
) -> Lesson:
    """Create a lesson inside an accessible topic."""
    lesson = Lesson(
        topic_id=topic_id,
        title=data.title,
        content=data.content,
        position=data.position,
    )

    db.add(lesson)
    db.commit()
    db.refresh(lesson)
    return lesson

def list_lessons(
    db: Session,
    topic_id: int,
    limit: int,
    offset: int,
) -> list[Lesson]:
    """Return lessons ordered by position and ID."""
    query = (
        select(Lesson)
        .where(Lesson.topic_id == topic_id)
        .order_by(Lesson.position, Lesson.id)
        .limit(limit)
        .offset(offset)
    )
    return list(db.scalars(query).all())


def find_lesson(
    db: Session,
    lesson_id: int,
    topic_id: int,
) -> Lesson | None:
    """Find a lesson belonging to the specified topic."""
    query = select(Lesson).where(
        Lesson.id == lesson_id,
        Lesson.topic_id == topic_id,
    )
    return db.scalar(query)


def update_lesson(
    db: Session,
    lesson: Lesson,
    data: LessonUpdate,
) -> Lesson:
    """Update only explicitly supplied lesson fields."""
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(lesson, field, value)

    db.commit()
    db.refresh(lesson)
    return lesson


def delete_lesson(db: Session, lesson: Lesson) -> None:
    """Delete the supplied lesson."""
    db.delete(lesson)
    db.commit()