"""add accountant role

Revision ID: f8f03a464328
Revises: f8f03a464327
Create Date: 2026-06-10 10:15:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'f8f03a464328'
down_revision = 'f8f03a464327'
branch_labels = None
depends_on = None

def upgrade() -> None:
    # Add ACCOUNTANT to SystemRole enum if it doesn't exist
    with op.get_context().autocommit_block():
        op.execute("ALTER TYPE \"SystemRole\" ADD VALUE IF NOT EXISTS 'ACCOUNTANT'")

def downgrade() -> None:
    # PostgreSQL does not easily support removing values from an enum type
    pass
