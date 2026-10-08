from typing import Annotated

from fastapi import Depends, HTTPException, Path
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.db.session import get_db
from app.modules.auth.models import User
from app.modules.courses import service
from app.modules.courses.models import Course

def get_owned_course(
        course_id: Annotated[int, Path(gt=0, le=2147483647)],
        db: Annotated[Session, Depends(get_db)],
        user: Annotated[User, Depends(get_current_user)],
) -> Course:
    """Load a course accessible to the authenticated user."""
    course = service.find_course(db, course_id, user.id)

    if course is None:
        raise HTTPException(status_code=404, detail="Course not found")

    return course

OwnedCourse = Annotated[Course, Depends(get_owned_course)]