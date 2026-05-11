from datetime import datetime, timedelta
from typing import Optional, List
from jose import JWTError, jwt
from passlib.context import CryptContext
import secrets
import hashlib
import re
from pydantic import EmailStr

# Configuración de hash de contraseñas
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    """
    Hashea una contraseña usando bcrypt.
    
    Args:
        password: Contraseña en texto plano
        
    Returns:
        Password hasheado
    """
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verifica que una contraseña en texto plano coincida con su hash.
    
    Args:
        plain_password: Contraseña en texto plano
        hashed_password: Password hasheado
        
    Returns:
        True si coinciden, False en caso contrario
    """
    return pwd_context.verify(plain_password, hashed_password)


def generate_random_token(length: int = 32) -> str:
    """
    Genera un token aleatorio opaco seguro para refresh tokens.
    
    Args:
        length: Longitud del token en bytes (default: 32 = 256 bits)
        
    Returns:
        Token aleatorio codificado en base64 URL-safe
    """
    token_bytes = secrets.token_bytes(length)
    # Retornar como string URL-safe
    return secrets.token_urlsafe(length)


def hash_token(token: str) -> str:
    """
    Hashea un token para almacenamiento seguro en BD.
    
    Args:
        token: Token en texto plano
        
    Returns:
        Token hasheado con SHA256
    """
    return hashlib.sha256(token.encode()).hexdigest()


def validate_email_format(email: str) -> bool:
    """
    Valida que un email tenga formato válido.
    
    Args:
        email: Email a validar
        
    Returns:
        True si es válido, False en caso contrario
    """
    email_regex = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
    return re.match(email_regex, email) is not None


def validate_password_strength(password: str) -> tuple[bool, str]:
    """
    Valida que una contraseña cumpla requisitos de seguridad.
    
    Args:
        password: Contraseña a validar
        
    Returns:
        Tuple (is_valid, message)
    """
    if len(password) < 8:
        return False, "Password debe tener mínimo 8 caracteres"
    
    if len(password) > 255:
        return False, "Password no puede exceder 255 caracteres"
    
    return True, "Password válido"


def create_access_token(
    data: dict,
    secret_key: str,
    expires_delta: Optional[timedelta] = None
) -> str:
    """
    Crea un access token JWT.
    
    Args:
        data: Claims a incluir en el token (e.g., {"sub": user_id})
        secret_key: Clave secreta para firmar
        expires_delta: Duración del token
        
    Returns:
        JWT token firmado
    """
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    
    to_encode.update({"exp": expire})
    
    encoded_jwt = jwt.encode(to_encode, secret_key, algorithm="HS256")
    return encoded_jwt


def verify_jwt_token(token: str, secret_key: str) -> Optional[dict]:
    """
    Verifica y deserializa un JWT token.
    
    Args:
        token: JWT token a verificar
        secret_key: Clave secreta para verificación
        
    Returns:
        Dict con claims si es válido, None si no
    """
    try:
        payload = jwt.decode(token, secret_key, algorithms=["HS256"])
        return payload
    except JWTError:
        return None
    except Exception:
        return None


def extract_token_from_header(authorization_header: Optional[str]) -> Optional[str]:
    """
    Extrae el token de un header Authorization.
    
    Args:
        authorization_header: Header "Authorization: Bearer <token>"
        
    Returns:
        Token sin "Bearer " o None si no es válido
    """
    if not authorization_header:
        return None
    
    parts = authorization_header.split()
    
    if len(parts) != 2 or parts[0].lower() != "bearer":
        return None
    
    return parts[1]


def extract_roles_from_token(payload: dict) -> List[str]:
    """
    Extrae la lista de roles del payload decodificado de un JWT.
    
    Args:
        payload: Payload decodificado del JWT (resultado de verify_jwt_token)
        
    Returns:
        Lista de roles. Si no existen o no es lista, retorna []
    """
    if not payload:
        return []
    
    roles = payload.get("roles", [])
    
    # Asegurar que es una lista
    if isinstance(roles, list):
        return roles
    
    return []


def create_access_token_with_roles(
    data: dict,
    roles: List[str],
    secret_key: str,
    expires_delta: Optional[timedelta] = None
) -> str:
    """
    Crea un access token JWT con claim de roles incluido.
    
    Args:
        data: Claims base a incluir (e.g., {"sub": user_id})
        roles: Lista de nombres de roles del usuario
        secret_key: Clave secreta para firmar
        expires_delta: Duración del token
        
    Returns:
        JWT token firmado con roles incluido
    """
    to_encode = data.copy()
    to_encode["roles"] = roles  # Agregar roles como claim
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    
    to_encode.update({"exp": expire})
    
    encoded_jwt = jwt.encode(to_encode, secret_key, algorithm="HS256")
    return encoded_jwt
