from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Path, Query, Response
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.db.session import get_db
from app.modules.auth.models import User
from app.modules.courses import service
from app.modules.courses.schemas import CourseCreate, CourseRead, CourseUpdate
from app.modules.courses.dependencies import OwnedCourse

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