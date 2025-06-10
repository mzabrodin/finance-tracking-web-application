"""Represents the schema for transactions in the application."""

from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, Field, constr


class TransactionSchema(BaseModel):
    """Schema for a financial transaction."""
    amount: float = Field(..., ge=0, le=1_000_000)
    description: Optional[constr(min_length=3, max_length=200)] = None
    created_at: datetime = Field(default_factory=datetime.now)
    type: Literal['income', 'expense']
