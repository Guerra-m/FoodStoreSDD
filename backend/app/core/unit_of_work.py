from app.core.database import Session, engine
from app.modules.usuarios.repository import UsuarioRepository # Pendiente de crear

class UnitOfWork:
    def __init__(self):
        self.session = Session(engine)

    def __enter__(self):
        # Inicializar repositorios aquí
        # self.usuarios = UsuarioRepository(self.session)
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        if exc_type:
            self.session.rollback()
        else:
            self.session.commit()
        self.session.close()
