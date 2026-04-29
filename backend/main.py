from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from app.core.exceptions import global_exception_handler
from dotenv import load_dotenv
import os

# Carga de variables de entorno
load_dotenv()

app = FastAPI(title="Food Store API", version="1.0.0")

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

@app.get("/health")
async def health_check():
    """
    Endpoint de monitoreo para verificar el estado de la API.
    """
    return {"status": "ok"}
