from datetime import datetime, timezone
from typing import Optional

from fastapi import HTTPException, status

from app.core.unit_of_work import UnitOfWork
from app.modules.usuarios.model import Usuario
from app.modules.usuarios.repository import UsuarioRepository
from app.modules.usuarios.schema import ClientePerfilUpdate


class ClienteService:
    """Servicio de gestión de perfil del cliente."""

    async def actualizar_perfil(self, usuario_id: int, data: ClientePerfilUpdate) -> dict:
        """Actualiza los datos del perfil del cliente. No permite cambiar email."""
        with UnitOfWork() as uow:
            repo = UsuarioRepository(uow.session)
            usuario = repo.get_with_roles(usuario_id)
            if not usuario:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Usuario no encontrado",
                )

            update_data = data.model_dump(exclude_unset=True)
            # El email nunca se modifica desde perfil
            update_data.pop("email", None)

            if not update_data:
                # Si solo enviaron email (u otros campos ignorados), devolver perfil actual
                roles = [r.nombre for r in usuario.roles] if usuario.roles else []
                return {
                    "id": usuario.id,
                    "nombre": usuario.nombre,
                    "email": usuario.email,
                    "telefono": usuario.telefono,
                    "foto_url": usuario.foto_url,
                    "fecha_nacimiento": usuario.fecha_nacimiento,
                    "roles": roles,
                    "creado_en": usuario.creado_en,
                    "actualizado_en": usuario.actualizado_en,
                }

            for key, value in update_data.items():
                setattr(usuario, key, value)

            usuario.actualizado_en = datetime.now(timezone.utc)
            uow.session.add(usuario)
            uow.session.flush()

            # Capturar datos ANTES de que se cierre la sesión
            roles = [r.nombre for r in usuario.roles] if usuario.roles else []
            result = {
                "id": usuario.id,
                "nombre": usuario.nombre,
                "email": usuario.email,
                "telefono": usuario.telefono,
                "foto_url": usuario.foto_url,
                "fecha_nacimiento": usuario.fecha_nacimiento,
                "roles": roles,
                "creado_en": usuario.creado_en,
                "actualizado_en": usuario.actualizado_en,
            }

        return result
