from typing import TypeVar, Generic, Type, Optional, List, Any
from sqlmodel import Session, select, func
from datetime import datetime

# Define un parámetro de tipo genérico para los modelos SQLModel
T = TypeVar("T")

class BaseRepository(Generic[T]):
    """
    Repositorio base genérico que implementa operaciones CRUD estándar.
    Provee métodos comunes para interactuar con la base de datos de manera uniforme.
    """
    def __init__(self, model: Type[T], session: Session):
        # Inicializa el repositorio con el modelo correspondiente y la sesión de BD activa
        self.model = model
        self.session = session

    def get_by_id(self, entity_id: int) -> Optional[T]:
        # Busca una entidad por su ID, excluyendo registros eliminados lógicamente
        statement = select(self.model).where(self.model.id == entity_id, self.model.eliminado_en == None)
        return self.session.exec(statement).first()

    def list_all(self, skip: int = 0, limit: int = 100) -> List[T]:
        # Obtiene una lista paginada de entidades, filtrando las eliminadas lógicamente
        statement = select(self.model).where(self.model.eliminado_en == None).offset(skip).limit(limit)
        return self.session.exec(statement).all()

    def count(self) -> int:
        # Retorna el conteo total de registros activos para una entidad
        statement = select(func.count()).select_from(self.model).where(self.model.eliminado_en == None)
        return self.session.exec(statement).one()

    def create(self, entity: T) -> T:
        # Persiste una nueva entidad en la base de datos
        self.session.add(entity)
        self.session.commit()
        self.session.refresh(entity)
        return entity

    def update(self, entity_id: int, data: dict[str, Any]) -> T:
        # Actualiza campos de una entidad existente y persiste los cambios
        entity = self.get_by_id(entity_id)
        if not entity:
            raise ValueError(f"{self.model.__name__} not found")
        for key, value in data.items():
            setattr(entity, key, value)
        self.session.add(entity)
        self.session.commit()
        self.session.refresh(entity)
        return entity

    def soft_delete(self, entity_id: int) -> None:
        # Realiza un borrado lógico estableciendo la fecha actual en eliminado_en
        entity = self.get_by_id(entity_id)
        if entity:
            entity.eliminado_en = datetime.utcnow()
            self.session.add(entity)
            self.session.commit()
