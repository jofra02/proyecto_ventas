"""add_product_measurement_sizing

Revision ID: 58b9918a9b04
Revises: cd5fee14e6a9
Create Date: 2026-01-27 00:10:41.287670

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '58b9918a9b04'
down_revision: Union[str, Sequence[str], None] = 'cd5fee14e6a9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    with op.batch_alter_table('products') as batch_op:
        batch_op.add_column(sa.Column('measurement_value', sa.Float(), nullable=True))
        batch_op.add_column(sa.Column('measurement_unit', sa.String(), nullable=True))

def downgrade() -> None:
    """Downgrade schema."""
    with op.batch_alter_table('products') as batch_op:
        batch_op.drop_column('measurement_unit')
        batch_op.drop_column('measurement_value')
