from pydantic import BaseModel, ConfigDict, Field, field_validator

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