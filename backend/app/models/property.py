from sqlalchemy import Column, Integer, String, Float, Text, ForeignKey, Boolean

from app.models.base import Base


class Property(Base):
    __tablename__ = "properties"

    id = Column(Integer, primary_key=True, index=True)

    # Basic Filters (Must-Have)
    transaction_type = Column(String(20), nullable=True)  # buy / rent / daily_rent

    city = Column(String(120), nullable=True)
    district = Column(String(120), nullable=True)
    street = Column(String(180), nullable=True)

    currency = Column(String(10), nullable=True)  # GEL / USD
    price = Column(Float, nullable=True)          # numeric value in selected currency

    area_sqm = Column(Float, nullable=True)

    rooms = Column(Integer, nullable=True)        # total rooms
    bedrooms = Column(Integer, nullable=True)
    bathrooms = Column(Integer, nullable=True)

    floor = Column(Integer, nullable=True)
    total_floors = Column(Integer, nullable=True)
    not_first_floor = Column(Boolean, nullable=True)  # quick filter helper (optional)

    condition = Column(String(50), nullable=True)  # black_frame/white_frame/green_frame/old_renov/new_renov

    # Existing / MVP fields
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)

    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
