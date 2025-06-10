"""Represent db.Model for User table."""

from sqlalchemy import CheckConstraint, BigInteger, Column, Text, text

from app.utils.extensions import db, bcrypt
from sqlalchemy.dialects.postgresql import ENUM

user_type_enum = ENUM('default', 'premium', 'admin', name='user_type', create_type=False)
"""User type enum for categorizing users as default, premium, or admin."""


class User(db.Model):
    """Represents the User table in the database with all constraints and relationships."""
    __tablename__ = 'user'
    __table_args__ = (
        CheckConstraint("char_length(username) > 2 AND char_length(username) <= 50",
                        name="user_username_length_check"),
        CheckConstraint("char_length(email) > 0 AND char_length(email) <= 100",
                        name="user_email_length_check"),
        CheckConstraint("char_length(password_hash) > 0",
                        name="user_password_hash_length_check"),
        {'schema': 'public'}
    )

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    username = Column(Text, nullable=False, unique=True)
    email = Column(Text, nullable=False, unique=True)
    password_hash = Column(Text, nullable=False)
    type = Column(user_type_enum, nullable=False, server_default=text('default'))

    def __init__(self, username, email, password, user_type='default'):
        """Initializes a User instance with username, email, password, and user type."""
        self.username = username
        self.email = email
        self.set_password(password)
        self.type = user_type

    def set_password(self, password):
        """Sets the password for the user by hashing it."""
        self.password_hash = bcrypt.generate_password_hash(password).decode('utf-8')

    def check_password(self, password):
        """Checks if the provided password matches the stored password hash."""
        return bcrypt.check_password_hash(self.password_hash, password)

    def to_dict(self):
        """Converts the User instance to a dictionary representation."""
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'type': self.type
        }
