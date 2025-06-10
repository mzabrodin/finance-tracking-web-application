"""Represents the schema for budget management, including validation rules."""

from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel, Field, model_validator, field_validator, constr


class BudgetSchema(BaseModel):
    """Schema for budget management with validation rules."""
    name: constr(min_length=3, max_length=30)
    initial: float = Field(..., ge=0, le=100_000_000)
    current: float = Field(None, ge=0, le=100_000_000)
    goal: Optional[float] = Field(None, ge=0, le=100_000_000)
    created_at: date = Field(default_factory=date.today)
    end_at: Optional[date] = None

    @model_validator(mode='before')
    @classmethod
    def set_current_default(cls, values):
        """Set default value for 'current' if not provided."""
        if 'current' not in values or values['current'] is None:
            values['current'] = values.get('initial')
        return values

    @model_validator(mode='after')
    def validate_constraints(self):
        """Validate constraints after all fields are set."""
        if (self.goal is not None and self.end_at is None) or (self.end_at is not None and self.goal is None):
            raise ValueError("Both 'goal' and 'end_at' must be provided together")

        if self.current is None:
            self.current = self.initial

        if self.goal is not None and self.goal < self.current:
            raise ValueError("Goal amount must be greater than or equal to current amount")

        if self.end_at is not None:
            if self.end_at < self.created_at:
                raise ValueError("End date must be greater than or equal to creation date")
            if self.end_at < date.today():
                raise ValueError("End date must be in the future or today")

        return self

    @field_validator('created_at', 'end_at', mode='before')
    @classmethod
    def ensure_date(cls, v):
        """Ensure that the value is a date object or a valid ISO date string."""
        if v is None:
            return v
        if isinstance(v, datetime):
            return v.date()
        if isinstance(v, str):
            return datetime.fromisoformat(v).date()
        return v
