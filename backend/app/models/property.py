from sqlalchemy import Column, Integer, String, Float, Text, ForeignKey

from app.models.base import Base


class Property(Base):
    __tablename__ = "properties"

    id = Column(Integer, primary_key=True, index=True)

    title = Column(String(255), nullable=False)
    city = Column(String(120), nullable=True)
    price = Column(Float, nullable=True)
    description = Column(Text, nullable=True)

    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
