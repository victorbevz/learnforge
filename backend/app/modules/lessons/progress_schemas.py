from datetime import datetime

from pydantic import BaseModel

class LessonProgressRead(BaseModel):
    lesson_id: int
    is_completed: bool
    completed_at: datetime | None