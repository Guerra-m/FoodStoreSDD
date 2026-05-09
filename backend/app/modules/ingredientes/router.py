from typing import Optional
from fastapi import APIRouter, status, Depends
from app.modules.ingredientes.schema import (
    IngredienteCreate,
    IngredienteUpdate,
    IngredienteResponse,
    IngredienteListResponse,
)
from app.modules.ingredientes.service import IngredienteService

router = APIRouter(prefix="/api/v1/ingredientes", tags=["ingredientes"])
ingrediente_service = IngredienteService()


@router.post("", response_model=IngredienteResponse, status_code=status.HTTP_201_CREATED)
async def create_ingrediente(data: IngredienteCreate):
    """Crea un nuevo ingrediente."""
    return await ingrediente_service.create(data)


@router.get("", response_model=IngredienteListResponse)
async def list_ingredientes():
    """Lista todos los ingredientes."""
    ingredientes = await ingrediente_service.get_all()
    return IngredienteListResponse(ingredientes=ingredientes, total=len(ingredientes))


@router.get("/{ingrediente_id}", response_model=IngredienteResponse)
async def get_ingrediente(ingrediente_id: int):
    """Obtiene un ingrediente por su ID."""
    return await ingrediente_service.get_by_id(ingrediente_id)


@router.patch("/{ingrediente_id}", response_model=IngredienteResponse)
async def update_ingrediente(ingrediente_id: int, data: IngredienteUpdate):
    """Actualiza un ingrediente."""
    return await ingrediente_service.update(ingrediente_id, data)


@router.delete("/{ingrediente_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_ingrediente(ingrediente_id: int):
    """Elimina un ingrediente."""
    await ingrediente_service.delete(ingrediente_id)
    return None
