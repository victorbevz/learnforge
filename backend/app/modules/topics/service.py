from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.modules.topics.models import Topic
from app.modules.topics.schemas import TopicCreate, TopicUpdate

from app.modules.lessons.lesson_progress import LessonProgress
from app.modules.lessons.models import Lesson
from app.modules.topics.schemas import TopicProgressRead

def create_topic(
        db: Session,
        course_id: int,
        data: TopicCreate,
) -> Topic:
    """Create a topic inside an accessible course"""
    topic = Topic(
        course_id=course_id,
        title=data.title,
        position=data.position,
    )

    db.add(topic)
    db.commit()
    db.refresh(topic)
    return topic

def list_topics(
    db: Session,
    course_id: int,
    limit: int,
    offset: int,
) -> list[Topic]:
    """Return topics ordered by position and ID."""
    query = (
        select(Topic)
        .where(Topic.course_id == course_id)
        .order_by(Topic.position, Topic.id)
        .limit(limit)
        .offset(offset)
    )
    return list(db.scalars(query).all())


def find_topic(
    db: Session,
    topic_id: int,
    course_id: int,
) -> Topic | None:
    """Find a topic belonging to the specified course."""
    query = select(Topic).where(
        Topic.id == topic_id,
        Topic.course_id == course_id,
    )
    return db.scalar(query)


def update_topic(
    db: Session,
    topic: Topic,
    data: TopicUpdate,
) -> Topic:
    """Update only explicitly supplied topic fields."""
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(topic, field, value)

    db.commit()
    db.refresh(topic)
    return topic


def delete_topic(db: Session, topic: Topic) -> None:
    """Delete the supplied topic."""
    db.delete(topic)
    db.commit()

def get_topic_progress(
    db: Session,
    topic_id: int,
    user_id: int,
) -> TopicProgressRead:
    """Count all lessons and the user's completed lessons in a topic."""
    query = (
        select(
            func.count(Lesson.id).label("total_lessons"),
            func.count(LessonProgress.id).label("completed_lessons"),
        )
        .select_from(Lesson)
        .outerjoin(
            LessonProgress,
            (LessonProgress.lesson_id == Lesson.id)
            & (LessonProgress.user_id == user_id),
        )
        .where(Lesson.topic_id == topic_id)
    )

    total_lessons, completed_lessons = db.execute(query).one()

    completion_percent = (
        round(completed_lessons / total_lessons * 100, 1)
        if total_lessons > 0
        else 0.0
    )

    return TopicProgressRead(
        topic_id=topic_id,
        total_lessons=total_lessons,
        completed_lessons=completed_lessons,
        completion_percent=completion_percent,
    )