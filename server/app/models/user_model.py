from sqlalchemy import CheckConstraint, BigInteger, Column, Text, text

from app.utils.extensions import db, bcrypt
from sqlalchemy.dialects.postgresql import ENUM

user_type_enum = ENUM('default', 'premium', 'admin', name='user_type', create_type=False)


class User(db.Model):
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
        self.username = username
        self.email = email
        self.set_password(password)
        self.type = user_type

    def set_password(self, password):
        self.password_hash = bcrypt.generate_password_hash(password).decode('utf-8')

    def check_password(self, password):
        return bcrypt.check_password_hash(self.password_hash, password)

    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'type': self.type
        }

    def update_from_dict(self, data):
        for key, value in data.items():
            if hasattr(self, key):
                setattr(self, key, value)
