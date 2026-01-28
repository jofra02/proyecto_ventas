"""add manufacture_date to batches

Revision ID: d38a423a598a
Revises: 58b9918a9b04
Create Date: 2026-01-27 19:19:28.916579

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd38a423a598a'
down_revision: Union[str, Sequence[str], None] = '58b9918a9b04'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('batches', sa.Column('manufacture_date', sa.DateTime(), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('batches', 'manufacture_date')
