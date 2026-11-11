from pydantic import BaseModel, ConfigDict, Field, field_validator
from app.modules.lessons.schemas import LessonTitle

class CourseCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    description: str | None = Field(default=None, max_length=10000)

    model_config = ConfigDict(
        str_strip_whitespace=True,
        extra="forbid",
    )

class CourseUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = Field(default=None, max_length=10000)

    model_config = ConfigDict(
        str_strip_whitespace=True,
        extra="forbid",
    )

    @field_validator("title")
    @classmethod
    def reject_null_title(cls, value: str | None) -> str:
        """Reject an explicitly null title."""
        if value is None:
            raise ValueError("Title cannot be null")
        return value

class CourseRead(BaseModel):
    id: int
    owner_id: int
    title: str
    description: str | None

    model_config = ConfigDict(from_attributes=True)

class CourseProgressRead(BaseModel):
    course_id: int
    total_lessons: int
    completed_lessons: int
    completion_percent: float

class CourseGenerateRequest(BaseModel):
    prompt: str = Field(min_length=1, max_length=1000)

    model_config = ConfigDict(str_strip_whitespace=True, extra="forbid")


class CourseDraftLesson(BaseModel):
    title: LessonTitle
    content: str = Field(default="", max_length=50000)

    model_config = ConfigDict(extra="forbid")


class CourseDraftTopic(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    description: str | None = Field(default=None, max_length=10000)
    lessons: list[CourseDraftLesson] = Field(min_length=1, max_length=5)

    model_config = ConfigDict(str_strip_whitespace=True, extra="forbid")


class CourseDraft(CourseCreate):
    topics: list[CourseDraftTopic] = Field(min_length=1, max_length=5)


class GeneratedCourseLesson(CourseDraftLesson):
    content: str = Field(min_length=1, max_length=50000)

    model_config = ConfigDict(str_strip_whitespace=True)


class GeneratedCourseTopic(CourseDraftTopic):
    description: str = Field(min_length=1, max_length=10000)
    lessons: list[GeneratedCourseLesson] = Field(min_length=1, max_length=5)


class GeneratedCourseDraft(CourseDraft):
    description: str = Field(min_length=1, max_length=10000)
    topics: list[GeneratedCourseTopic] = Field(min_length=1, max_length=5)
