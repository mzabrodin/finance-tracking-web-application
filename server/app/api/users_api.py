"""API endpoints for managing users."""

from flask import Blueprint, make_response, request, Response
from flask_jwt_extended import get_jwt_identity, unset_jwt_cookies, get_jwt
from pydantic import ValidationError
from sqlalchemy.exc import SQLAlchemyError

from app.models.user_model import User
from app.schemas.user_schemas import UserUpdateSchema
from app.utils.decorators import logged_in_required
from app.utils.extensions import db
from app.utils.responses import create_response

users = Blueprint('users', __name__)
"""Blueprint for user-related API endpoints."""


@users.route('/me', methods=('GET',))
@logged_in_required
def get_current_user() -> tuple[Response, int] | Response:
    """Retrieve the current user's information.

    This endpoint returns the details of the currently authenticated user.

    Returns:
        Response: A response object containing the user's information or an error message.
    """
    user_id = get_jwt_identity()
    user = User.query.get(user_id)

    claims = get_jwt()
    user_type = claims.get('user_type', None)
    if user.type == user_type:
        return create_response(
            status_code=200,
            message='User retrieved successfully',
            data=user.to_dict()
        )
    else:
        response = make_response(create_response(
            status_code=403,
            message='Forbidden: User type mismatch')
        )
        unset_jwt_cookies(response)
        return response


@users.route('/', methods=('PUT',))
@logged_in_required
def update_current_user() -> tuple[Response, int]:
    """Update the current user's information.

    This endpoint allows the authenticated user to update their profile information.

    Provided data should be in JSON format with the following fields:
        - username (str, optional): The new username for the user.
        - email (str, optional): The new email address for the user.
        - user_type (str, optional): The new user type (default, premium, admin).

    Restrictions:
        - The email and username must be unique across all users.
        - If no changes are made, an error is returned.

    Returns:
        tuple[Response, int]: A tuple containing the response object and the HTTP status code.
    """
    user_id = get_jwt_identity()
    user = User.query.get(user_id)

    data = request.get_json()
    if not data:
        return create_response(
            status_code=400,
            message='No data provided for update'
        )

    try:
        validated_data = UserUpdateSchema(**data)
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
        ((User.email == validated_data.email) | (User.username == validated_data.username)),
        User.id != user_id
    ).first()
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

    update_data = validated_data.model_dump(exclude_unset=True)
    no_changes = True
    for key, value in update_data.items():
        if getattr(user, key) != value:
            no_changes = False
            break

    if no_changes:
        return create_response(
            status_code=400,
            message='In one or more fields, no changes were made',
        )

    try:
        for key, value in update_data.items():
            setattr(user, key, value)
        db.session.commit()
    except SQLAlchemyError as e:
        db.session.rollback()
        return create_response(
            status_code=500,
            message='Database error',
            details=str(e)
        )

    return create_response(
        status_code=200,
        message='User updated successfully',
        data=user.to_dict()
    )
