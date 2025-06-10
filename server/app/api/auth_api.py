"""API for authentication operations such as registration, login, logout, and password change."""
from typing import Any

from flask import Blueprint, request, make_response, Response
from flask_jwt_extended import create_access_token, set_access_cookies, unset_jwt_cookies, get_jwt_identity
from pydantic import ValidationError
from sqlalchemy.exc import SQLAlchemyError

from app.models.user_model import User
from app.schemas.user_schemas import UserRegisterSchema, UserLoginSchema, UserChangePasswordSchema
from app.utils.decorators import logged_in_required
from app.utils.extensions import db, jwt
from app.utils.responses import create_response

auth = Blueprint('auth', __name__)
"""Authentication API Blueprint."""


@jwt.additional_claims_loader
def add_claims_to_jwt(identity: str) -> dict[str, Any] | dict:
    """Add additional claims to the JWT token.

    Args:
        identity (str): The identity of the user, typically the user ID.

    Returns:
        dict[str, Any] | dict: A dictionary containing the user type.
    """
    user = User.query.get(identity)
    if user:
        return {'user_type': user.type}
    return {}


@auth.route('/register', methods=('POST',))
def register() -> tuple[Response, int] | Response:
    """Endpoint for user registration.

    This endpoint allows new users to register by providing a username, email, password, and user type.

    Provided data should be in JSON format with the following fields:
        - username (str): The desired username for the new user, must be unique and be in the range of 3 to 50 characters.
        - email (str): The email address of the new user, must be a valid email format and unique.
        - password (str): The password for the new user, must be at least 8 characters long.
        - user_type (str): The type of user (e.g., 'admin', 'user'), default is 'user'.

    Returns:
        tuple[Response, int] | Response: A response object with a status code and message indicating the result of the registration attempt.
    """
    data = request.get_json()
    if not data:
        return create_response(
            status_code=400,
            message='No input data provided'
        )

    try:
        validated_data = UserRegisterSchema(**data)
    except ValidationError as e:
        return create_response(
            status_code=400,
            message='Invalid input',
            details=e.errors()
        )
    except Exception as e:
        return create_response(
            status_code=500,
            message='Internal server error',
            details=str(e)
        )

    existing_user = User.query.filter(
        (User.email == validated_data.email) | (User.username == validated_data.username)).first()
    if existing_user:
        if existing_user.email == validated_data.email:
            return create_response(
                status_code=400,
                message='User with this email already exists'
            )
        if existing_user.username == validated_data.username:
            return create_response(
                status_code=400,
                message='User with this username already exists'
            )

    try:
        user = User(
            username=validated_data.username,
            email=validated_data.email,
            password=validated_data.password,
            user_type=validated_data.user_type
        )
        db.session.add(user)
        db.session.commit()
    except SQLAlchemyError as e:
        db.session.rollback()
        return create_response(
            status_code=500,
            message='Database error',
            details=str(e)
        )

    access_token = create_access_token(identity=str(user.id))
    response = make_response(create_response(
        status_code=201,
        message='User registered successfully, logged in',
        data=user.to_dict()
    ))
    set_access_cookies(response, access_token)
    return response


@auth.route('/login', methods=('POST',))
def login() -> tuple[Response, int] | Response:
    """Endpoint for user login.

    This endpoint allows users to log in by providing their email and password.

    Provided data should be in JSON format with the following fields:
        - email (str): The email address of the user, must be a valid email format.
        - password (str): The password for the user, must match the registered password.

    Returns:
        tuple[Response, int] | Response: A response object with a status code and message indicating the result of the login attempt.
    """
    data = request.get_json()
    if not data:
        return create_response(
            status_code=400,
            message='No input data provided'
        )

    try:
        validated_data = UserLoginSchema(**data)
    except ValidationError as e:
        return create_response(
            status_code=400,
            message='Invalid input',
            details=e.errors()
        )
    except Exception as e:
        return create_response(
            status_code=500,
            message='Internal server error',
            details=str(e)
        )

    user = User.query.filter_by(email=validated_data.email).first()
    if not user or not user.check_password(validated_data.password):
        return create_response(
            status_code=401,
            message='Invalid email or password'
        )

    access_token = create_access_token(identity=str(user.id))
    response = make_response(create_response(
        status_code=200,
        message='Login successful',
        data=user.to_dict()
    ))
    set_access_cookies(response, access_token)

    return response


@auth.route('/logout', methods=('POST',))
@logged_in_required
def logout():
    """Endpoint for user logout.

    Removes the JWT token from the user's cookies, effectively logging them out.

    Returns:
        Response: A response object indicating the logout was successful.
    """
    response = make_response(create_response(
        status_code=200,
        message='Logout successful')
    )
    unset_jwt_cookies(response)
    return response


@auth.route('/change_password', methods=('POST',))
@logged_in_required
def change_password() -> tuple[Response, int] | Response:
    """Endpoint for changing user password.

    This endpoint allows logged-in users to change their password.

    Provided data should be in JSON format with the following field:
        - new_password (str): The new password for the user, must be at least 8 characters long.

    Returns:
        tuple[Response, int] | Response: A response object with a status code and message indicating the result of the password change attempt.
    """
    user_id = get_jwt_identity()
    user = User.query.get(user_id)

    data = request.get_json()
    if not data:
        return create_response(
            status_code=400,
            message='No input data provided'
        )

    try:
        validated_data = UserChangePasswordSchema(**data)
    except ValidationError as e:
        return create_response(
            status_code=400,
            message='Invalid input',
            details=e.errors())
    except Exception as e:
        return create_response(
            status_code=500,
            message='Internal server error',
            details=str(e)
        )

    if user.check_password(validated_data.new_password):
        return create_response(
            status_code=400,
            message='New password cannot be the same as the old password'
        )

    try:
        user.set_password(validated_data.new_password)
        db.session.commit()
    except SQLAlchemyError as e:
        db.session.rollback()
        return create_response(
            status_code=500,
            message='Database error',
            details=str(e)
        )

    response = make_response(create_response(
        status_code=200,
        message='Password changed successfully, please log in again'
    ))
    unset_jwt_cookies(response)
    return response
