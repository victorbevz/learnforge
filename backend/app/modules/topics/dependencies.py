from typing import Annotated

from fastapi import Depends, HTTPException, Path
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.modules.courses.dependencies import OwnedCourse
from app.modules.topics import service
from app.modules.topics.models import Topic

def get_owned_topic(
        topic_id: Annotated[int, Path(gt=0, le=2147483647)],
        topic_course: OwnedCourse,
        db: Annotated[Session, Depends(get_db)],
) -> Topic:
    """Load a topic from a course owned by the current user."""
    topic = service.find_topic(db, topic_id, topic_course.id)

    if topic is None:
        raise HTTPException(status_code=404, detail="Topic not found")

    return topic

OwnedTopic = Annotated[Topic, Depends(get_owned_topic)]