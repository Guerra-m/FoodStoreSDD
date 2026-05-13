from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from app.core.exceptions import global_exception_handler
from app.modules.usuarios.router import router as auth_router
from app.modules.categorias.router import router as categorias_router
from app.modules.ingredientes.router import router as ingredientes_router
from app.modules.productos.router import router as productos_router
from app.modules.direcciones.router import router as clientes_router
from app.modules.pedidos.router import router as pedidos_router
from app.auth.routes import router as auth_routes_router
from app.admin.routes import router as admin_router
from dotenv import load_dotenv
import os
from sqlmodel import SQLModel
from app.core.database import engine

# Carga de variables de entorno
load_dotenv()

app = FastAPI(title="Food Store API", version="1.0.0")

# Creación de tablas de base de datos al iniciar
@app.on_event("startup")
def on_startup():
    SQLModel.metadata.create_all(engine)

# Registro de manejadores de excepciones globales
app.add_exception_handler(StarletteHTTPException, global_exception_handler)
app.add_exception_handler(RequestValidationError, global_exception_handler)
app.add_exception_handler(Exception, global_exception_handler)

# CORS configuración para permitir comunicaciones desde el frontend
origins = os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(auth_routes_router)  # Nuevos endpoints de autenticación JWT
app.include_router(admin_router)  # Endpoints que requieren roles
app.include_router(auth_router)
app.include_router(categorias_router)
app.include_router(ingredientes_router)
app.include_router(productos_router)
app.include_router(clientes_router)
app.include_router(pedidos_router)

@app.get("/health")
async def health_check():
    """
    Endpoint de monitoreo para verificar el estado de la API.
    """
    return {"status": "ok"}
