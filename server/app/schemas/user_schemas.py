from pydantic import BaseModel, EmailStr, constr
from typing import Literal


class UserRegisterSchema(BaseModel):
    username: constr(min_length=3, max_length=50)
    email: EmailStr
    password: constr(min_length=8)
    user_type: Literal['default', 'premium', 'admin'] = 'default'


class UserLoginSchema(BaseModel):
    email: EmailStr
    password: str


class UserPasswordUpdateSchema(BaseModel):
    new_password: constr(min_length=8)
