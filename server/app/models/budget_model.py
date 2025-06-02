from datetime import date

from app.utils.extensions import db
from sqlalchemy import CheckConstraint, ForeignKey, Column


class Budget(db.Model):
    __tablename__ = 'Budget'
    __table_args__ = (
        db.CheckConstraint('goal >= 0 AND goal <= 100000000', name='budget_goal_check'),
        db.CheckConstraint('initial >= 0 AND initial <= 100000000', name='budget_initial_check'),
        db.CheckConstraint('current >= 0 AND current <= 100000000', name='budget_current_check'),
        db.CheckConstraint('goal >= current', name='budget_valid_amounts'),
        db.CheckConstraint('end_at IS NULL OR end_at >= created_at', name='budget_end_after_created'),
        db.CheckConstraint('end_at IS NULL OR end_at >= CURRENT_DATE', name='budget_end_in_future'),
        {'schema': 'public'}
    )

    id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    user_id = db.Column(db.BigInteger, db.ForeignKey('public."User".id', onupdate="CASCADE", ondelete="CASCADE"),
                        nullable=False)
    initial = db.Column(db.Float, nullable=False)
    current = db.Column(db.Float, nullable=False)
    goal = db.Column(db.Float, nullable=True)
    created_at = db.Column(db.Date, nullable=False, default=date.today)
    end_at = db.Column(db.Date, nullable=True)

    user = db.relationship('User', backref='budgets')

    def to_dict(self):
        result = {
            'id': self.id,
            'user_id': self.user_id,
            'initial': self.initial,
            'current': self.current,
            'created_at': self.created_at.isoformat(),
        }
        if self.goal is not None:
            result['goal'] = self.goal
        if self.end_at is not None:
            result['end_at'] = self.end_at.isoformat()
        return result
