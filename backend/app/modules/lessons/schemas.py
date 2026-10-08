from typing import Annotated

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
    StringConstraints,
    field_validator,
)


LessonTitle = Annotated[
    str,
    StringConstraints(
        strip_whitespace=True,
        min_length=1,
        max_length=200,
    ),
]


class LessonCreate(BaseModel):
    title: LessonTitle
    content: str = Field(default="", max_length=50000)
    position: int = Field(default=0, ge=0, le=2147483647, strict=True)

    model_config = ConfigDict(extra="forbid")


class LessonUpdate(BaseModel):
    title: LessonTitle | None = None
    content: str | None = Field(default=None, max_length=50000)
    position: int | None = Field(
        default=None,
        ge=0,
        le=2147483647,
        strict=True,
    )

    model_config = ConfigDict(extra="forbid")

    @field_validator("title", "content", "position")
    @classmethod
    def reject_null(cls, value: str | int | None) -> str | int:
        """Reject explicitly null values for required lesson fields."""
        if value is None:
            raise ValueError("Field cannot be null")
        return value


class LessonRead(BaseModel):
    id: int
    topic_id: int
    title: str
    content: str
    position: int

    model_config = ConfigDict(from_attributes=True)