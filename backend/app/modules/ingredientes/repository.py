from typing import Optional, List
from sqlmodel import Session, select, func
from datetime import datetime, timezone
from app.modules.ingredientes.model import Ingrediente

class IngredienteRepository:
    """Repositorio para operaciones de Ingrediente."""

    def __init__(self, session: Session):
        self.session = session

    def create(self, ingrediente: Ingrediente) -> Ingrediente:
        """Crea un nuevo ingrediente."""
        self.session.add(ingrediente)
        self.session.commit()
        self.session.refresh(ingrediente)
        return ingrediente

    def get_by_id(self, ingrediente_id: int) -> Optional[Ingrediente]:
        """Obtiene un ingrediente por ID."""
        statement = select(Ingrediente).where(
            Ingrediente.id == ingrediente_id,
            Ingrediente.eliminado_en == None,
        )
        return self.session.exec(statement).first()

    def get_all(self) -> List[Ingrediente]:
        """Obtiene todos los ingredientes activos."""
        statement = select(Ingrediente).where(
            Ingrediente.eliminado_en == None,
        ).order_by(Ingrediente.nombre)
        return self.session.exec(statement).all()

    def get_by_name(self, nombre: str) -> Optional[Ingrediente]:
        """Busca un ingrediente por nombre."""
        statement = select(Ingrediente).where(
            func.lower(Ingrediente.nombre) == nombre.lower(),
            Ingrediente.eliminado_en == None,
        )
        return self.session.exec(statement).first()

    def update(self, ingrediente: Ingrediente) -> Ingrediente:
        """Actualiza un ingrediente."""
        ingrediente.actualizado_en = datetime.now(timezone.utc)
        self.session.add(ingrediente)
        self.session.commit()
        self.session.refresh(ingrediente)
        return ingrediente

    def delete(self, ingrediente: Ingrediente) -> None:
        """Soft delete de un ingrediente."""
        ingrediente.eliminado_en = datetime.now(timezone.utc)
        self.session.add(ingrediente)
        self.session.commit()
