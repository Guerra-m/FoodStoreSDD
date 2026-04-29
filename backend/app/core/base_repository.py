from typing import TypeVar, Generic, Type, Optional, List, Any
from sqlmodel import Session, select, func
from datetime import datetime

T = TypeVar("T")

class BaseRepository(Generic[T]):
    def __init__(self, model: Type[T], session: Session):
        self.model = model
        self.session = session

    def get_by_id(self, entity_id: int) -> Optional[T]:
        statement = select(self.model).where(self.model.id == entity_id, self.model.eliminado_en == None)
        return self.session.exec(statement).first()

    def list_all(self, skip: int = 0, limit: int = 100) -> List[T]:
        statement = select(self.model).where(self.model.eliminado_en == None).offset(skip).limit(limit)
        return self.session.exec(statement).all()

    def count(self) -> int:
        statement = select(func.count()).select_from(self.model).where(self.model.eliminado_en == None)
        return self.session.exec(statement).one()

    def create(self, entity: T) -> T:
        self.session.add(entity)
        self.session.commit()
        self.session.refresh(entity)
        return entity

    def update(self, entity_id: int, data: dict[str, Any]) -> T:
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
        entity = self.get_by_id(entity_id)
        if entity:
            entity.eliminado_en = datetime.utcnow()
            self.session.add(entity)
            self.session.commit()
