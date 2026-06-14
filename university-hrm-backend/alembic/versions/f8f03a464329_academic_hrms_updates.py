"""academic hrms updates

Revision ID: f8f03a464329
Revises: f8f03a464328
Create Date: 2026-06-10 10:28:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'f8f03a464329'
down_revision = 'f8f03a464328'
branch_labels = None
depends_on = None

def upgrade() -> None:
    # 1. Add SABBATICAL and EXAM_DUTY to LeaveType enum
    with op.get_context().autocommit_block():
        op.execute("ALTER TYPE \"LeaveType\" ADD VALUE IF NOT EXISTS 'SABBATICAL'")
        op.execute("ALTER TYPE \"LeaveType\" ADD VALUE IF NOT EXISTS 'EXAM_DUTY'")

    # 2. Add staff_category to users table
    op.add_column('users', sa.Column('staff_category', sa.String(), nullable=True))


def downgrade() -> None:
    op.drop_column('users', 'staff_category')
    # Note: PostgreSQL does not support dropping ENUM values easily, so we leave LeaveType alone on downgrade.
