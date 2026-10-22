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


class QuizAnswerSubmit(BaseModel):
    question_id: int = Field(
        gt=0,
        le=2147483647,
        strict=True,
    )
    option_id: int = Field(
        gt=0,
        le=2147483647,
        strict=True,
    )

    model_config = ConfigDict(extra="forbid")


class QuizSubmit(BaseModel):
    answers: list[QuizAnswerSubmit] = Field(
        min_length=1,
        max_length=50,
    )

    model_config = ConfigDict(extra="forbid")

    @model_validator(mode="after")
    def validate_unique_questions(self) -> Self:
        """Reject multiple answers for the same question."""
        question_ids = [
            answer.question_id for answer in self.answers
        ]

        if len(question_ids) != len(set(question_ids)):
            raise ValueError(
                "Each question must have exactly one submitted answer"
            )

        return self


class QuizAnswerResult(BaseModel):
    question_id: int
    selected_option_id: int
    correct_option_id: int
    is_correct: bool


class QuizResult(BaseModel):
    quiz_id: int
    total_questions: int
    correct_answers: int
    score_percent: float
    results: list[QuizAnswerResult]