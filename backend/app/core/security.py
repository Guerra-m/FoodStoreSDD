import hashlib
import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional, List

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import settings
from app.core.database import Session, engine

# Esquema de seguridad para extraer el token del header Authorization: Bearer
security_scheme = HTTPBearer(auto_error=False)

# Contexto de passlib para bcrypt
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    """Hashea una contraseña usando bcrypt."""
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifica una contraseña contra su hash."""
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(sub: str, roles: List[str], expires_delta: Optional[timedelta] = None) -> str:
    """Crea un JWT access token con subject (user_id) y roles."""
    to_encode = {
        "sub": sub,
        "roles": roles,
        "type": "access",
    }
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode["exp"] = expire
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm="HS256")


def decode_access_token(token: str) -> dict:
    """Decodifica y valida un JWT access token. Lanza HTTPException si es inválido."""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        if payload.get("type") != "access":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token type",
            )
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )


def generate_refresh_token() -> tuple[str, str]:
    """Genera un par (raw_token, sha256_hash). El hash se almacena en BD."""
    raw = secrets.token_urlsafe(48)
    hash_val = hashlib.sha256(raw.encode()).hexdigest()
    return raw, hash_val


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme),
) -> dict:
    """FastAPI Dependency que extrae y valida el usuario desde el JWT."""
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
        )
    payload = decode_access_token(credentials.credentials)
    return payload


def require_roles(allowed_roles: List[str]):
    """Factory que retorna una FastAPI Dependency para verificar roles del usuario.

    Uso:
        @router.get("/admin")
        async def admin_endpoint(payload: dict = Depends(require_roles(["Admin"]))):
            ...
    """
    async def role_checker(payload: dict = Depends(get_current_user)) -> dict:
        user_roles = payload.get("roles", [])
        if not any(role in user_roles for role in allowed_roles):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes permisos para acceder a este recurso",
            )
        return payload
    return role_checker