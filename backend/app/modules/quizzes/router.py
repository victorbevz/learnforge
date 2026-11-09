from typing import Annotated

from app.core.config import settings

from fastapi import APIRouter, Depends, HTTPException, Path, Query, Response
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.db.session import get_db
from app.modules.auth.models import User
from app.modules.lessons.router import OwnedLesson
from app.modules.quizzes import service
from app.modules.quizzes.schemas import (
    QuizAttemptRead,
    QuizAttemptSummary,
    QuizCreate,
    QuizEditRead,
    QuizRead,
    QuizResult,
    QuizSubmit,
)


router = APIRouter(
    prefix="/courses/{course_id}/topics/{topic_id}/lessons/{lesson_id}/quiz",
    tags=["Quizzes"],
)

DatabaseSession = Annotated[Session, Depends(get_db)]
CurrentUser = Annotated[User, Depends(get_current_user)]
ResourceId = Annotated[int, Path(gt=0, le=2147483647)]

@router.post("/generate", response_model=QuizCreate)
def generate_quiz(lesson: OwnedLesson) -> QuizCreate:
    content = lesson.content.strip()
    if not content:
        raise HTTPException(status_code=422, detail="Lesson content is empty")

    if settings.groq_api_key is None:
        raise HTTPException(status_code=503, detail="Quiz generation is not configured")

    try:
        return service.generate_quiz_draft(content, settings.groq_api_key.get_secret_value())
    except service.QuizGenerationError as error:
        raise HTTPException(status_code=502, detail=str(error)) from error

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


@router.get("/manage", response_model=QuizEditRead)
def get_quiz_for_edit(lesson: OwnedLesson, db: DatabaseSession):
    """Return the quiz and its correct answers to the lesson owner."""
    quiz = service.get_quiz_for_edit(db, lesson.id)
    if quiz is None:
        raise HTTPException(status_code=404, detail="Quiz not found")
    return quiz


@router.put("/{quiz_id}", status_code=204)
def update_quiz(
    quiz_id: ResourceId, data: QuizCreate, lesson: OwnedLesson, db: DatabaseSession,
) -> Response:
    """Replace the quiz attached to the owned lesson."""
    if not service.update_quiz(db, lesson.id, quiz_id, data):
        raise HTTPException(status_code=404, detail="Quiz not found")
    return Response(status_code=204)


@router.delete("/{quiz_id}", status_code=204)
def delete_quiz(quiz_id: ResourceId, lesson: OwnedLesson, db: DatabaseSession) -> Response:
    """Delete the quiz attached to the owned lesson."""
    if not service.delete_quiz(db, lesson.id, quiz_id):
        raise HTTPException(status_code=404, detail="Quiz not found")
    return Response(status_code=204)


@router.post("/submit", response_model=QuizResult)
def submit_quiz(
    data: QuizSubmit,
    lesson: OwnedLesson,
    user: CurrentUser,
    db: DatabaseSession,
):
    """Check submitted answers for an accessible lesson quiz."""
    try:
        result = service.submit_quiz(db, lesson.id, user.id, data)
    except service.InvalidQuizAnswersError as error:
        raise HTTPException(
            status_code=422,
            detail=str(error),
        ) from error

    if result is None:
        raise HTTPException(
            status_code=404,
            detail="This lesson has no quiz yet",
        )

    return result


@router.get("/attempts", response_model=list[QuizAttemptSummary])
def list_attempts(
    lesson: OwnedLesson,
    user: CurrentUser,
    db: DatabaseSession,
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
    offset: Annotated[int, Query(ge=0, le=2147483647)] = 0,
):
    """List the current user's attempts for the owned lesson."""
    return service.list_attempts(db, lesson.id, user.id, limit, offset)


@router.get("/attempts/{attempt_id}", response_model=QuizAttemptRead)
def get_attempt(
    attempt_id: ResourceId, lesson: OwnedLesson, user: CurrentUser, db: DatabaseSession,
):
    """Return a saved answer review to the user who submitted it."""
    attempt = service.get_attempt(db, lesson.id, user.id, attempt_id)
    if attempt is None:
        raise HTTPException(status_code=404, detail="Attempt not found")
    return attempt
