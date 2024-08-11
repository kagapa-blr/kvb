"""Force merge of heads

Revision ID: cd8160f11b27
Revises: b7ab2718871e, 0d3ecaaad8df
Create Date: 2024-08-09 20:49:01.932153

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'cd8160f11b27'
down_revision = ('b7ab2718871e', '0d3ecaaad8df')
branch_labels = None
depends_on = None


def upgrade():
    pass


def downgrade():
    pass
