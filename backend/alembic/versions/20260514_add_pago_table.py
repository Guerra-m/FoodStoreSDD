"""add_pago_table

Revision ID: 20260514_add_pago_table
Revises: 20260513_add_pedidos
Create Date: 2026-05-14 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel


# revision identifiers, used by Alembic.
revision: str = '20260514_add_pago_table'
down_revision: Union[str, None] = '20260513_add_pedidos'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Crear tabla pago
    op.create_table('pago',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('pedido_id', sa.Integer(), nullable=False),
        sa.Column('mp_payment_id', sa.Integer(), nullable=True),
        sa.Column('mp_status', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column('status_detail', sqlmodel.sql.sqltypes.AutoString(), nullable=True),
        sa.Column('idempotency_key', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column('external_reference', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['pedido_id'], ['pedido.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('mp_payment_id'),
        sa.UniqueConstraint('idempotency_key'),
    )
    op.create_index(op.f('ix_pago_pedido_id'), 'pago', ['pedido_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_pago_pedido_id'), table_name='pago')
    op.drop_table('pago')
