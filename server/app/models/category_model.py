"""Represents db.Model for the category table."""

from sqlalchemy import (CheckConstraint, Column, BigInteger, ForeignKey, Text)
from sqlalchemy.dialects.postgresql import ENUM
from sqlalchemy.orm import relationship
from app.utils.extensions import db

category_type_enum = ENUM('incomes', 'expenses', name='category_type', create_type=False)
"""Category type enum for categorizing categories as incomes or expenses."""

class Category(db.Model):
    """Represents the category table in the database with all constraints and relationships."""
    __tablename__ = 'category'
    __table_args__ = (
        CheckConstraint("char_length(name) > 2 AND char_length(name) <= 20",
                        name="category_name_length_check"),
        CheckConstraint("description IS NULL OR (char_length(description) > 2 AND char_length(description) <= 200)",
                        name="category_description_length_check"
                        ),
        {'schema': 'public'}
    )

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    user_id = Column(BigInteger, ForeignKey('public.user.id', ondelete="CASCADE"), nullable=False)
    name = Column(Text, nullable=False)
    description = Column(Text, nullable=True)
    type = Column(category_type_enum, nullable=False)

    user = relationship('User', backref='categories')

    def to_dict(self):
        """Converts the Category instance to a dictionary representation."""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'name': self.name,
            'description': self.description,
            'type': self.type
        }
