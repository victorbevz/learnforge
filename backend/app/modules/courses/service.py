from sqlalchemy import func, select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.core.groq import generate_draft
from app.modules.courses.models import Course
from app.modules.courses.schemas import (
    CourseCreate,
    CourseDraft,
    CourseProgressRead,
    CourseUpdate,
)
from app.modules.lessons.lesson_progress import LessonProgress
from app.modules.lessons.models import Lesson
from app.modules.topics.models import Topic


def _add_course(
    db: Session,
    owner_id: int,
    data: CourseCreate,
) -> Course:
    course = Course(
        owner_id=owner_id,
        title=data.title,
        description=data.description,
    )

    db.add(course)
    return course


def create_course(db: Session, owner_id: int, data: CourseCreate) -> Course:
    """Create a course belonging to the authenticated user."""
    course = _add_course(db, owner_id, data)
    db.commit()
    db.refresh(course)
    return course


def generate_course_draft(prompt: str, api_key: str) -> CourseDraft:
    instructions = (
        "Use the request as the subject and audience for a beginner-friendly course "
        "outline, unless it explicitly specifies another level. Write in the requested "
        "language or the language of the request. Return only a JSON object with title, "
        "a short description, and topics. Include one to five topics. Each topic has "
        "a title and one to five lessons. Each lesson has only a title. Keep every "
        "title under 200 characters and order topics and lessons from first to last."
    )
    return generate_draft(api_key, instructions, prompt, CourseDraft)


def create_course_from_draft(db: Session, owner_id: int, data: CourseDraft) -> Course:
    """Save the whole outline in a single transaction."""
    try:
        course = _add_course(db, owner_id, data)
        db.flush()

        topics = [
            Topic(course_id=course.id, title=draft.title, position=position)
            for position, draft in enumerate(data.topics)
        ]
        db.add_all(topics)
        db.flush()

        db.add_all(
            Lesson(topic_id=topic.id, title=lesson.title, position=position)
            for topic, draft in zip(topics, data.topics, strict=True)
            for position, lesson in enumerate(draft.lessons)
        )
        db.commit()
    except SQLAlchemyError:
        db.rollback()
        raise

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

def get_course_progress(
    db: Session,
    course_id: int,
    user_id: int,
) -> CourseProgressRead:
    """Count all lessons and the user's completed lessons in a course."""
    query = (
        select(
            func.count(Lesson.id).label("total_lessons"),
            func.count(LessonProgress.id).label("completed_lessons"),
        )
        .select_from(Lesson)
        .join(Topic, Topic.id == Lesson.topic_id)
        .outerjoin(
            LessonProgress,
            (LessonProgress.lesson_id == Lesson.id)
            & (LessonProgress.user_id == user_id),
        )
        .where(Topic.course_id == course_id)
    )

    total_lessons, completed_lessons = db.execute(query).one()

    completion_percent = (
        round(completed_lessons / total_lessons * 100, 1)
        if total_lessons > 0
        else 0.0
    )

    return CourseProgressRead(
        course_id=course_id,
        total_lessons=total_lessons,
        completed_lessons=completed_lessons,
        completion_percent=completion_percent,
    )
