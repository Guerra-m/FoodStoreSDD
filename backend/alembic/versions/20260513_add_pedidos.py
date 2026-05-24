"""add_pedidos

Revision ID: 20260513_add_pedidos
Revises: d3f1c0a7b2e5
Create Date: 2026-05-13 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel


# revision identifiers, used by Alembic.
revision: str = '20260513_add_pedidos'
down_revision: Union[str, None] = 'd3f1c0a7b2e5'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Crear tabla pedido
    op.create_table('pedido',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('cliente_id', sa.Integer(), nullable=False),
        sa.Column('direccion_id', sa.Integer(), nullable=False),
        sa.Column('direccion_snapshot', sa.JSON(), nullable=False),
        sa.Column('total', sa.Integer(), nullable=False),
        sa.Column('estado', sa.String(), nullable=False),
        sa.Column('creado_en', sa.DateTime(), nullable=False),
        sa.Column('actualizado_en', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['cliente_id'], ['usuario.id'], ),
        sa.ForeignKeyConstraint(['direccion_id'], ['direccion.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_pedido_cliente_id'), 'pedido', ['cliente_id'], unique=False)

    # Crear tabla pedido_item
    op.create_table('pedido_item',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('pedido_id', sa.Integer(), nullable=False),
        sa.Column('producto_id', sa.Integer(), nullable=False),
        sa.Column('producto_snapshot', sa.JSON(), nullable=False),
        sa.Column('cantidad', sa.Integer(), nullable=False),
        sa.Column('precio_unitario', sa.Integer(), nullable=False),
        sa.Column('ingredientes_excluidos', sa.JSON(), nullable=False),
        sa.ForeignKeyConstraint(['pedido_id'], ['pedido.id'], ),
        sa.ForeignKeyConstraint(['producto_id'], ['producto.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_pedido_item_pedido_id'), 'pedido_item', ['pedido_id'], unique=False)
    op.create_index(op.f('ix_pedido_item_producto_id'), 'pedido_item', ['producto_id'], unique=False)

    # Crear tabla pedido_historial
    op.create_table('pedido_historial',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('pedido_id', sa.Integer(), nullable=False),
        sa.Column('estado', sa.String(), nullable=False),
        sa.Column('timestamp', sa.DateTime(), nullable=False),
        sa.Column('usuario_id', sa.Integer(), nullable=True),
        sa.Column('descripcion', sa.String(), nullable=False),
        sa.ForeignKeyConstraint(['pedido_id'], ['pedido.id'], ),
        sa.ForeignKeyConstraint(['usuario_id'], ['usuario.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_pedido_historial_pedido_id'), 'pedido_historial', ['pedido_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_pedido_historial_pedido_id'), table_name='pedido_historial')
    op.drop_table('pedido_historial')
    op.drop_index(op.f('ix_pedido_item_producto_id'), table_name='pedido_item')
    op.drop_index(op.f('ix_pedido_item_pedido_id'), table_name='pedido_item')
    op.drop_table('pedido_item')
    op.drop_index(op.f('ix_pedido_cliente_id'), table_name='pedido')
    op.drop_table('pedido')