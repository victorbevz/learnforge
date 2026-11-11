"""Add an optional topic description."""

import sqlalchemy as sa
from alembic import op


revision = "6b478fae91c2"
down_revision = "72a4dbe803fc"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("topics", sa.Column("description", sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column("topics", "description")
