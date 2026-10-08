from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Path, Query, Response
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.modules.courses.dependencies import OwnedCourse
from app.modules.topics import service
from app.modules.topics.models import Topic
from app.modules.topics.schemas import TopicCreate, TopicRead, TopicUpdate


router = APIRouter(
    prefix="/courses/{course_id}/topics",
    tags=["Topics"],
)

DatabaseSession = Annotated[Session, Depends(get_db)]


def get_owned_topic(
    topic_id: Annotated[int, Path(gt=0, le=2147483647)],
    course: OwnedCourse,
    db: DatabaseSession,
) -> Topic:
    """Load a topic from a course owned by the current user."""
    topic = service.find_topic(db, topic_id, course.id)

    if topic is None:
        raise HTTPException(status_code=404, detail="Topic not found")

    return topic


OwnedTopic = Annotated[Topic, Depends(get_owned_topic)]


@router.post("", response_model=TopicRead, status_code=201)
def create_topic(
    data: TopicCreate,
    course: OwnedCourse,
    db: DatabaseSession,
):
    """Create a topic in the user's course."""
    return service.create_topic(db, course.id, data)


@router.get("", response_model=list[TopicRead])
def list_topics(
    course: OwnedCourse,
    db: DatabaseSession,
    limit: Annotated[int, Query(ge=1, le=100)] = 50,
    offset: Annotated[int, Query(ge=0)] = 0,
):
    """List topics in the user's course."""
    return service.list_topics(db, course.id, limit, offset)


@router.get("/{topic_id}", response_model=TopicRead)
def get_topic(topic: OwnedTopic):
    """Return a topic from the user's course."""
    return topic


@router.patch("/{topic_id}", response_model=TopicRead)
def update_topic(
    data: TopicUpdate,
    topic: OwnedTopic,
    db: DatabaseSession,
):
    """Edit a topic in the user's course."""
    return service.update_topic(db, topic, data)


@router.delete("/{topic_id}", status_code=204)
def delete_topic(
    topic: OwnedTopic,
    db: DatabaseSession,
) -> Response:
    """Delete a topic from the user's course."""
    service.delete_topic(db, topic)
    return Response(status_code=204)