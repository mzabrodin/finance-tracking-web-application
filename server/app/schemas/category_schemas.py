"""Represents the schema for category management, including validation rules."""

from pydantic import BaseModel, constr
from typing import Optional


class CategoryCreateSchema(BaseModel):
    """Schema for creating a new category."""
    name: constr(min_length=3, max_length=20)
    description: Optional[constr(min_length=3, max_length=200)] = None


class CategoryUpdateSchema(BaseModel):
    """Schema for updating an existing category."""
    name: Optional[constr(min_length=3, max_length=20)] = None
    description: Optional[constr(min_length=3, max_length=200)] = None
