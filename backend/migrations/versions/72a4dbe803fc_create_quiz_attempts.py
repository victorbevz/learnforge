"""Create quiz attempts.

Revision ID: 72a4dbe803fc
Revises: d09d1359c170
"""

import sqlalchemy as sa
from alembic import op


revision = "72a4dbe803fc"
down_revision = "d09d1359c170"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "quiz_attempts",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("lesson_id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("quiz_title", sa.String(200), nullable=False),
        sa.Column("total_questions", sa.Integer(), nullable=False),
        sa.Column("correct_answers", sa.Integer(), nullable=False),
        sa.Column("score_percent", sa.Float(), nullable=False),
        sa.Column("answers", sa.JSON(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["lesson_id"], ["lessons.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
    )
    op.create_index(
        "ix_quiz_attempts_lesson_user_id",
        "quiz_attempts",
        ["lesson_id", "user_id", "id"],
    )


def downgrade() -> None:
    op.drop_index("ix_quiz_attempts_lesson_user_id", table_name="quiz_attempts")
    op.drop_table("quiz_attempts")
