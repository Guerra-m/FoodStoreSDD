from typing import Optional, List

from sqlmodel import Session, select, func

from app.modules.categorias.model import Categoria


class CategoriaRepository:
    """Repositorio para operaciones de Categoria."""

    def __init__(self, session: Session):
        self.session = session

    def create(self, categoria: Categoria) -> Categoria:
        """Crea una nueva categoría."""
        self.session.add(categoria)
        self.session.commit()
        self.session.refresh(categoria)
        return categoria

    def get_by_id(self, categoria_id: int) -> Optional[Categoria]:
        """Obtiene una categoría por ID."""
        statement = select(Categoria).where(
            Categoria.id == categoria_id,
            Categoria.eliminado_en == None,
        )
        return self.session.exec(statement).first()

    def get_by_id_include_deleted(self, categoria_id: int) -> Optional[Categoria]:
        """Obtiene una categoría por ID incluyendo eliminados (para validaciones)."""
        statement = select(Categoria).where(Categoria.id == categoria_id)
        return self.session.exec(statement).first()

    def get_all_root(self) -> List[Categoria]:
        """Obtiene todas las categorías raíz (sin padre)."""
        statement = select(Categoria).where(
            Categoria.padre_id == None,
            Categoria.eliminado_en == None,
        ).order_by(Categoria.posicion, Categoria.nombre)
        return self.session.exec(statement).all()

    def get_by_parent(self, padre_id: int) -> List[Categoria]:
        """Obtiene las categorías hijo de un padre."""
        statement = select(Categoria).where(
            Categoria.padre_id == padre_id,
            Categoria.eliminado_en == None,
        ).order_by(Categoria.posicion, Categoria.nombre)
        return self.session.exec(statement).all()

    def get_all(self) -> List[Categoria]:
        """Obtiene todas las categorías activas."""
        statement = select(Categoria).where(
            Categoria.eliminado_en == None,
        ).order_by(Categoria.posicion, Categoria.nombre)
        return self.session.exec(statement).all()

    def get_by_name_and_parent(self, nombre: str, padre_id: Optional[int]) -> Optional[Categoria]:
        """Busca una categoría por nombre dentro del mismo padre."""
        statement = select(Categoria).where(
            func.lower(Categoria.nombre) == nombre.lower(),
            Categoria.padre_id == padre_id,
            Categoria.eliminado_en == None,
        )
        return self.session.exec(statement).first()

    def get_max_position(self, padre_id: Optional[int]) -> int:
        """Obtiene la máxima posición para un padre dado."""
        statement = select(func.max(Categoria.posicion)).where(
            Categoria.padre_id == padre_id,
            Categoria.eliminado_en == None,
        )
        result = self.session.exec(statement).first()
        return result if result else 0

    def has_children(self, categoria_id: int) -> bool:
        """Verifica si una categoría tiene hijos."""
        statement = select(func.count(Categoria.id)).where(
            Categoria.padre_id == categoria_id,
            Categoria.eliminado_en == None,
        )
        count = self.session.exec(statement).first()
        return count > 0

    def get_all_descendants(self, categoria_id: int) -> List[int]:
        """Obtiene todos los descendientes de una categoría (hijos, nietos, etc.)."""
        descendants = []
        queue = [categoria_id]

        while queue:
            current_id = queue.pop(0)
            children = self.get_by_parent(current_id)
            for child in children:
                descendants.append(child.id)
                queue.append(child.id)

        return descendants

    def update(self, categoria: Categoria) -> Categoria:
        """Actualiza una categoría."""
        self.session.add(categoria)
        self.session.commit()
        self.session.refresh(categoria)
        return categoria

    def delete(self, categoria: Categoria) -> None:
        """Soft delete de una categoría."""
        from datetime import datetime, timezone
        categoria.eliminado_en = datetime.now(timezone.utc)
        self.session.add(categoria)
        self.session.commit()