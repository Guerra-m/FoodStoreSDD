"""
Service para gestión admin de usuarios.
Orquesta operaciones CRUD con validaciones de negocio.
"""
from typing import Optional, Tuple

from sqlmodel import Session

from app.admin.schemas import (
    UserAdminResponse,
    UserAdminListResponse,
    UpdateRolesRequest,
)
from app.admin.repositories.user_repo import UserAdminRepository


class UserAdminService:
    """Servicio para gestión admin de usuarios."""

    def __init__(self, session: Session):
        self.repo = UserAdminRepository(session)

    def list_users(
        self,
        page: int = 1,
        per_page: int = 20,
        search: Optional[str] = None,
        role: Optional[str] = None,
        include_deleted: bool = False,
    ) -> UserAdminListResponse:
        """Lista usuarios con filtros y paginación."""
        usuarios, total = self.repo.list_users(
            page=page,
            per_page=per_page,
            search=search,
            role=role,
            include_deleted=include_deleted,
        )

        users = [
            UserAdminResponse(
                id=u.id,
                nombre=u.nombre,
                email=u.email,
                telefono=u.telefono,
                roles=[r.nombre for r in u.roles],
                creado_en=u.creado_en,
                eliminado_en=u.eliminado_en,
            )
            for u in usuarios
        ]

        return UserAdminListResponse(
            users=users,
            total=total,
            page=page,
            per_page=per_page,
        )

    def get_user_by_id(self, user_id: int) -> Tuple[Optional[UserAdminResponse], Optional[str], Optional[int]]:
        """
        Obtiene detalle de un usuario por ID.

        Returns:
            (UserAdminResponse, None, None) si existe
            (None, error_msg, status_code) si no
        """
        usuario = self.repo.get_by_id(user_id)
        if not usuario:
            return None, "Usuario no encontrado", 404

        return UserAdminResponse(
            id=usuario.id,
            nombre=usuario.nombre,
            email=usuario.email,
            telefono=usuario.telefono,
            roles=[r.nombre for r in usuario.roles],
            creado_en=usuario.creado_en,
            eliminado_en=usuario.eliminado_en,
        ), None, None

    def update_roles(
        self, user_id: int, roles_data: UpdateRolesRequest
    ) -> Tuple[Optional[UserAdminResponse], Optional[str], Optional[int]]:
        """
        Actualiza los roles de un usuario.

        Returns:
            (UserAdminResponse, None, None) si exitoso
            (None, error_msg, status_code) si falla
        """
        # Verificar que el usuario existe
        usuario = self.repo.get_by_id(user_id)
        if not usuario:
            return None, "Usuario no encontrado", 404

        # Validar que todos los roles existan
        all_roles = self.repo.get_all_roles()
        role_names = {r.nombre for r in all_roles}
        for role_name in roles_data.roles:
            if role_name not in role_names:
                return None, f"Rol inválido: '{role_name}'", 422

        # Obtener IDs de los roles
        role_map = {r.nombre: r.id for r in all_roles}
        role_ids = [role_map[name] for name in roles_data.roles]

        # Actualizar roles
        usuario_actualizado = self.repo.update_roles(user_id, role_ids)

        return UserAdminResponse(
            id=usuario_actualizado.id,
            nombre=usuario_actualizado.nombre,
            email=usuario_actualizado.email,
            telefono=usuario_actualizado.telefono,
            roles=[r.nombre for r in usuario_actualizado.roles],
            creado_en=usuario_actualizado.creado_en,
            eliminado_en=usuario_actualizado.eliminado_en,
        ), None, None

    def soft_delete_user(self, user_id: int) -> Tuple[Optional[UserAdminResponse], Optional[str], Optional[int]]:
        """Realiza soft delete de un usuario."""
        usuario = self.repo.get_by_id(user_id)
        if not usuario:
            return None, "Usuario no encontrado", 404

        if usuario.eliminado_en is not None:
            return None, "El usuario ya se encuentra eliminado", 409

        usuario_eliminado = self.repo.soft_delete(user_id)
        if not usuario_eliminado:
            return None, "Error al eliminar el usuario", 500

        return UserAdminResponse(
            id=usuario_eliminado.id,
            nombre=usuario_eliminado.nombre,
            email=usuario_eliminado.email,
            telefono=usuario_eliminado.telefono,
            roles=[r.nombre for r in usuario_eliminado.roles],
            creado_en=usuario_eliminado.creado_en,
            eliminado_en=usuario_eliminado.eliminado_en,
        ), None, None

    def restore_user(self, user_id: int) -> Tuple[Optional[UserAdminResponse], Optional[str], Optional[int]]:
        """ restaura un usuario eliminado."""
        usuario = self.repo.get_by_id(user_id)
        if not usuario:
            return None, "Usuario no encontrado", 404

        if usuario.eliminado_en is None:
            return None, "El usuario no está eliminado", 400

        usuario_restaurado = self.repo.restore(user_id)
        if not usuario_restaurado:
            return None, "Error al restaurar el usuario", 500

        return UserAdminResponse(
            id=usuario_restaurado.id,
            nombre=usuario_restaurado.nombre,
            email=usuario_restaurado.email,
            telefono=usuario_restaurado.telefono,
            roles=[r.nombre for r in usuario_restaurado.roles],
            creado_en=usuario_restaurado.creado_en,
            eliminado_en=usuario_restaurado.eliminado_en,
        ), None, None
