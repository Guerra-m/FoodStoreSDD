from datetime import datetime, timezone
from typing import Optional, List

from fastapi import HTTPException, status
from sqlmodel import select

from app.core.unit_of_work import UnitOfWork
from app.modules.categorias.model import Categoria
from app.modules.categorias.schema import (
    CategoriaCreate,
    CategoriaUpdate,
    CategoriaResponse,
    CategoriaTreeResponse,
)
from app.modules.categorias.repository import CategoriaRepository


class CategoriaService:
    """Servicio de gestión de categorías con validaciones de negocio."""

    async def create(self, data: CategoriaCreate) -> CategoriaResponse:
        """Crea una nueva categoría con validaciones."""
        with UnitOfWork() as uow:
            repo = CategoriaRepository(uow.session)

            # Validar nombre duplicado en el mismo nivel
            existing = repo.get_by_name_and_parent(data.nombre, data.padre_id)
            if existing:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=f"Ya existe una categoría con el nombre '{data.nombre}' en este nivel",
                )

            # Asignar posición automáticamente si no se proporciona
            posicion = data.posicion
            if posicion is None:
                max_pos = repo.get_max_position(data.padre_id)
                posicion = max_pos + 1

            categoria = Categoria(
                nombre=data.nombre,
                padre_id=data.padre_id,
                posicion=posicion,
            )
            created = repo.create(categoria)
            
            # Extraer datos antes de cerrar la sesión
            result = CategoriaResponse(
                id=created.id,
                nombre=created.nombre,
                padre_id=created.padre_id,
                posicion=created.posicion,
                creado_en=created.creado_en,
                actualizado_en=created.actualizado_en,
            )

        return result

    async def get_by_id(self, categoria_id: int) -> CategoriaResponse:
        """Obtiene una categoría por ID."""
        with UnitOfWork() as uow:
            repo = CategoriaRepository(uow.session)
            categoria = repo.get_by_id(categoria_id)
            if not categoria:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Categoría no encontrada",
                )

            return CategoriaResponse(
                id=categoria.id,
                nombre=categoria.nombre,
                padre_id=categoria.padre_id,
                posicion=categoria.posicion,
                creado_en=categoria.creado_en,
                actualizado_en=categoria.actualizado_en,
            )

    async def get_all(self, padre_id: Optional[int] = None) -> List[CategoriaResponse]:
        """Lista categorías, opcionalmente filtradas por padre."""
        with UnitOfWork() as uow:
            repo = CategoriaRepository(uow.session)
            if padre_id is not None:
                categorias = repo.get_by_parent(padre_id)
            else:
                # Si no se especifica padre, devolver solo raíces
                categorias = repo.get_all_root()

            return [
                CategoriaResponse(
                    id=c.id,
                    nombre=c.nombre,
                    padre_id=c.padre_id,
                    posicion=c.posicion,
                    creado_en=c.creado_en,
                    actualizado_en=c.actualizado_en,
                )
                for c in categorias
            ]

    async def get_tree(self) -> List[CategoriaTreeResponse]:
        """Obtiene el árbol completo de categorías."""
        with UnitOfWork() as uow:
            repo = CategoriaRepository(uow.session)
            # Obtener todas las categorías activas
            todas = repo.get_all()
            # Construir índice por ID
            index = {c.id: c for c in todas}
            # Construir árbol desde las raíces
            resultado = []

            for cat in todas:
                if cat.padre_id is None:
                    resultado.append(self._build_tree(cat, index))

            return resultado

    def _build_tree(
        self, categoria: Categoria, index: dict
    ) -> CategoriaTreeResponse:
        """Construye recursivamente el árbol de categorías."""
        hijos = []
        # Buscar hijos en el índice
        for cat in index.values():
            if cat.padre_id == categoria.id:
                hijos.append(self._build_tree(cat, index))

        return CategoriaTreeResponse(
            id=categoria.id,
            nombre=categoria.nombre,
            padre_id=categoria.padre_id,
            posicion=categoria.posicion,
            hijos=hijos,
        )

    async def update(self, categoria_id: int, data: CategoriaUpdate) -> CategoriaResponse:
        """Actualiza una categoría con validaciones."""
        with UnitOfWork() as uow:
            repo = CategoriaRepository(uow.session)
            categoria = repo.get_by_id(categoria_id)
            if not categoria:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Categoría no encontrada",
                )

            # Validar nombre duplicado si se cambia el nombre
            if data.nombre is not None and data.nombre != categoria.nombre:
                existing = repo.get_by_name_and_parent(data.nombre, categoria.padre_id)
                if existing and existing.id != categoria_id:
                    raise HTTPException(
                        status_code=status.HTTP_409_CONFLICT,
                        detail=f"Ya existe una categoría con el nombre '{data.nombre}' en este nivel",
                    )
                categoria.nombre = data.nombre

            # Validar referencia circular si se cambia el padre
            if data.padre_id is not None and data.padre_id != categoria.padre_id:
                # No permitir que una categoría sea padre de sí misma o de sus descendientes
                if data.padre_id == categoria_id:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Una categoría no puede ser padre de sí misma",
                    )
                # Verificar descendientes
                descendants = repo.get_all_descendants(categoria_id)
                if data.padre_id in descendants:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="No se puede crear una referencia circular (una categoría no puede ser padre de sus descendientes)",
                    )
                categoria.padre_id = data.padre_id

            if data.posicion is not None:
                categoria.posicion = data.posicion

            categoria.actualizado_en = datetime.now(timezone.utc)
            updated = repo.update(categoria)

            # Extraer datos antes de cerrar la sesión
            result = CategoriaResponse(
                id=updated.id,
                nombre=updated.nombre,
                padre_id=updated.padre_id,
                posicion=updated.posicion,
                creado_en=updated.creado_en,
                actualizado_en=updated.actualizado_en,
            )

        return result

    async def delete(self, categoria_id: int) -> None:
        """Elimina una categoría con validaciones."""
        with UnitOfWork() as uow:
            repo = CategoriaRepository(uow.session)
            categoria = repo.get_by_id(categoria_id)
            if not categoria:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Categoría no encontrada",
                )

            # Verificar si tiene hijos
            if repo.has_children(categoria_id):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="No se puede eliminar una categoría que tiene subcategorías",
                )

            # Verificar si tiene productos asociados (placeholder - implementar cuando exista modelo productos)
            # productos_count = self._get_productos_count(categoria_id)
            # if productos_count > 0:
            #     raise HTTPException(
            #         status_code=status.HTTP_409_CONFLICT,
            #         detail=f"No se puede eliminar la categoría porque tiene {productos_count} productos asociados",
            #     )

            repo.delete(categoria)

    def _get_productos_count(self, categoria_id: int) -> int:
        """Placeholder - implementar cuando exista modelo de productos."""
        # TODO: Cuando exista el modelo de productos, implementar esta función
        # usando el repositorio de productos
        return 0