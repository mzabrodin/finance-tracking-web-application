import os
from dotenv import load_dotenv

load_dotenv()


class Config:
    SECRET_KEY = os.getenv('FLASK_SECRET_KEY', 'dev')
    DEBUG = os.getenv('DEBUG', '0') == '1'
    FLASK_DEBUG = os.getenv('FLASK_DEBUG', '0') == '1'
    FLASK_ENV = os.getenv('FLASK_ENV', 'development')

    SQLALCHEMY_DATABASE_URI = os.getenv('SQLALCHEMY_DATABASE_URI')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {
        'pool_pre_ping': True,
        'pool_recycle': 300,
    }

    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY')
    JWT_ACCESS_TOKEN_EXPIRES = int(os.getenv('JWT_ACCESS_TOKEN_EXPIRES', '3600'))
    JWT_TOKEN_LOCATION = [os.getenv('JWT_TOKEN_LOCATION')]
    JWT_ACCESS_COOKIE_PATH = os.getenv('JWT_ACCESS_COOKIE_PATH')
    JWT_COOKIE_SECURE = not DEBUG
    JWT_COOKIE_CSRF_PROTECT = os.getenv('JWT_COOKIE_CSRF_PROTECT', '0') == '1'
    JWT_COOKIE_SAMESITE = os.getenv('JWT_COOKIE_SAMESITE')

    BCRYPT_LOG_ROUNDS = int(os.getenv('BCRYPT_LOG_ROUNDS', '12'))
