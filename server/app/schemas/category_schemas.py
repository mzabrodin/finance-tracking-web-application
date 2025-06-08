from pydantic import BaseModel, constr
from typing import Optional


class CategoryCreateSchema(BaseModel):
    name: constr(min_length=3, max_length=20)
    description: Optional[constr(min_length=3, max_length=200)] = None


class CategoryUpdateSchema(BaseModel):
    name: Optional[constr(min_length=3, max_length=20)] = None
    description: Optional[constr(min_length=3, max_length=200)] = None
