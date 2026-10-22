from typing import Annotated

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
    StringConstraints,
    model_validator,
)
from typing_extensions import Self


QuizTitle = Annotated[
    str,
    StringConstraints(
        strip_whitespace=True,
        min_length=1,
        max_length=200,
    ),
]

QuestionText = Annotated[
    str,
    StringConstraints(
        strip_whitespace=True,
        min_length=1,
        max_length=5000,
    ),
]

OptionText = Annotated[
    str,
    StringConstraints(
        strip_whitespace=True,
        min_length=1,
        max_length=1000,
    ),
]


class QuizOptionCreate(BaseModel):
    text: OptionText
    is_correct: bool = Field(default=False, strict=True)

    model_config = ConfigDict(extra="forbid")


class QuizQuestionCreate(BaseModel):
    text: QuestionText
    options: list[QuizOptionCreate] = Field(
        min_length=2,
        max_length=6,
    )

    model_config = ConfigDict(extra="forbid")

    @model_validator(mode="after")
    def validate_correct_answer(self) -> Self:
        """Require exactly one correct option per question."""
        correct_count = sum(
            option.is_correct for option in self.options
        )

        if correct_count != 1:
            raise ValueError(
                "Each question must have exactly one correct answer"
            )

        return self


class QuizCreate(BaseModel):
    title: QuizTitle
    questions: list[QuizQuestionCreate] = Field(
        min_length=1,
        max_length=50,
    )

    model_config = ConfigDict(extra="forbid")


class QuizOptionRead(BaseModel):
    id: int
    text: str
    position: int

    model_config = ConfigDict(from_attributes=True)


class QuizQuestionRead(BaseModel):
    id: int
    text: str
    position: int
    options: list[QuizOptionRead]


class QuizRead(BaseModel):
    id: int
    lesson_id: int
    title: str
    questions: list[QuizQuestionRead]