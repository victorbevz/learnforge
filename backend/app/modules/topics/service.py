from sqlalchemy import select
from sqlalchemy.orm import Session

from app.modules.topics.models import Topic
from app.modules.topics.schemas import TopicCreate, TopicUpdate

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