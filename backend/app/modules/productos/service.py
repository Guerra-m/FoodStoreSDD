from datetime import datetime, timezone
from typing import Optional, List

from fastapi import HTTPException, status
from sqlmodel import select

from app.core.unit_of_work import UnitOfWork
from app.modules.productos.model import Producto, ProductoCategoria, ProductoIngrediente
from app.modules.productos.repository import ProductoRepository
from app.modules.productos.schema import (
    ProductoCreate,
    ProductoUpdate,
    StockUpdate,
    ProductoResponse,
    ProductoPublicResponse,
    ProductoIngredienteResponse,
)
from app.modules.categorias.repository import CategoriaRepository
from app.modules.ingredientes.repository import IngredienteRepository
from app.modules.ingredientes.model import Ingrediente


class ProductoService:
    """Servicio de gestión de productos del catálogo."""

    def _validate_categories(self, categoria_ids: list[int], repo_cat: CategoriaRepository) -> None:
        """Valida que todas las categorías existan."""
        for cat_id in categoria_ids:
            categoria = repo_cat.get_by_id(cat_id)
            if not categoria:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Categoría con ID {cat_id} no encontrada",
                )

    def _validate_ingredients(
        self, ingrediente_ids: list[int], repo_ing: IngredienteRepository
    ) -> None:
        """Valida que todos los ingredientes existan."""
        for ing_id in ingrediente_ids:
            ingrediente = repo_ing.get_by_id(ing_id)
            if not ingrediente:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Ingrediente con ID {ing_id} no encontrado",
                )

    def _build_response(
        self, producto: Producto, session
    ) -> ProductoResponse:
        """Construye respuesta completa con categorías e ingredientes."""
        categoria_ids = [c.id for c in producto.categorias]

        ingredientes_resp = []
        for pi in producto.ingredientes:
            ingrediente = session.get(Ingrediente, pi.ingrediente_id)
            ingredientes_resp.append(
                ProductoIngredienteResponse(
                    ingrediente_id=pi.ingrediente_id,
                    nombre=ingrediente.nombre if ingrediente else "Unknown",
                    cantidad=pi.cantidad,
                    unidad_medida=ingrediente.unidad_medida if ingrediente else "",
                )
            )

        return ProductoResponse(
            id=producto.id,
            nombre=producto.nombre,
            descripcion=producto.descripcion,
            price_in_cents=producto.price_in_cents,
            images=producto.images or [],
            stock=producto.stock,
            is_active=producto.is_active,
            categoria_ids=categoria_ids,
            ingredientes=ingredientes_resp,
            creado_en=producto.creado_en,
            actualizado_en=producto.actualizado_en,
        )

    def _build_public_response(
        self, producto: Producto, session
    ) -> ProductoPublicResponse:
        """Construye respuesta pública de producto."""
        categoria_ids = [c.id for c in producto.categorias]

        ingredientes_resp = []
        for pi in producto.ingredientes:
            ingrediente = session.get(Ingrediente, pi.ingrediente_id)
            ingredientes_resp.append(
                ProductoIngredienteResponse(
                    ingrediente_id=pi.ingrediente_id,
                    nombre=ingrediente.nombre if ingrediente else "Unknown",
                    cantidad=pi.cantidad,
                    unidad_medida=ingrediente.unidad_medida if ingrediente else "",
                )
            )

        return ProductoPublicResponse(
            id=producto.id,
            nombre=producto.nombre,
            descripcion=producto.descripcion,
            price_in_cents=producto.price_in_cents,
            images=producto.images or [],
            categoria_ids=categoria_ids,
            ingredientes=ingredientes_resp,
        )

    async def create(self, data: ProductoCreate) -> ProductoResponse:
        """Crea un nuevo producto con categorías e ingredientes."""
        with UnitOfWork() as uow:
            repo = ProductoRepository(uow.session)
            repo_cat = CategoriaRepository(uow.session)
            repo_ing = IngredienteRepository(uow.session)

            # Validar existencias
            if data.categoria_ids:
                self._validate_categories(data.categoria_ids, repo_cat)
            ingrediente_ids = [i.ingrediente_id for i in data.ingredientes]
            if ingrediente_ids:
                self._validate_ingredients(ingrediente_ids, repo_ing)

            producto = Producto(
                nombre=data.nombre,
                descripcion=data.descripcion,
                price_in_cents=data.price_in_cents,
                images=data.images,
                stock=data.stock,
                is_active=data.is_active,
            )
            created = repo.create(producto)

            # Asociar categorías
            for cat_id in data.categoria_ids:
                uow.session.add(ProductoCategoria(
                    producto_id=created.id, categoria_id=cat_id
                ))

            # Asociar ingredientes
            for ing in data.ingredientes:
                uow.session.add(ProductoIngrediente(
                    producto_id=created.id,
                    ingrediente_id=ing.ingrediente_id,
                    cantidad=ing.cantidad,
                ))

            uow.session.commit()
            uow.session.refresh(created)

            return self._build_response(created, uow.session)

    async def get_by_id(self, producto_id: int) -> ProductoResponse:
        """Obtiene un producto por ID."""
        with UnitOfWork() as uow:
            repo = ProductoRepository(uow.session)
            producto = repo.get_by_id(producto_id)
            if not producto:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Producto no encontrado",
                )
            return self._build_response(producto, uow.session)

    async def get_all_admin(
        self, page: int = 1, per_page: int = 20
    ) -> tuple[list[ProductoResponse], int]:
        """Lista todos los productos (admin)."""
        with UnitOfWork() as uow:
            repo = ProductoRepository(uow.session)
            productos, total = repo.get_all_admin(page, per_page)
            return [self._build_response(p, uow.session) for p in productos], total

    async def get_public(
        self,
        categoria_id: Optional[int] = None,
        search: Optional[str] = None,
        min_price: Optional[int] = None,
        max_price: Optional[int] = None,
        page: int = 1,
        per_page: int = 20,
    ) -> tuple[list[ProductoPublicResponse], int]:
        """Lista productos activos con filtros (catálogo público)."""
        with UnitOfWork() as uow:
            repo = ProductoRepository(uow.session)
            productos, total = repo.get_public(
                categoria_id=categoria_id,
                search=search,
                min_price=min_price,
                max_price=max_price,
                page=page,
                per_page=per_page,
            )

            result = [
                self._build_public_response(p, uow.session) for p in productos
            ]

            return result, total

    async def update(self, producto_id: int, data: ProductoUpdate) -> ProductoResponse:
        """Actualiza un producto con sus asociaciones."""
        with UnitOfWork() as uow:
            repo = ProductoRepository(uow.session)
            repo_cat = CategoriaRepository(uow.session)
            repo_ing = IngredienteRepository(uow.session)

            producto = repo.get_by_id(producto_id)
            if not producto:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Producto no encontrado",
                )

            # Actualizar campos simples
            update_data = data.model_dump(exclude_unset=True)
            # Quitar campos de relaciones del dict de actualización directa
            update_data.pop("categoria_ids", None)
            update_data.pop("ingredientes", None)

            for key, value in update_data.items():
                setattr(producto, key, value)

            producto.actualizado_en = datetime.now(timezone.utc)

            # Actualizar categorías si se proporcionan
            if data.categoria_ids is not None:
                self._validate_categories(data.categoria_ids, repo_cat)
                # Eliminar asociaciones existentes
                existing = uow.session.exec(
                    select(ProductoCategoria).where(
                        ProductoCategoria.producto_id == producto_id
                    )
                ).all()
                for pc in existing:
                    uow.session.delete(pc)

                # Crear nuevas asociaciones
                for cat_id in data.categoria_ids:
                    uow.session.add(ProductoCategoria(
                        producto_id=producto_id, categoria_id=cat_id
                    ))

            # Actualizar ingredientes si se proporcionan
            if data.ingredientes is not None:
                ing_ids = [i.ingrediente_id for i in data.ingredientes]
                self._validate_ingredients(ing_ids, repo_ing)

                existing = uow.session.exec(
                    select(ProductoIngrediente).where(
                        ProductoIngrediente.producto_id == producto_id
                    )
                ).all()
                for pi in existing:
                    uow.session.delete(pi)

                for ing in data.ingredientes:
                    uow.session.add(ProductoIngrediente(
                        producto_id=producto_id,
                        ingrediente_id=ing.ingrediente_id,
                        cantidad=ing.cantidad or 0,
                    ))

            updated = repo.update(producto)
            return self._build_response(updated, uow.session)

    async def update_stock(self, producto_id: int, data: StockUpdate) -> ProductoResponse:
        """Gestiona el stock de un producto (set, increment, decrement)."""
        with UnitOfWork() as uow:
            repo = ProductoRepository(uow.session)

            producto = repo.get_by_id(producto_id)
            if not producto:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Producto no encontrado",
                )

            if data.action == "set":
                producto.stock = data.value
            elif data.action == "increment":
                producto.stock += data.value
            elif data.action == "decrement":
                if producto.stock - data.value < 0:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Stock insuficiente: no se puede decrementar por debajo de 0",
                    )
                producto.stock -= data.value
            else:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Acción de stock inválida: {data.action}. Use 'set', 'increment' o 'decrement'",
                )

            producto.actualizado_en = datetime.now(timezone.utc)
            updated = repo.update(producto)
            return self._build_response(updated, uow.session)

    async def delete(self, producto_id: int) -> None:
        """Elimina un producto (soft delete)."""
        with UnitOfWork() as uow:
            repo = ProductoRepository(uow.session)
            producto = repo.get_by_id(producto_id)
            if not producto:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Producto no encontrado",
                )
            repo.delete(producto)
