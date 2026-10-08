from sqlalchemy import select
from sqlalchemy.orm import Session

from app.modules.courses.models import Course
from app.modules.courses.schemas import CourseCreate, CourseUpdate


def create_course(
    db: Session,
    owner_id: int,
    data: CourseCreate,
) -> Course:
    """Create a course belonging to the authenticated user."""
    course = Course(
        owner_id=owner_id,
        title=data.title,
        description=data.description,
    )

    db.add(course)
    db.commit()
    db.refresh(course)
    return course


def list_courses(
    db: Session,
    owner_id: int,
    limit: int,
    offset: int,
) -> list[Course]:
    """Return a page of the user's courses."""
    query = (
        select(Course)
        .where(Course.owner_id == owner_id)
        .order_by(Course.id.desc())
        .limit(limit)
        .offset(offset)
    )
    return list(db.scalars(query).all())


def find_course(
    db: Session,
    course_id: int,
    owner_id: int,
) -> Course | None:
    """Find a course only when it belongs to the given user."""
    query = select(Course).where(
        Course.id == course_id,
        Course.owner_id == owner_id,
    )
    return db.scalar(query)


def update_course(
    db: Session,
    course: Course,
    data: CourseUpdate,
) -> Course:
    """Update only explicitly supplied fields."""
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(course, field, value)

    db.commit()
    db.refresh(course)
    return course


def delete_course(db: Session, course: Course) -> None:
    """Delete the supplied course."""
    db.delete(course)
    db.commit()