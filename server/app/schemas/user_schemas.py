"""Represents schemas for user registration, login, and updates."""

from pydantic import BaseModel, EmailStr, constr
from typing import Literal, Optional


class UserRegisterSchema(BaseModel):
    """Schema for user registration."""
    username: constr(min_length=3, max_length=50)
    email: EmailStr
    password: constr(min_length=8)
    user_type: Literal['default', 'premium', 'admin'] = 'default'


class UserLoginSchema(BaseModel):
    """Schema for user login."""
    email: EmailStr
    password: str


class UserChangePasswordSchema(BaseModel):
    """Schema for changing user password."""
    new_password: constr(min_length=8)


class UserUpdateSchema(BaseModel):
    """Schema for updating user information."""
    username: Optional[constr(min_length=3, max_length=50)] = None
    email: Optional[EmailStr] = None
    user_type: Optional[Literal['default', 'premium', 'admin']] = None
