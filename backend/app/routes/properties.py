from fastapi import APIRouter, Depends, HTTPException, Query
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
        title=payload.title.strip(),
        description=payload.description,

        transaction_type=payload.transaction_type,

        city=payload.city,
        district=payload.district,
        street=payload.street,

        currency=payload.currency,
        price=payload.price,

        area_sqm=payload.area_sqm,

        rooms=payload.rooms,
        bedrooms=payload.bedrooms,
        bathrooms=payload.bathrooms,

        floor=payload.floor,
        total_floors=payload.total_floors,
        not_first_floor=payload.not_first_floor,

        condition=payload.condition,

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
        .where(Property.owner_id == current_user.id)
        .order_by(Property.id.desc())
    )
    return list(res.scalars().all())


# ✅ IMPORTANT: search MUST be above /{property_id}
@router.get("/search", response_model=list[PropertyResponse])
async def search_properties(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),

    transaction_type: str | None = Query(default=None),
    city: str | None = Query(default=None),
    district: str | None = Query(default=None),
    street: str | None = Query(default=None),

    currency: str | None = Query(default=None),
    min_price: float | None = Query(default=None),
    max_price: float | None = Query(default=None),

    min_area: float | None = Query(default=None),
    max_area: float | None = Query(default=None),

    rooms: int | None = Query(default=None),
    bedrooms: int | None = Query(default=None),
    bathrooms: int | None = Query(default=None),

    floor: int | None = Query(default=None),
    total_floors: int | None = Query(default=None),
    not_first_floor: bool | None = Query(default=None),

    condition: str | None = Query(default=None),

    q: str | None = Query(default=None, description="search in title"),
):
    stmt = select(Property).where(Property.owner_id == current_user.id)

    if transaction_type:
        stmt = stmt.where(Property.transaction_type == transaction_type)

    if city:
        stmt = stmt.where(Property.city.ilike(f"%{city}%"))
    if district:
        stmt = stmt.where(Property.district.ilike(f"%{district}%"))
    if street:
        stmt = stmt.where(Property.street.ilike(f"%{street}%"))

    if currency:
        stmt = stmt.where(Property.currency == currency)

    if min_price is not None:
        stmt = stmt.where(Property.price >= min_price)
    if max_price is not None:
        stmt = stmt.where(Property.price <= max_price)

    if min_area is not None:
        stmt = stmt.where(Property.area_sqm >= min_area)
    if max_area is not None:
        stmt = stmt.where(Property.area_sqm <= max_area)

    if rooms is not None:
        stmt = stmt.where(Property.rooms == rooms)
    if bedrooms is not None:
        stmt = stmt.where(Property.bedrooms == bedrooms)
    if bathrooms is not None:
        stmt = stmt.where(Property.bathrooms == bathrooms)

    if floor is not None:
        stmt = stmt.where(Property.floor == floor)
    if total_floors is not None:
        stmt = stmt.where(Property.total_floors == total_floors)

    if not_first_floor is not None:
        stmt = stmt.where(Property.not_first_floor == not_first_floor)

    if condition:
        stmt = stmt.where(Property.condition == condition)

    if q:
        stmt = stmt.where(Property.title.ilike(f"%{q}%"))

    stmt = stmt.order_by(Property.id.desc())
    res = await db.execute(stmt)
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
            Property.owner_id == current_user.id,
        )
    )
    prop = res.scalar_one_or_none()
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")
    return prop
