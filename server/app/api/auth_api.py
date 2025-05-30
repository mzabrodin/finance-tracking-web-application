from flask import Blueprint, request, jsonify, make_response
from flask_jwt_extended import create_access_token, set_access_cookies, unset_jwt_cookies, jwt_required, \
    get_jwt_identity, get_jwt
from pydantic import ValidationError
from sqlalchemy.exc import SQLAlchemyError

from app.models.user_model import User
from app.schemas.user_schemas import UserRegisterSchema, UserLoginSchema, UserPasswordUpdateSchema
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

    try:
        validated_data = UserRegisterSchema(**data)
    except ValidationError as e:
        return create_response(400, 'Invalid input', details=e.errors())

    existing_user = User.query.filter(
        (User.email == validated_data.email) | (User.username == validated_data.username)).first()
    if existing_user:
        return create_response(400, 'User with this email or username already exists')

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
        return create_response(500, 'Database error', details=e)

    return create_response(201, 'User registered successfully', data=user.to_dict())


@auth.route('/login', methods=('POST',))
def login():
    data = request.get_json()

    try:
        validated_data = UserLoginSchema(**data)
    except ValidationError as e:
        return create_response(400, 'Invalid input', details=str(e))

    user = User.query.filter_by(email=validated_data.email).first()
    if not user or not user.check_password(validated_data.password):
        return create_response(401, 'Invalid email or password')

    access_token = create_access_token(identity=str(user.id))
    response = make_response(create_response(
        200, 'Login successful', data=user.to_dict()
    ))
    set_access_cookies(response, access_token)

    return response


@auth.route('/logout', methods=('POST',))
@jwt_required()
def logout():
    response = make_response(create_response(200, 'Logout successful'))
    unset_jwt_cookies(response)
    return response


@auth.route('/me', methods=('GET',))
@jwt_required()
def get_current_user():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user:
        response = make_response(create_response(404, 'User not found'))
        unset_jwt_cookies(response)
        return response

    claims = get_jwt()
    user_type = claims.get('user_type', None)
    if user.type == user_type:
        return create_response(200, 'User retrieved successfully', data=user.to_dict())
    else:
        response = make_response(create_response(403, 'Forbidden: User type mismatch'))
        unset_jwt_cookies(response)
        return response


@auth.route('/change_password', methods=('POST',))
@jwt_required()
def change_password():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user:
        return create_response(404, 'User not found')

    data = request.get_json()
    try:
        validated_data = UserPasswordUpdateSchema(**data)
    except ValidationError as e:
        return create_response(400, 'Invalid input', details=str(e))

    try:
        user.set_password(validated_data.password)
        db.session.commit()
    except SQLAlchemyError as e:
        db.session.rollback()
        return create_response(500, 'Database error', details=str(e))

    return create_response(200, 'Password changed successfully')
