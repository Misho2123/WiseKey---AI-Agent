from datetime import datetime, timedelta
from jose import jwt
from passlib.context import CryptContext
from .config import JWT_SECRET, JWT_ALG, ACCESS_TOKEN_MINUTES, REFRESH_TOKEN_DAYS

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)

def create_access_token(sub: str) -> str:
    exp = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_MINUTES)
    return jwt.encode({"sub": sub, "type": "access", "exp": exp}, JWT_SECRET, algorithm=JWT_ALG)

def create_refresh_token(sub: str) -> str:
    exp = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_DAYS)
    return jwt.encode({"sub": sub, "type": "refresh", "exp": exp}, JWT_SECRET, algorithm=JWT_ALG)


def create_refresh_token(sub: str) -> str:
    exp = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_DAYS)
    return jwt.encode({"sub": sub, "type": "refresh", "exp": exp}, JWT_SECRET, algorithm=JWT_ALG)

def decode_access_token(token: str) -> dict:
    from fastapi import HTTPException
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALG])
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")

    if payload.get("type") != "access":
        raise HTTPException(status_code=401, detail="Not an access token")

    return payload
