from datetime import datetime, timezone
from typing import Optional, List

from sqlmodel import Session, select, func

from app.modules.direcciones.model import Direccion


class DireccionRepository:
    """Repositorio para operaciones de Direccion."""

    def __init__(self, session: Session):
        self.session = session

    def create(self, direccion: Direccion) -> Direccion:
        """Crea una nueva dirección."""
        self.session.add(direccion)
        self.session.commit()
        self.session.refresh(direccion)
        return direccion

    def get_by_id(self, direccion_id: int) -> Optional[Direccion]:
        """Obtiene una dirección por ID."""
        statement = select(Direccion).where(Direccion.id == direccion_id)
        return self.session.exec(statement).first()

    def list_by_usuario(self, usuario_id: int) -> List[Direccion]:
        """Obtiene todas las direcciones de un usuario, ordenadas: principal primero."""
        statement = (
            select(Direccion)
            .where(Direccion.usuario_id == usuario_id)
            .order_by(Direccion.es_principal.desc(), Direccion.creado_en.desc())
        )
        return list(self.session.exec(statement).all())

    def update(self, direccion: Direccion) -> Direccion:
        """Actualiza una dirección."""
        direccion.actualizado_en = datetime.now(timezone.utc)
        self.session.add(direccion)
        self.session.commit()
        self.session.refresh(direccion)
        return direccion

    def delete(self, direccion: Direccion) -> None:
        """Elimina una dirección físicamente."""
        self.session.delete(direccion)
        self.session.commit()

    def get_principal(self, usuario_id: int) -> Optional[Direccion]:
        """Obtiene la dirección principal de un usuario."""
        statement = (
            select(Direccion)
            .where(Direccion.usuario_id == usuario_id, Direccion.es_principal == True)
        )
        return self.session.exec(statement).first()

    def count_by_usuario(self, usuario_id: int) -> int:
        """Cuenta direcciones de un usuario."""
        statement = select(func.count(Direccion.id)).where(
            Direccion.usuario_id == usuario_id
        )
        result = self.session.exec(statement).first()
        return result or 0

    def set_principal(self, direccion_id: int, usuario_id: int) -> Direccion:
        """Marca una dirección como principal, desmarcando las demás del usuario."""
        # Desmarcar todas las direcciones del usuario
        statement = select(Direccion).where(
            Direccion.usuario_id == usuario_id,
            Direccion.es_principal == True,
        )
        for d in self.session.exec(statement).all():
            d.es_principal = False
            d.actualizado_en = datetime.now(timezone.utc)
            self.session.add(d)

        # Marcar la nueva como principal
        direccion = self.get_by_id(direccion_id)
        if direccion:
            direccion.es_principal = True
            direccion.actualizado_en = datetime.now(timezone.utc)
            self.session.add(direccion)

        self.session.commit()
        self.session.refresh(direccion)
        return direccion
