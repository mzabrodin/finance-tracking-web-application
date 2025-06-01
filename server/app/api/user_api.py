from flask import Blueprint, make_response, request
from flask_jwt_extended import get_jwt_identity, unset_jwt_cookies, get_jwt
from pydantic import ValidationError
from sqlalchemy.exc import SQLAlchemyError

from app.models.user_model import User
from app.schemas.user_schemas import UserUpdateSchema
from app.utils.decorators import logged_in_required
from app.utils.extensions import db
from app.utils.responses import create_response

users = Blueprint('users', __name__)


@users.route('/me', methods=('GET',))
@logged_in_required
def get_current_user():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user:
        response = make_response(create_response(
            status_code=404,
            message='User not found'
        ))
        unset_jwt_cookies(response)
        return response

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


@users.route('/update', methods=('PUT',))
@logged_in_required
def update_current_user():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user:
        response = make_response(create_response(
            status_code=404,
            message='User not found'
        ))
        unset_jwt_cookies(response)
        return response

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
            message='No changes detected to update'
        )

    try:
        user.update_from_dict(update_data)
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
