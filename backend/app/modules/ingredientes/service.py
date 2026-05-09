from datetime import datetime, timezone
from typing import List, Optional

from fastapi import HTTPException, status

from app.core.unit_of_work import UnitOfWork
from app.modules.ingredientes.model import Ingrediente
from app.modules.ingredientes.repository import IngredienteRepository
from app.modules.ingredientes.schema import (
    IngredienteCreate,
    IngredienteUpdate,
    IngredienteResponse,
)

class IngredienteService:
    """Servicio de gestión de ingredientes."""

    async def create(self, data: IngredienteCreate) -> IngredienteResponse:
        """Crea un nuevo ingrediente."""
        with UnitOfWork() as uow:
            repo = IngredienteRepository(uow.session)

            # Validar nombre duplicado
            existing = repo.get_by_name(data.nombre)
            if existing:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=f"Ya existe un ingrediente con el nombre '{data.nombre}'",
                )

            ingrediente = Ingrediente(
                nombre=data.nombre,
                descripcion=data.descripcion,
                unidad_medida=data.unidad_medida,
                costo_unitario=data.costo_unitario,
            )
            created = repo.create(ingrediente)
            
            return IngredienteResponse.model_validate(created)

    async def get_all(self) -> List[IngredienteResponse]:
        """Obtiene todos los ingredientes."""
        with UnitOfWork() as uow:
            repo = IngredienteRepository(uow.session)
            ingredientes = repo.get_all()
            return [IngredienteResponse.model_validate(i) for i in ingredientes]

    async def get_by_id(self, ingrediente_id: int) -> IngredienteResponse:
        """Obtiene un ingrediente por ID."""
        with UnitOfWork() as uow:
            repo = IngredienteRepository(uow.session)
            ingrediente = repo.get_by_id(ingrediente_id)
            if not ingrediente:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Ingrediente no encontrado",
                )
            return IngredienteResponse.model_validate(ingrediente)

    async def update(self, ingrediente_id: int, data: IngredienteUpdate) -> IngredienteResponse:
        """Actualiza un ingrediente."""
        with UnitOfWork() as uow:
            repo = IngredienteRepository(uow.session)
            ingrediente = repo.get_by_id(ingrediente_id)
            if not ingrediente:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Ingrediente no encontrado",
                )

            # Actualizar campos si se proporcionan
            update_data = data.model_dump(exclude_unset=True)
            for key, value in update_data.items():
                setattr(ingrediente, key, value)

            updated = repo.update(ingrediente)
            return IngredienteResponse.model_validate(updated)

    async def delete(self, ingrediente_id: int) -> None:
        """Elimina un ingrediente con validación de productos asociados."""
        with UnitOfWork() as uow:
            repo = IngredienteRepository(uow.session)
            ingrediente = repo.get_by_id(ingrediente_id)
            if not ingrediente:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Ingrediente no encontrado",
                )

            # Verificar si tiene productos asociados
            from app.modules.productos.repository import ProductoRepository
            repo_prod = ProductoRepository(uow.session)
            productos_count = repo_prod.count_by_ingrediente(ingrediente_id)
            if productos_count > 0:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=f"No se puede eliminar el ingrediente porque está siendo usado por {productos_count} productos",
                )

            repo.delete(ingrediente)
