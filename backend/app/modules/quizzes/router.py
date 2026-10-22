from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.modules.lessons.router import OwnedLesson
from app.modules.quizzes import service
from app.modules.quizzes.schemas import QuizCreate, QuizRead


router = APIRouter(
    prefix="/courses/{course_id}/topics/{topic_id}/lessons/{lesson_id}/quiz",
    tags=["Quizzes"],
)

DatabaseSession = Annotated[Session, Depends(get_db)]


@router.post("", response_model=QuizRead, status_code=201)
def create_quiz(
    data: QuizCreate,
    lesson: OwnedLesson,
    db: DatabaseSession,
):
    """Create a quiz in a lesson accessible to the current user."""
    try:
        return service.create_quiz(db, lesson.id, data)
    except service.QuizAlreadyExistsError as error:
        raise HTTPException(
            status_code=409,
            detail="This lesson already has a quiz",
        ) from error


@router.get("", response_model=QuizRead)
def get_quiz(
    lesson: OwnedLesson,
    db: DatabaseSession,
):
    """Return a quiz from a lesson accessible to the current user."""
    quiz = service.get_quiz(db, lesson.id)

    if quiz is None:
        raise HTTPException(
            status_code=404,
            detail="This lesson has no quiz yet",
        )

    return quiz