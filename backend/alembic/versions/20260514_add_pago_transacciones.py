"""add_pago_transacciones

Revision ID: 20260514_add_pago_transacciones
Revises: 20260513_add_pedidos
Create Date: 2026-05-14 00:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel


# revision identifiers, used by Alembic.
revision: str = '20260514_add_pago_transacciones'
down_revision: Union[str, None] = '20260513_add_pedidos'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Crear tabla pago_transacciones
    op.create_table('pago_transacciones',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('pedido_id', sa.Integer(), nullable=False),
        sa.Column('mercadopago_payment_id', sa.Integer(), nullable=True),
        sa.Column('mercadopago_preference_id', sqlmodel.sql.sqltypes.AutoString(), nullable=True),
        sa.Column('estado', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column('tipo_evento', sqlmodel.sql.sqltypes.AutoString(), nullable=True),
        sa.Column('metadata', sqlmodel.sql.sqltypes.JSON(), nullable=False),
        sa.Column('idempotency_key', sqlmodel.sql.sqltypes.AutoString(), nullable=True),
        sa.Column('creado_en', sa.DateTime(), nullable=False),
        sa.Column('actualizado_en', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['pedido_id'], ['pedido.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('idempotency_key', name='uq_pago_transacciones_idempotency')
    )
    op.create_index(op.f('ix_pago_transacciones_pedido_id'), 'pago_transacciones', ['pedido_id'], unique=False)
    op.create_index(op.f('ix_pago_transacciones_mercadopago_payment_id'), 'pago_transacciones', ['mercadopago_payment_id'], unique=False)
    op.create_index(op.f('ix_pago_transacciones_estado'), 'pago_transacciones', ['estado'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_pago_transacciones_estado'), table_name='pago_transacciones')
    op.drop_index(op.f('ix_pago_transacciones_mercadopago_payment_id'), table_name='pago_transacciones')
    op.drop_index(op.f('ix_pago_transacciones_pedido_id'), table_name='pago_transacciones')
    op.drop_table('pago_transacciones')
