"""Represents schemas for various financial calculations, including savings, credit, pension, FOP tax, and balance forecasting."""

from pydantic import BaseModel, Field
from typing import Literal, Optional

class SavingsSchema(BaseModel):
    """Schema for savings calculation with validation rules."""
    initial_sum: float = Field(..., ge=0, description="Initial savings amount")
    term_months: int = Field(..., ge=1, le=120, description="Term in months")
    annual_rate: float = Field(..., ge=0, le=100, description="Annual interest rate")

class CreditSchema(BaseModel):
    """Schema for credit calculation with validation rules."""
    principal: float = Field(..., ge=1, description="The total amount of the credit")
    annual_rate: float = Field(..., ge=0, le=100, description="Annual interest rate")
    term_months: int = Field(..., ge=1, description="Credit term in months")

class PensionSchema(BaseModel):
    """Schema for pension calculation with validation rules."""
    initial_sum: float = Field(default=0, ge=0, description="Initial savings amount")
    monthly_contribution: float = Field(..., ge=0, description="Regular monthly contribution")
    annual_rate: float = Field(..., ge=0, le=100, description="Average annual rate of return")
    term_years: int = Field(..., ge=1, le=60, description="Term of accumulation in years")

class TaxFopSchema(BaseModel):
    """Schema for FOP tax calculation with validation rules."""
    income: float = Field(..., ge=0, description="Total income amount")
    tax_group: Literal[3, 5] = Field(..., description="Tax group for FOP (3 or 5)")
    unified_social_contribution: Optional[float] = Field(None, ge=0, description="Unified Social Contribution amount (optional)")

class BalanceForecastSchema(BaseModel):
    """Schema for balance forecasting with validation rules."""
    forecast_months: int = Field(..., ge=1, le=120, description="Number of months for the forecast")