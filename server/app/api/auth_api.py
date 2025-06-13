"""API for authentication operations such as registration, login, logout, and password change."""
from typing import Any

from flask import Blueprint, request, make_response, Response
from flask_jwt_extended import create_access_token, set_access_cookies, unset_jwt_cookies, get_jwt_identity
from pydantic import ValidationError
from sqlalchemy.exc import SQLAlchemyError

from app.models.category_model import Category
from app.models.user_model import User
from app.schemas.user_schemas import UserRegisterSchema, UserLoginSchema, UserChangePasswordSchema
from app.utils.decorators import logged_in_required
from app.utils.extensions import db, jwt
from app.utils.responses import create_response

auth = Blueprint('auth', __name__)
"""Authentication API Blueprint."""

DEFAULT_CATEGORIES = [
    {"name": "Зарплата", "description": "Основний дохід від роботи", "type": "incomes"},
    {"name": "Фріланс", "description": "Додатковий дохід від проектів", "type": "incomes"},
    {"name": "Інвестиції", "description": "Прибуток від інвестицій", "type": "incomes"},
    {"name": "Подарунки", "description": "Отримані подарунки та грошові кошти", "type": "incomes"},
    {"name": "Інше", "description": "Інші джерела доходу", "type": "incomes"},

    {"name": "Продукти", "description": "Витрати на їжу та продукти харчування", "type": "expenses"},
    {"name": "Транспорт", "description": "Витрати на транспорт та пальне", "type": "expenses"},
    {"name": "Житло", "description": "Оренда, комунальні послуги", "type": "expenses"},
    {"name": "Здоров'я", "description": "Медичні витрати та ліки", "type": "expenses"},
    {"name": "Розваги", "description": "Кіно, ресторани, хобі", "type": "expenses"},
    {"name": "Одяг", "description": "Витрати на одяг та взуття", "type": "expenses"},
    {"name": "Освіта", "description": "Курси, книги, навчання", "type": "expenses"},
    {"name": "Інше", "description": "Інші витрати", "type": "expenses"}
]
"""Default categories to be created for new users."""


def create_default_categories(user_id: int) -> bool:
    """Create default categories for a new user.

    Args:
        user_id (int): The ID of the user for whom the categories are being created.

    Returns:
        bool: True if execution was successful, False if an error occurred.
    """
    try:
        for category_data in DEFAULT_CATEGORIES:
            category = Category(
                user_id=user_id,
                name=category_data["name"],
                description=category_data["description"],
                type=category_data["type"]
            )
            db.session.add(category)

        db.session.flush()
        return True

    except SQLAlchemyError:
        return False


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
    Additionally, it creates default categories for the new user and a default budget.

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
            message='Не надано даних для реєстрації'
        )

    try:
        validated_data = UserRegisterSchema(**data)
    except ValidationError as e:
        return create_response(
            status_code=400,
            message='Неправильний формат даних',
            details=e.errors()
        )
    except Exception as e:
        return create_response(
            status_code=500,
            message='Помилка сервера',
            details=str(e)
        )

    existing_user = User.query.filter(
        (User.email == validated_data.email) | (User.username == validated_data.username)).first()
    if existing_user:
        if existing_user.email == validated_data.email:
            return create_response(
                status_code=400,
                message='Користувач з цією електронною поштою вже існує'
            )
        if existing_user.username == validated_data.username:
            return create_response(
                status_code=400,
                message='Користувач з цим іменем користувача вже існує'
            )

    try:
        user = User(
            username=validated_data.username,
            email=validated_data.email,
            password=validated_data.password,
            user_type=validated_data.user_type
        )
        db.session.add(user)
        db.session.flush()

        default_records = create_default_categories(user.id)

        if not default_records:
            db.session.rollback()
            return create_response(
                status_code=500,
                message='Помилка створення дефолтних категорій або бюджету'
            )
        db.session.commit()

    except SQLAlchemyError as e:
        db.session.rollback()
        return create_response(
            status_code=500,
            message='Помилка бази даних',
            details=str(e)
        )

    access_token = create_access_token(identity=str(user.id))
    response = make_response(create_response(
        status_code=201,
        message='Користувач успішно зареєстрований',
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
            message='Не надано даних для входу'
        )

    try:
        validated_data = UserLoginSchema(**data)
    except ValidationError as e:
        return create_response(
            status_code=400,
            message='Неправильний формат даних',
            details=e.errors()
        )
    except Exception as e:
        return create_response(
            status_code=500,
            message='Помилка сервера',
            details=str(e)
        )

    user = User.query.filter_by(email=validated_data.email).first()
    if not user or not user.check_password(validated_data.password):
        return create_response(
            status_code=401,
            message='Неправильний email або пароль'
        )

    access_token = create_access_token(identity=str(user.id))
    response = make_response(create_response(
        status_code=200,
        message='Успішний вхід',
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
        message='Успішний вихід')
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
            message='Не надано даних для зміни пароля'
        )

    try:
        validated_data = UserChangePasswordSchema(**data)
    except ValidationError as e:
        return create_response(
            status_code=400,
            message='Неправильний формат даних',
            details=e.errors())
    except Exception as e:
        return create_response(
            status_code=500,
            message='Помилка сервера',
            details=str(e)
        )

    if user.check_password(validated_data.new_password):
        return create_response(
            status_code=400,
            message='Нова пароль не може бути такою ж, як і старий'
        )

    try:
        user.set_password(validated_data.new_password)
        db.session.commit()
    except SQLAlchemyError as e:
        db.session.rollback()
        return create_response(
            status_code=500,
            message='Помилка бази даних',
            details=str(e)
        )

    response = make_response(create_response(
        status_code=200,
        message='Пароль успішно змінено, будь ласка, увійдіть знову'
    ))
    unset_jwt_cookies(response)
    return response
