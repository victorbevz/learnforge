from sqlalchemy import CheckConstraint, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base

class Topic(Base):
    __tablename__ = "topics"
    __table_args__ = (
        CheckConstraint("position >= 0", name = "ck_topics_position"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    course_id: Mapped[int] = mapped_column(
        ForeignKey("courses.id", ondelete="CASCADE"),
        index=True,
    )
    title: Mapped[str] = mapped_column(String(200))
    position: Mapped[int] = mapped_column(default=0)