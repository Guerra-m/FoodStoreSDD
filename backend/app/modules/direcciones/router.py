from fastapi import APIRouter, Depends, HTTPException, status

from app.core.security import get_current_user, require_roles
from app.modules.direcciones.schema import DireccionCreate, DireccionUpdate, DireccionResponse
from app.modules.direcciones.service import DireccionService

router = APIRouter(prefix="/api/v1/clientes", tags=["clientes"])
direccion_service = DireccionService()


@router.get("/direcciones", response_model=list[DireccionResponse])
async def list_direcciones(payload: dict = Depends(require_roles(["Cliente"]))):
    """Lista todas las direcciones del cliente autenticado."""
    usuario_id = int(payload.get("sub"))
    return await direccion_service.list_by_usuario(usuario_id)


@router.post("/direcciones", response_model=DireccionResponse, status_code=status.HTTP_201_CREATED)
async def create_direccion(
    data: DireccionCreate,
    payload: dict = Depends(require_roles(["Cliente"])),
):
    """Crea una nueva dirección de entrega."""
    usuario_id = int(payload.get("sub"))
    return await direccion_service.create(usuario_id, data.model_dump())


@router.put("/direcciones/{direccion_id}", response_model=DireccionResponse)
async def update_direccion(
    direccion_id: int,
    data: DireccionUpdate,
    payload: dict = Depends(require_roles(["Cliente"])),
):
    """Actualiza una dirección existente."""
    usuario_id = int(payload.get("sub"))
    return await direccion_service.update(direccion_id, usuario_id, data.model_dump(exclude_unset=True))


@router.delete("/direcciones/{direccion_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_direccion(
    direccion_id: int,
    payload: dict = Depends(require_roles(["Cliente"])),
):
    """Elimina una dirección."""
    usuario_id = int(payload.get("sub"))
    await direccion_service.delete(direccion_id, usuario_id)
    return None


@router.patch("/direcciones/{direccion_id}/principal", response_model=DireccionResponse)
async def set_direccion_principal(
    direccion_id: int,
    payload: dict = Depends(require_roles(["Cliente"])),
):
    """Marca una dirección como principal."""
    usuario_id = int(payload.get("sub"))
    return await direccion_service.set_principal(direccion_id, usuario_id)
