"""Merge multiple heads

Revision ID: cddf4e7ebe6b
Revises: 029473ed8fe2, 95301fb86c03, bf939e9185eb, cd8160f11b27
Create Date: 2024-08-09 20:50:22.394030

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'cddf4e7ebe6b'
down_revision = ('029473ed8fe2', '95301fb86c03', 'bf939e9185eb', 'cd8160f11b27')
branch_labels = None
depends_on = None


def upgrade():
    pass


def downgrade():
    pass
