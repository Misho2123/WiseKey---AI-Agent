from pydantic import BaseModel
from typing import Optional


class PropertyCreate(BaseModel):
    # required for MVP
    title: str

    # Basic Filters (Must-Have)
    transaction_type: Optional[str] = None  # buy / rent / daily_rent

    city: Optional[str] = None
    district: Optional[str] = None
    street: Optional[str] = None

    currency: Optional[str] = None  # GEL / USD
    price: Optional[float] = None

    area_sqm: Optional[float] = None

    rooms: Optional[int] = None
    bedrooms: Optional[int] = None
    bathrooms: Optional[int] = None

    floor: Optional[int] = None
    total_floors: Optional[int] = None
    not_first_floor: Optional[bool] = None

    condition: Optional[str] = None  # black_frame/white_frame/green_frame/old_renov/new_renov

    # Comfort / Infrastructure
    building_type: Optional[str] = None
    heating_type: Optional[str] = None
    has_air_conditioning: Optional[bool] = None

    parking_type: Optional[str] = None
    has_balcony: Optional[bool] = None
    pets_allowed: Optional[bool] = None
    furnished: Optional[str] = None


    description: Optional[str] = None


class PropertyResponse(BaseModel):
    id: int

    title: str

    transaction_type: Optional[str] = None

    city: Optional[str] = None
    district: Optional[str] = None
    street: Optional[str] = None

    currency: Optional[str] = None
    price: Optional[float] = None

    area_sqm: Optional[float] = None

    rooms: Optional[int] = None
    bedrooms: Optional[int] = None
    bathrooms: Optional[int] = None

    floor: Optional[int] = None
    total_floors: Optional[int] = None
    not_first_floor: Optional[bool] = None

    condition: Optional[str] = None

    # Comfort / Infrastructure
    building_type: Optional[str] = None
    heating_type: Optional[str] = None
    has_air_conditioning: Optional[bool] = None

    parking_type: Optional[str] = None
    has_balcony: Optional[bool] = None
    pets_allowed: Optional[bool] = None
    furnished: Optional[str] = None


    description: Optional[str] = None
    owner_id: int

    class Config:
        from_attributes = True
