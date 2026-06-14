"""manual_encrypted_payroll

Revision ID: 999999999999
Revises: f8f03a464327
Create Date: 2026-06-07 15:57:19.988215

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '999999999999'
down_revision: Union[str, Sequence[str], None] = 'f8f03a464329'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Drop old tables safely
    op.execute('DROP TABLE IF EXISTS payslips CASCADE')
    op.execute('DROP TABLE IF EXISTS salary_structures CASCADE')

    # 2. Create payroll_runs
    op.create_table('payroll_runs',
    sa.Column('id', sa.String(), nullable=False),
    sa.Column('employee_id', sa.String(), nullable=False),
    sa.Column('payroll_month', sa.Integer(), nullable=False),
    sa.Column('payroll_year', sa.Integer(), nullable=False),
    sa.Column('gross_salary', sa.String(), nullable=True),
    sa.Column('net_salary', sa.String(), nullable=True),
    sa.Column('total_earnings', sa.String(), nullable=True),
    sa.Column('total_deductions', sa.String(), nullable=True),
    sa.Column('remarks', sa.Text(), nullable=True),
    sa.Column('status', sa.String(), nullable=False),
    sa.Column('created_by', sa.String(), nullable=True),
    sa.Column('approved_by', sa.String(), nullable=True),
    sa.Column('approved_at', sa.DateTime(timezone=True), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
    sa.ForeignKeyConstraint(['approved_by'], ['users.id'], ),
    sa.ForeignKeyConstraint(['created_by'], ['users.id'], ),
    sa.ForeignKeyConstraint(['employee_id'], ['users.id'], ),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('employee_id', 'payroll_month', 'payroll_year', name='uq_payroll_run_emp_period')
    )

    # 3. Create payroll_components
    op.create_table('payroll_components',
    sa.Column('id', sa.String(), nullable=False),
    sa.Column('payroll_run_id', sa.String(), nullable=False),
    sa.Column('component_name', sa.String(), nullable=False),
    sa.Column('component_type', sa.String(), nullable=False),
    sa.Column('amount', sa.String(), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    sa.ForeignKeyConstraint(['payroll_run_id'], ['payroll_runs.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )

    # 4. Create new payslips
    op.create_table('payslips',
    sa.Column('id', sa.String(), nullable=False),
    sa.Column('payroll_run_id', sa.String(), nullable=False),
    sa.Column('pdf_path', sa.String(), nullable=True),
    sa.Column('generated_at', sa.DateTime(timezone=True), nullable=False),
    sa.Column('downloaded_count', sa.Integer(), nullable=False),
    sa.ForeignKeyConstraint(['payroll_run_id'], ['payroll_runs.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('payroll_run_id')
    )

    # 5. Create payroll_approval_history
    op.create_table('payroll_approval_history',
    sa.Column('id', sa.String(), nullable=False),
    sa.Column('payroll_run_id', sa.String(), nullable=False),
    sa.Column('action', sa.String(), nullable=False),
    sa.Column('remarks', sa.Text(), nullable=True),
    sa.Column('performed_by', sa.String(), nullable=False),
    sa.Column('performed_at', sa.DateTime(timezone=True), nullable=False),
    sa.ForeignKeyConstraint(['payroll_run_id'], ['payroll_runs.id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['performed_by'], ['users.id'], ),
    sa.PrimaryKeyConstraint('id')
    )


def downgrade() -> None:
    op.drop_table('payroll_approval_history')
    op.drop_table('payslips')
    op.drop_table('payroll_components')
    op.drop_table('payroll_runs')
