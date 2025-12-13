from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.routes.users import get_current_user
from app.models.user import User
from app.models.property import Property
from app.schemas.property import PropertyCreate, PropertyResponse

router = APIRouter(prefix="/properties", tags=["properties"])


@router.post("", response_model=PropertyResponse)
async def create_property(
    payload: PropertyCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    prop = Property(
        title=payload.title,
        city=payload.city,
        price=payload.price,
        description=payload.description,
        owner_id=current_user.id,
    )
    db.add(prop)
    await db.commit()
    await db.refresh(prop)
    return prop


@router.get("", response_model=list[PropertyResponse])
async def list_properties(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    res = await db.execute(
        select(Property)
        .where(Property.owner_id == current_user.id)   # ✅ მხოლოდ ჩემი
        .order_by(Property.id.desc())
    )
    return list(res.scalars().all())


@router.get("/{property_id}", response_model=PropertyResponse)
async def get_property(
    property_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    res = await db.execute(
        select(Property).where(
            Property.id == property_id,
            Property.owner_id == current_user.id,      # ✅ მხოლოდ ჩემი
        )
    )
    prop = res.scalar_one_or_none()
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")
    return prop
