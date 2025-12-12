from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
from app.core.security import hash_password, verify_password, create_access_token, create_refresh_token

router = APIRouter(prefix="/auth", tags=["auth"])

# TEMP in-memory users store (DB ???? ??????)
# key: email
_USERS = {}

class RegisterIn(BaseModel):
    email: EmailStr
    password: str
    role: str  # buyer/seller/investor/agent/admin
    full_name: str | None = None

class LoginIn(BaseModel):
    email: EmailStr
    password: str

@router.post("/register")
def register(data: RegisterIn):
    email = data.email.lower()
    if email in _USERS:
        raise HTTPException(status_code=400, detail="User already exists")

    _USERS[email] = {
        "email": email,
        "password_hash": hash_password(data.password),
        "role": data.role.lower(),
        "full_name": data.full_name,
    }
    return {"ok": True}

@router.post("/login")
def login(data: LoginIn):
    email = data.email.lower()
    user = _USERS.get(email)
    if not user or not verify_password(data.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    access = create_access_token(sub=email)
    refresh = create_refresh_token(sub=email)

    return {
        "access_token": access,
        "refresh_token": refresh,
        "token_type": "bearer",
        "role": user["role"],
    }

@router.post("/refresh")
def refresh():
    # ?????? ??????? ?????????? ???? refresh flow-? (refresh token validate)
    return {"todo": "refresh validate token"}
