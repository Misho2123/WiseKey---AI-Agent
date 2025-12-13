from datetime import datetime, timedelta
from jose import jwt
import bcrypt

from .config import JWT_SECRET, JWT_ALG, ACCESS_TOKEN_MINUTES, REFRESH_TOKEN_DAYS


def _normalize_password(password: str) -> bytes:
    # bcrypt limits input to 72 bytes; for MVP we enforce it safely
    pw = (password or "").strip().encode("utf-8")
    if len(pw) > 72:
        pw = pw[:72]
    return pw


def hash_password(password: str) -> str:
    pw = _normalize_password(password)
    hashed = bcrypt.hashpw(pw, bcrypt.gensalt())
    return hashed.decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    pw = _normalize_password(plain)
    try:
        return bcrypt.checkpw(pw, hashed.encode("utf-8"))
    except Exception:
        return False


def create_access_token(sub: str) -> str:
    exp = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_MINUTES)
    return jwt.encode(
        {"sub": sub, "type": "access", "exp": exp},
        JWT_SECRET,
        algorithm=JWT_ALG,
    )


def create_refresh_token(sub: str) -> str:
    exp = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_DAYS)
    return jwt.encode(
        {"sub": sub, "type": "refresh", "exp": exp},
        JWT_SECRET,
        algorithm=JWT_ALG,
    )


def decode_access_token(token: str) -> dict:
    from fastapi import HTTPException

    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALG])
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")

    if payload.get("type") != "access":
        raise HTTPException(status_code=401, detail="Not an access token")

    return payload
