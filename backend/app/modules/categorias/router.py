from typing import Optional

from fastapi import APIRouter, status

from app.modules.categorias.schema import (
    CategoriaCreate,
    CategoriaUpdate,
    CategoriaResponse,
    CategoriaTreeResponse,
    CategoriaListResponse,
)
from app.modules.categorias.service import CategoriaService

router = APIRouter(prefix="/api/v1/categorias", tags=["categorias"])
categoria_service = CategoriaService()


@router.post("", response_model=CategoriaResponse, status_code=status.HTTP_201_CREATED)
async def create_categoria(data: CategoriaCreate):
    """Crea una nueva categoría."""
    return await categoria_service.create(data)


@router.get("", response_model=CategoriaListResponse)
async def list_categorias(padre_id: Optional[int] = None):
    """Lista categorías, opcionalmente filtradas por padre."""
    categorias = await categoria_service.get_all(padre_id)
    return CategoriaListResponse(categorias=categorias, total=len(categorias))


@router.get("/tree", response_model=list[CategoriaTreeResponse])
async def get_categoria_tree():
    """Obtiene el árbol completo de categorías."""
    return await categoria_service.get_tree()


@router.get("/{categoria_id}", response_model=CategoriaResponse)
async def get_categoria(categoria_id: int):
    """Obtiene una categoría por su ID."""
    return await categoria_service.get_by_id(categoria_id)


@router.patch("/{categoria_id}", response_model=CategoriaResponse)
async def update_categoria(categoria_id: int, data: CategoriaUpdate):
    """Actualiza una categoría (nombre, padre, posición)."""
    return await categoria_service.update(categoria_id, data)


@router.delete("/{categoria_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_categoria(categoria_id: int):
    """Elimina una categoría (validando que no tenga hijos ni productos)."""
    await categoria_service.delete(categoria_id)
    return None