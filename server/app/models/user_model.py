from app.utils.extensions import db
from sqlalchemy.dialects.postgresql import ENUM
from app.utils.extensions import bcrypt

user_type_enum = ENUM('default', 'premium', 'admin', name='user_type', create_type=False)


class User(db.Model):
    __tablename__ = 'User'
    __table_args__ = (
        db.CheckConstraint("length(username) > 2 AND length(username) <= 50", name="user_username_length_check"),
        db.CheckConstraint("length(email) > 0 AND length(email) <= 100", name="user_email_length_check"),
        db.CheckConstraint("length(password_hash) > 0", name="user_password_hash_length_check"),
        {'schema': 'public'}
    )

    id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    username = db.Column(db.Text, nullable=False, unique=True)
    email = db.Column(db.Text, nullable=False, unique=True)
    password_hash = db.Column(db.Text, nullable=False)
    type = db.Column(user_type_enum, nullable=False, server_default='default')

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
