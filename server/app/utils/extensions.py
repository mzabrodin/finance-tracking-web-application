from flask_jwt_extended import JWTManager
from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt

from app.utils.responses import create_response

db = SQLAlchemy()
jwt = JWTManager()
bcrypt = Bcrypt()


@jwt.unauthorized_loader
def custom_unauthorized_response(callback):
    return create_response(
        status_code=401,
        message='Authorization token is missing or invalid',
        details=callback
    )


@jwt.invalid_token_loader
def custom_invalid_token_response(reason):
    return create_response(
        status_code=422,
        message='Invalid JWT token',
        details=reason
    )


@jwt.expired_token_loader
def custom_expired_token_response(jwt_header, jwt_payload):
    return create_response(
        status_code=401,
        message='Token has expired'
    )
