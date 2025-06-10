"""Extensions methods for Flask application."""
from flask import Response
from flask_jwt_extended import JWTManager
from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt

from app.utils.responses import create_response

db = SQLAlchemy()
"""Database instance for the Flask application."""
jwt = JWTManager()
"""JWT Manager instance for handling JSON Web Tokens."""
bcrypt = Bcrypt()
"""Bcrypt instance for hashing passwords."""


@jwt.unauthorized_loader
def custom_unauthorized_response(callback) -> tuple[Response, int]:
    """Creates a custom response for unauthorized access.

    Args:
        callback: The callback function that triggered the unauthorized access.

    Returns:
        tuple[Response, int]: A tuple containing the JSON response and the HTTP status code.

    """
    return create_response(
        status_code=401,
        message='Authorization token is missing or invalid',
        details=callback
    )


@jwt.invalid_token_loader
def custom_invalid_token_response(reason) -> tuple[Response, int]:
    """Creates a custom response for invalid JWT tokens.

    Args:
        reason: The reason why the token is considered invalid.

    Returns:
        tuple[Response, int]: A tuple containing the JSON response and the HTTP status code.
    """
    return create_response(
        status_code=422,
        message='Invalid JWT token',
        details=reason
    )


@jwt.expired_token_loader
def custom_expired_token_response(jwt_header, jwt_payload) -> tuple[Response, int]:
    """Creates a custom response for expired JWT tokens.

    Args:
        jwt_header: The header of the expired JWT token.
        jwt_payload: The payload of the expired JWT token.

    Returns:
        tuple[Response, int]: A tuple containing the JSON response and the HTTP status code.
    """
    return create_response(
        status_code=401,
        message='Token has expired'
    )
