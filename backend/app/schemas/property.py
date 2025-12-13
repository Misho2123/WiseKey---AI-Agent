from pydantic import BaseModel
from typing import Optional


class PropertyCreate(BaseModel):
    title: str
    city: Optional[str] = None
    price: Optional[float] = None
    description: Optional[str] = None


class PropertyResponse(BaseModel):
    id: int
    title: str
    city: Optional[str] = None
    price: Optional[float] = None
    description: Optional[str] = None
    owner_id: int

    class Config:
        from_attributes = True
