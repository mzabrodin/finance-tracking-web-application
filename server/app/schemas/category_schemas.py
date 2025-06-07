from pydantic import BaseModel, constr
from typing import Optional

class CategoryCreateSchema(BaseModel):
    name: constr(min_length=1, max_length=30)
    description: Optional[constr(max_length=200)] = None

class CategoryUpdateSchema(BaseModel):
    name: Optional[constr(min_length=1, max_length=30)] = None
    description: Optional[constr(max_length=200)] = None