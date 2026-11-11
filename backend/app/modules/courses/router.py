from typing import Annotated

from fastapi import APIRouter, Depends, File, HTTPException, Path, Query, Response, UploadFile
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.dependencies import get_current_user
from app.core.groq import GroqGenerationError
from app.db.session import get_db
from app.modules.auth.models import User
from app.modules.courses import service
from app.modules.courses.dependencies import OwnedCourse
from app.modules.courses.pdf_source import MAX_PDF_BYTES, PdfSourceError, extract_pdf_source
from app.modules.courses.schemas import (
    CourseCreate,
    CourseDraft,
    CourseGenerateRequest,
    CourseProgressRead,
    CourseRead,
    CourseUpdate,
)

router = APIRouter(prefix="/courses", tags=["Courses"])

DatabaseSession = Annotated[Session, Depends(get_db)]
CurrentUser = Annotated[User, Depends(get_current_user)]

@router.post("", response_model=CourseRead, status_code=201)
def create_course(
    data: CourseCreate,
    db: DatabaseSession,
    user: CurrentUser,
):
    """Create a personal course."""
    return service.create_course(db, user.id, data)


def _generate_draft(prompt: str, *, from_pdf: bool = False) -> CourseDraft:
    if settings.groq_api_key is None:
        raise HTTPException(status_code=503, detail="Course generation is not configured")

    try:
        return service.generate_course_draft(
            prompt, settings.groq_api_key.get_secret_value(), from_pdf=from_pdf
        )
    except GroqGenerationError as error:
        raise HTTPException(
            status_code=502, detail="Could not generate a valid course draft"
        ) from error


@router.post("/generate", response_model=CourseDraft)
def generate_course(data: CourseGenerateRequest, user: CurrentUser) -> CourseDraft:
    return _generate_draft(data.prompt)


@router.post("/generate-from-pdf", response_model=CourseDraft)
def generate_course_from_pdf(
    user: CurrentUser, file: Annotated[UploadFile, File()]
) -> CourseDraft:
    data = file.file.read(MAX_PDF_BYTES + 1)
    if len(data) > MAX_PDF_BYTES:
        raise HTTPException(status_code=413, detail="PDF files must be 3 MB or smaller")

    try:
        source = extract_pdf_source(data)
    except PdfSourceError as error:
        raise HTTPException(status_code=422, detail=str(error)) from error

    return _generate_draft(source, from_pdf=True)


@router.post("/draft", response_model=CourseRead, status_code=201)
def save_course_draft(data: CourseDraft, db: DatabaseSession, user: CurrentUser):
    return service.create_course_from_draft(db, user.id, data)


@router.get("", response_model=list[CourseRead])
def list_courses(
    db: DatabaseSession,
    user: CurrentUser,
    limit: Annotated[int, Query(ge=1, le=100)] = 50,
    offset: Annotated[int, Query(ge=0)] = 0,
):
    """List the authenticated user's courses."""
    return service.list_courses(db, user.id, limit, offset)


@router.get("/{course_id}", response_model=CourseRead)
def get_course(course: OwnedCourse):
    """Return a course belonging to the authenticated user."""
    return course


@router.patch("/{course_id}", response_model=CourseRead)
def update_course(
    data: CourseUpdate,
    course: OwnedCourse,
    db: DatabaseSession,
):
    """Edit a course belonging to the authenticated user."""
    return service.update_course(db, course, data)


@router.delete("/{course_id}", status_code=204)
def delete_course(
    course: OwnedCourse,
    db: DatabaseSession,
) -> Response:
    """Delete a course belonging to the authenticated user."""
    service.delete_course(db, course)
    return Response(status_code=204)

@router.get(
    "/{course_id}/progress",
    response_model=CourseProgressRead,
)
def get_course_progress(
    course: OwnedCourse,
    db: DatabaseSession,
    user: CurrentUser,
):
    """Return learning progress for the authenticated user's course."""
    return service.get_course_progress(db, course.id, user.id)
