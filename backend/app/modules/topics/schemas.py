from pydantic import BaseModel, ConfigDict, Field, field_validator


class TopicCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    position: int = Field(default=0, ge=0, le=2147483647, strict=True)

    model_config = ConfigDict(
        str_strip_whitespace=True,
        extra="forbid",
    )

class TopicUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=200)
    position: int | None = Field(
        default=None,
        ge=0,
        le=2147483647,
        strict=True,
    )

    model_config = ConfigDict(
        str_strip_whitespace=True,
        extra="forbid",
    )
    @field_validator("title", "position")
    @classmethod
    def reject_null(cls, value: str | int | None) -> str | int:
        """Reject explicitly null values for required topic fields."""
        if value is None:
            raise ValueError("Field cannot be null")
        return value


class TopicRead(BaseModel):
    id: int
    course_id: int
    title: str
    position: int

    model_config = ConfigDict(from_attributes=True)