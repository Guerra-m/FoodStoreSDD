"""
Repository para gestión de usuarios desde el panel admin.
Operaciones CRUD con soft delete y manejo de roles.
"""
from datetime import datetime
from typing import Optional, List, Tuple

from sqlmodel import Session, select, func

from app.modules.usuarios.model import Usuario, Role, UsuarioRole


class UserAdminRepository:
    """Repositorio para operaciones admin sobre usuarios."""

    def __init__(self, session: Session):
        self.session = session

    def list_users(
        self,
        page: int = 1,
        per_page: int = 20,
        search: Optional[str] = None,
        role: Optional[str] = None,
        include_deleted: bool = False,
    ) -> Tuple[List[Usuario], int]:
        """
        Lista usuarios con paginación y filtros opcionales.

        Args:
            page: Número de página (1-indexed).
            per_page: Items por página.
            search: Búsqueda por email (ILIKE).
            role: Filtrar por nombre de rol.
            include_deleted: Incluir usuarios con soft delete.

        Returns:
            (lista_usuarios, total)
        """
        offset = (page - 1) * per_page

        query = select(Usuario)
        count_query = select(func.count(Usuario.id))

        # Filtro de soft delete
        if not include_deleted:
            query = query.where(Usuario.eliminado_en.is_(None))
            count_query = count_query.where(Usuario.eliminado_en.is_(None))

        # Búsqueda por email
        if search:
            pattern = f"%{search}%"
            query = query.where(Usuario.email.ilike(pattern))
            count_query = count_query.where(Usuario.email.ilike(pattern))

        # Filtro por rol (busca usuarios que tengan ese rol)
        if role:
            subquery = (
                select(UsuarioRole.usuario_id)
                .join(Role)
                .where(Role.nombre == role)
            )
            query = query.where(Usuario.id.in_(subquery))
            count_query = count_query.where(Usuario.id.in_(subquery))

        query = query.order_by(Usuario.creado_en.desc()).offset(offset).limit(per_page)
        usuarios = self.session.exec(query).all()
        total = self.session.exec(count_query).first() or 0

        return list(usuarios), total

    def get_by_id(self, user_id: int) -> Optional[Usuario]:
        """Obtiene un usuario por ID con sus roles cargados."""
        stmt = select(Usuario).where(Usuario.id == user_id)
        return self.session.exec(stmt).first()

    def get_role_by_name(self, role_name: str) -> Optional[Role]:
        """Obtiene un rol por su nombre."""
        stmt = select(Role).where(Role.nombre == role_name)
        return self.session.exec(stmt).first()

    def get_all_roles(self) -> List[Role]:
        """Obtiene todos los roles del sistema."""
        stmt = select(Role)
        return list(self.session.exec(stmt).all())

    def update_roles(self, user_id: int, role_ids: List[int]) -> Usuario:
        """
        Reemplaza los roles de un usuario por la lista proporcionada.

        Primero elimina las asociaciones existentes, luego agrega las nuevas.
        Todo en una misma transacción.
        """
        # Eliminar roles actuales
        delete_stmt = select(UsuarioRole).where(UsuarioRole.usuario_id == user_id)
        existing = self.session.exec(delete_stmt).all()
        for rel in existing:
            self.session.delete(rel)

        # Agregar nuevos roles
        for role_id in role_ids:
            self.session.add(UsuarioRole(usuario_id=user_id, role_id=role_id))

        self.session.commit()

        # Retornar usuario con roles actualizados
        stmt = select(Usuario).where(Usuario.id == user_id)
        return self.session.exec(stmt).first()

    def soft_delete(self, user_id: int) -> Optional[Usuario]:
        """Marca un usuario como eliminado (soft delete)."""
        usuario = self.session.get(Usuario, user_id)
        if not usuario:
            return None
        if usuario.eliminado_en is not None:
            return None  # Ya eliminado

        usuario.eliminado_en = datetime.utcnow()
        self.session.add(usuario)
        self.session.flush()
        return usuario

    def restore(self, user_id: int) -> Optional[Usuario]:
        """ restaura un usuario con soft delete."""
        usuario = self.session.get(Usuario, user_id)
        if not usuario:
            return None
        if usuario.eliminado_en is None:
            return None  # No estaba eliminado

        usuario.eliminado_en = None
        self.session.add(usuario)
        self.session.flush()
        return usuario
