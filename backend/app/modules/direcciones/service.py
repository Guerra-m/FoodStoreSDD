from typing import List, Optional

from fastapi import HTTPException, status

from app.core.unit_of_work import UnitOfWork
from app.modules.direcciones.model import Direccion
from app.modules.direcciones.repository import DireccionRepository


class DireccionService:
    """Servicio de gestión de direcciones del cliente."""

    async def create(self, usuario_id: int, data: dict) -> dict:
        """Crea una nueva dirección para el usuario."""
        with UnitOfWork() as uow:
            repo = DireccionRepository(uow.session)
            total = repo.count_by_usuario(usuario_id)
            es_principal = data.get("es_principal", total == 0)

            direccion = Direccion(
                usuario_id=usuario_id,
                calle=data["calle"],
                numero=data["numero"],
                ciudad=data["ciudad"],
                provincia=data["provincia"],
                codigo_postal=data["codigo_postal"],
                latitud=data.get("latitud"),
                longitud=data.get("longitud"),
                es_principal=es_principal,
            )

            # Si es principal, desmarcar las demás
            created = repo.create(direccion)
            if es_principal and total > 0:
                repo.set_principal(created.id, usuario_id)
                repo.session.refresh(created)

            return self._to_dict(created)

    async def list_by_usuario(self, usuario_id: int) -> List[dict]:
        """Lista todas las direcciones del usuario."""
        with UnitOfWork() as uow:
            repo = DireccionRepository(uow.session)
            direcciones = repo.list_by_usuario(usuario_id)
            return [self._to_dict(d) for d in direcciones]

    async def update(self, direccion_id: int, usuario_id: int, data: dict) -> dict:
        """Actualiza una dirección verificando que pertenezca al usuario."""
        with UnitOfWork() as uow:
            repo = DireccionRepository(uow.session)
            direccion = repo.get_by_id(direccion_id)

            if not direccion or direccion.usuario_id != usuario_id:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Dirección no encontrada",
                )

            campos = {"calle", "numero", "ciudad", "provincia", "codigo_postal", "latitud", "longitud"}
            for key, value in data.items():
                if key in campos:
                    setattr(direccion, key, value)

            updated = repo.update(direccion)
            return self._to_dict(updated)

    async def delete(self, direccion_id: int, usuario_id: int) -> None:
        """Elimina una dirección. No permite eliminar la única dirección principal."""
        with UnitOfWork() as uow:
            repo = DireccionRepository(uow.session)
            direccion = repo.get_by_id(direccion_id)

            if not direccion or direccion.usuario_id != usuario_id:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Dirección no encontrada",
                )

            total = repo.count_by_usuario(usuario_id)

            if direccion.es_principal and total > 1:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="No se puede eliminar la dirección principal. Establece otra como principal primero.",
                )

            if direccion.es_principal and total == 1:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="No se puede eliminar la única dirección. Debes tener al menos una dirección registrada.",
                )

            repo.delete(direccion)

    async def set_principal(self, direccion_id: int, usuario_id: int) -> dict:
        """Marca una dirección como principal."""
        with UnitOfWork() as uow:
            repo = DireccionRepository(uow.session)
            direccion = repo.get_by_id(direccion_id)

            if not direccion or direccion.usuario_id != usuario_id:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Dirección no encontrada",
                )

            updated = repo.set_principal(direccion_id, usuario_id)
            return self._to_dict(updated)

    def _to_dict(self, direccion: Direccion) -> dict:
        """Convierte una dirección a dict para respuesta."""
        return {
            "id": direccion.id,
            "usuario_id": direccion.usuario_id,
            "calle": direccion.calle,
            "numero": direccion.numero,
            "ciudad": direccion.ciudad,
            "provincia": direccion.provincia,
            "codigo_postal": direccion.codigo_postal,
            "latitud": direccion.latitud,
            "longitud": direccion.longitud,
            "es_principal": direccion.es_principal,
            "creado_en": direccion.creado_en.isoformat(),
            "actualizado_en": direccion.actualizado_en.isoformat(),
        }
