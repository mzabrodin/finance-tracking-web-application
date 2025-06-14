"""Represents db.Model for the transaction table."""

from sqlalchemy import (Numeric, CheckConstraint, Column, BigInteger, ForeignKey, Text, DateTime, func)
from sqlalchemy.dialects.postgresql import ENUM

from app.utils.extensions import db

transaction_type_enum = ENUM('income', 'expense', name='transaction_type', create_type=False)
"""Transaction type enum for categorizing transactions as income or expense."""


class Transaction(db.Model):
    """Represents the transaction table in the database with all constraints and relationships."""
    __tablename__ = 'transaction'
    __table_args__ = (
        CheckConstraint("amount >= 0 AND amount <= 1000000", name="transaction_amount_check"),
        CheckConstraint(
            "description IS NULL OR (char_length(description) > 2 AND char_length(description) <= 200)",
            name="transaction_description_length_check"
        ),
        {'schema': 'public'}
    )

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    user_id = Column(BigInteger, ForeignKey('public.user.id', onupdate="CASCADE", ondelete="CASCADE"),
                     nullable=False)
    category_id = Column(BigInteger, ForeignKey('public.category.id', onupdate="CASCADE"),
                         nullable=False)
    budget_id = Column(BigInteger, ForeignKey('public.budget.id', onupdate="CASCADE", ondelete="CASCADE"),
                       nullable=False)
    amount = Column(Numeric(12, 2), nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=False), nullable=False, server_default=func.now())
    type = Column(transaction_type_enum, nullable=False)

    user = db.relationship('User', backref='transactions')
    category = db.relationship('Category', backref='transactions')
    budget = db.relationship('Budget', backref='transactions')

    def to_dict(self):
        """Converts the Transaction instance to a dictionary representation."""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'category_id': self.category_id,
            'budget_id': self.budget_id,
            'amount': float(self.amount) if self.amount is not None else None,
            'description': self.description,
            'created_at': self.created_at.isoformat(),
            'type': self.type
        }
