from typing import Optional

from fastapi import APIRouter, status, Query

from app.modules.productos.schema import (
    ProductoCreate,
    ProductoUpdate,
    StockUpdate,
    ProductoResponse,
    ProductoPublicResponse,
    ProductoListResponse,
    ProductoPublicListResponse,
)
from app.modules.productos.service import ProductoService

router = APIRouter(prefix="/api/v1/products", tags=["products"])
producto_service = ProductoService()

# ─── Public endpoints (MUST be before /{id} to avoid route conflicts) ──


@router.get("/public", response_model=ProductoPublicListResponse)
async def list_public_products(
    categoria_id: Optional[int] = Query(None),
    search: Optional[str] = Query(None),
    min_price: Optional[int] = Query(None),
    max_price: Optional[int] = Query(None),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
):
    """Catálogo público de productos activos con filtros."""
    productos, total = await producto_service.get_public(
        categoria_id=categoria_id,
        search=search,
        min_price=min_price,
        max_price=max_price,
        page=page,
        per_page=per_page,
    )
    return ProductoPublicListResponse(
        productos=productos,
        total=total,
        page=page,
        per_page=per_page,
    )


@router.get("/public/{producto_id}", response_model=ProductoPublicResponse)
async def get_public_product(producto_id: int):
    """Obtiene detalle público de un producto activo."""
    producto = await producto_service.get_by_id(producto_id)
    # Convertir a respuesta pública
    return ProductoPublicResponse(
        id=producto.id,
        nombre=producto.nombre,
        descripcion=producto.descripcion,
        price_in_cents=producto.price_in_cents,
        images=producto.images,
        categoria_ids=producto.categoria_ids,
        ingredientes=producto.ingredientes,
    )


# ─── Admin endpoints ─────────────────────────────────────────────


@router.post("", response_model=ProductoResponse, status_code=status.HTTP_201_CREATED)
async def create_producto(data: ProductoCreate):
    """Crea un nuevo producto (requiere Admin)."""
    return await producto_service.create(data)


@router.get("", response_model=ProductoListResponse)
async def list_productos(page: int = Query(1, ge=1), per_page: int = Query(20, ge=1, le=100)):
    """Lista todos los productos incluyendo inactivos (Admin)."""
    productos, total = await producto_service.get_all_admin(page, per_page)
    return ProductoListResponse(productos=productos, total=total)


@router.get("/{producto_id}", response_model=ProductoResponse)
async def get_producto(producto_id: int):
    """Obtiene un producto por ID (Admin)."""
    return await producto_service.get_by_id(producto_id)


@router.patch("/{producto_id}", response_model=ProductoResponse)
async def update_producto(producto_id: int, data: ProductoUpdate):
    """Actualiza un producto (Admin)."""
    return await producto_service.update(producto_id, data)


@router.patch("/{producto_id}/stock", response_model=ProductoResponse)
async def update_producto_stock(producto_id: int, data: StockUpdate):
    """Gestiona stock de un producto (set, increment, decrement)."""
    return await producto_service.update_stock(producto_id, data)


@router.delete("/{producto_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_producto(producto_id: int):
    """Elimina un producto (Admin)."""
    await producto_service.delete(producto_id)
    return None
