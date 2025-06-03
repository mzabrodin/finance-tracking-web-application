from flask import Blueprint, request, jsonify, make_response
from flask_jwt_extended import create_access_token, set_access_cookies, unset_jwt_cookies, jwt_required, \
    get_jwt_identity, get_jwt
from pydantic import ValidationError
from sqlalchemy.exc import SQLAlchemyError

from app.models.user_model import User
from app.schemas.user_schemas import UserRegisterSchema, UserLoginSchema, UserChangePasswordSchema
from app.utils.decorators import logged_in_required
from app.utils.extensions import db, jwt
from app.utils.responses import create_response

auth = Blueprint('auth', __name__)


@jwt.additional_claims_loader
def add_claims_to_jwt(identity):
    user = User.query.get(identity)
    if user:
        return {'user_type': user.type}
    return {}


@auth.route('/register', methods=('POST',))
def register():
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
def login():
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
    response = make_response(create_response(
        status_code=200,
        message='Logout successful')
    )
    unset_jwt_cookies(response)
    return response


@auth.route('/change_password', methods=('POST',))
@logged_in_required
def change_password():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user:
        return create_response(
            status_code=404,
            message='User not found'
        )

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
