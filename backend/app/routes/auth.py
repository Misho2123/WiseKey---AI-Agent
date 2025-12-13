from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models.user import User
from app.core.security import hash_password, verify_password, create_access_token
from app.schemas.auth import RegisterRequest, LoginRequest, TokenResponse

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=TokenResponse)
async def register(payload: RegisterRequest, db: AsyncSession = Depends(get_db)):
    email = payload.email.lower().strip()

    # check if user exists
    res = await db.execute(select(User).where(User.email == email))
    existing = res.scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=400, detail="User already exists")

    user = User(
        email=email,
        hashed_password=hash_password(payload.password),
        full_name=payload.full_name.strip(),
        # role has default="buyer" in model, so we don't need to pass it (Variant A)
    )

    db.add(user)
    await db.commit()
    await db.refresh(user)

    # IMPORTANT: use user.id as sub (stable), not email
    access = create_access_token(sub=str(user.id))
    return TokenResponse(access_token=access)


@router.post("/login", response_model=TokenResponse)
async def login(payload: LoginRequest, db: AsyncSession = Depends(get_db)):
    email = payload.email.lower().strip()

    res = await db.execute(select(User).where(User.email == email))
    user = res.scalar_one_or_none()

    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
        )

    access = create_access_token(sub=str(user.id))
    return TokenResponse(access_token=access)
