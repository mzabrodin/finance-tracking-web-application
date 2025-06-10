"""Represents db.Model for the budget table."""

from sqlalchemy import (Numeric, CheckConstraint, Column, BigInteger, ForeignKey, Text, Date, text)
from sqlalchemy.orm import relationship
from app.utils.extensions import db


class Budget(db.Model):
    """Represents the budget table in the database with all constraints and relationships."""
    __tablename__ = 'budget'
    __table_args__ = (
        CheckConstraint("char_length(name) > 2 AND char_length(name) <= 30",
                        name="budget_name_length_check"),
        CheckConstraint('initial >= 0 AND initial <= 100000000',
                        name='budget_initial_check'),
        CheckConstraint('current >= 0 AND current <= 100000000',
                        name='budget_current_check'),
        CheckConstraint('(goal IS NULL OR (goal >= 0 AND goal <= 100000000))',
                        name='budget_goal_check'),
        CheckConstraint('goal IS NULL OR goal >= current',
                        name='budget_valid_amounts'),
        CheckConstraint('(end_at IS NULL OR (end_at > created_at AND end_at > CURRENT_DATE))',
                        name='budget_end_at_check'),
        CheckConstraint('(goal IS NOT NULL AND end_at IS NOT NULL) OR (goal IS NULL AND end_at IS NULL)',
                        name='budget_goal_end_at_check'),
        {'schema': 'public'}
    )

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    user_id = Column(BigInteger, ForeignKey('public.user.id', onupdate="CASCADE", ondelete="CASCADE"),
                     nullable=False)
    name = Column(Text, nullable=False)
    initial = Column(Numeric(12, 2), nullable=False)
    current = Column(Numeric(12, 2), nullable=False)
    goal = Column(Numeric(12, 2), nullable=True)
    created_at = Column(Date, nullable=False, server_default=text('CURRENT_DATE'))
    end_at = Column(Date, nullable=True)

    user = relationship('User', backref='budgets', )

    def to_dict(self):
        """Converts the Budget instance to a dictionary representation."""
        result = {
            'id': self.id,
            'user_id': self.user_id,
            'name': self.name,
            'initial': float(self.initial) if self.initial is not None else None,
            'current': float(self.current) if self.current is not None else None,
            'created_at': self.created_at.isoformat(),
        }
        if self.goal is not None:
            result['goal'] = float(self.goal)
        if self.end_at is not None:
            result['end_at'] = self.end_at.isoformat()
        return result
