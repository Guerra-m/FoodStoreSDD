"""add_auth_and_rbac_models

Revision ID: 001
Revises: 
Create Date: 2026-05-08

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import TIMESTAMP


# revision identifiers, used by Alembic.
revision: str = "001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Tabla de usuarios (creada desde el scaffold inicial)
    op.create_table(
        "usuario",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("nombre", sa.String(), nullable=False),
        sa.Column("email", sa.String(), nullable=False),
        sa.Column("password_hash", sa.String(), nullable=False),
        sa.Column("telefono", sa.String(), nullable=True),
        sa.Column("creado_en", TIMESTAMP(timezone=False), nullable=False),
        sa.Column("actualizado_en", TIMESTAMP(timezone=False), nullable=False),
        sa.Column("eliminado_en", TIMESTAMP(timezone=False), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_usuario_email"), "usuario", ["email"], unique=True)

    # Tabla de roles del sistema
    op.create_table(
        "role",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("nombre", sa.String(), nullable=False),
        sa.Column("descripcion", sa.String(), nullable=True),
        sa.Column("creado_en", TIMESTAMP(timezone=False), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_role_nombre"), "role", ["nombre"], unique=True)

    # Tabla de refresh tokens
    op.create_table(
        "refresh_token",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("token_hash", sa.String(), nullable=False),
        sa.Column("usuario_id", sa.Integer(), nullable=False),
        sa.Column("expires_at", TIMESTAMP(timezone=False), nullable=False),
        sa.Column("revocado_en", TIMESTAMP(timezone=False), nullable=True),
        sa.Column("creado_en", TIMESTAMP(timezone=False), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(
            ["usuario_id"],
            ["usuario.id"],
            name="fk_refresh_token_usuario_id",
        ),
    )
    op.create_index(
        op.f("ix_refresh_token_token_hash"),
        "refresh_token",
        ["token_hash"],
        unique=True,
    )

    # Tabla asociativa usuarios_roles
    op.create_table(
        "usuarios_roles",
        sa.Column("usuario_id", sa.Integer(), nullable=False),
        sa.Column("role_id", sa.Integer(), nullable=False),
        sa.PrimaryKeyConstraint("usuario_id", "role_id"),
        sa.ForeignKeyConstraint(
            ["usuario_id"],
            ["usuario.id"],
            name="fk_usuarios_roles_usuario_id",
        ),
        sa.ForeignKeyConstraint(
            ["role_id"],
            ["role.id"],
            name="fk_usuarios_roles_role_id",
        ),
    )


def downgrade() -> None:
    op.drop_table("usuarios_roles")
    op.drop_index(op.f("ix_refresh_token_token_hash"), table_name="refresh_token")
    op.drop_table("refresh_token")
    op.drop_index(op.f("ix_role_nombre"), table_name="role")
    op.drop_table("role")
