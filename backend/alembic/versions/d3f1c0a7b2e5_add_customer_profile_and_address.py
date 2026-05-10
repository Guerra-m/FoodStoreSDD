"""add_customer_profile_and_address

Revision ID: d3f1c0a7b2e5
Revises: 9adca8e58952
Create Date: 2026-05-10 10:20:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel


# revision identifiers, used by Alembic.
revision: str = 'd3f1c0a7b2e5'
down_revision: Union[str, None] = '9adca8e58952'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Agregar columnas de perfil a usuario
    op.add_column('usuario', sa.Column('foto_url', sqlmodel.sql.sqltypes.AutoString(), nullable=True))
    op.add_column('usuario', sa.Column('fecha_nacimiento', sa.Date(), nullable=True))

    # Crear tabla direccion
    op.create_table('direccion',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('usuario_id', sa.Integer(), nullable=False),
        sa.Column('calle', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column('numero', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column('ciudad', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column('provincia', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column('codigo_postal', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column('latitud', sa.Float(), nullable=True),
        sa.Column('longitud', sa.Float(), nullable=True),
        sa.Column('es_principal', sa.Boolean(), nullable=False),
        sa.Column('creado_en', sa.DateTime(), nullable=False),
        sa.Column('actualizado_en', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['usuario_id'], ['usuario.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_direccion_usuario_id'), 'direccion', ['usuario_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_direccion_usuario_id'), table_name='direccion')
    op.drop_table('direccion')
    op.drop_column('usuario', 'fecha_nacimiento')
    op.drop_column('usuario', 'foto_url')
