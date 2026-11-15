import hashlib
import secrets
from datetime import datetime, timedelta, timezone
from typing import Any, Union, Optional
import bcrypt
from jose import jwt
from app.core.config import settings

def get_password_hash(password: str) -> str:
    """Hash password using bcrypt directly."""
    salt = bcrypt.gensalt(rounds=12)
    hashed = bcrypt.hashpw(password.encode("utf-8"), salt)
    return hashed.decode("utf-8")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password against bcrypt hash."""
    try:
        return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))
    except Exception:
        return False

def create_access_token(subject: Union[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """Create signed JWT access token."""
    now_utc = datetime.now(timezone.utc)
    if expires_delta:
        expire = now_utc + expires_delta
    else:
        expire = now_utc + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode = {
        "exp": expire,
        "iat": now_utc,
        "sub": str(subject)
    }
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def generate_invitation_code() -> str:
    """
    Generate an 8-character human-friendly uppercase code (e.g. CC8K2F9P).
    Avoids confusing characters like 0, O, 1, I.
    """
    alphabet = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ"
    random_str = "".join(secrets.choice(alphabet) for _ in range(8))
    return f"CC-{random_str[:4]}-{random_str[4:]}"

def hash_invitation_code(code: str) -> str:
    """
    Produce a deterministic SHA-256 hash of the sanitized uppercase code.
    Ensures passcodes are never stored plaintext in the database.
    """
    cleaned = code.strip().upper().replace("-", "")
    return hashlib.sha256(cleaned.encode("utf-8")).hexdigest()
