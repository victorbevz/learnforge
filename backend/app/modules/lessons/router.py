from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Path, Query, Response
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.modules.lessons import service
from app.modules.lessons.models import Lesson
from app.modules.lessons.schemas import LessonCreate, LessonRead, LessonUpdate
from app.modules.topics.dependencies import OwnedTopic


router = APIRouter(
    prefix="/courses/{course_id}/topics/{topic_id}/lessons",
    tags=["Lessons"],
)

DatabaseSession = Annotated[Session, Depends(get_db)]


def get_owned_lesson(
    lesson_id: Annotated[int, Path(gt=0, le=2147483647)],
    topic: OwnedTopic,
    db: DatabaseSession,
) -> Lesson:
    """Load a lesson from a topic accessible to the current user."""
    lesson = service.find_lesson(db, lesson_id, topic.id)

    if lesson is None:
        raise HTTPException(status_code=404, detail="Lesson not found")

    return lesson


OwnedLesson = Annotated[Lesson, Depends(get_owned_lesson)]


@router.post("", response_model=LessonRead, status_code=201)
def create_lesson(
    data: LessonCreate,
    topic: OwnedTopic,
    db: DatabaseSession,
):
    """Create a lesson in the user's topic."""
    return service.create_lesson(db, topic.id, data)


@router.get("", response_model=list[LessonRead])
def list_lessons(
    topic: OwnedTopic,
    db: DatabaseSession,
    limit: Annotated[int, Query(ge=1, le=100)] = 50,
    offset: Annotated[int, Query(ge=0)] = 0,
):
    """List lessons in the user's topic."""
    return service.list_lessons(db, topic.id, limit, offset)


@router.get("/{lesson_id}", response_model=LessonRead)
def get_lesson(lesson: OwnedLesson):
    """Return a lesson from the user's topic."""
    return lesson


@router.patch("/{lesson_id}", response_model=LessonRead)
def update_lesson(
    data: LessonUpdate,
    lesson: OwnedLesson,
    db: DatabaseSession,
):
    """Edit a lesson in the user's topic."""
    return service.update_lesson(db, lesson, data)


@router.delete("/{lesson_id}", status_code=204)
def delete_lesson(
    lesson: OwnedLesson,
    db: DatabaseSession,
) -> Response:
    """Delete a lesson from the user's topic."""
    service.delete_lesson(db, lesson)
    return Response(status_code=204)