from fastapi import Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException

"""
Manejadores de excepciones globales siguiendo el estándar RFC 7807 (Problem Details).
"""

async def global_exception_handler(request: Request, exc: Exception):
    # Manejo de errores HTTP definidos
    if isinstance(exc, StarletteHTTPException):
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "type": "about:blank",
                "title": "HTTP Error",
                "status": exc.status_code,
                "detail": str(exc.detail),
            },
        )
    
    # Manejo de errores de validación de esquemas (Pydantic)
    if isinstance(exc, RequestValidationError):
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content={
                "type": "about:blank",
                "title": "Validation Error",
                "status": status.HTTP_422_UNPROCESSABLE_ENTITY,
                "detail": "Invalid data",
                "errors": exc.errors(),
            },
        )

    # Manejo de errores inesperados (500)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "type": "about:blank",
            "title": "Internal Server Error",
            "status": status.HTTP_500_INTERNAL_SERVER_ERROR,
            "detail": "An unexpected error occurred",
        },
    )
