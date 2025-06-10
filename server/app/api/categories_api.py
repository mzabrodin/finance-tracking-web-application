"""API for categories management."""

from flask import Blueprint, request, Response
from flask_jwt_extended import get_jwt_identity
from pydantic import ValidationError
from sqlalchemy.exc import SQLAlchemyError
from app.models.category_model import Category
from app.models.transaction_model import Transaction
from app.schemas.category_schemas import CategoryCreateSchema, CategoryUpdateSchema
from app.utils.decorators import logged_in_required
from app.utils.extensions import db
from app.utils.responses import create_response

categories = Blueprint('categories', __name__)
"""Blueprint for category management API endpoints."""


@categories.route('/', methods=['POST'])
@logged_in_required
def create_category() -> tuple[Response, int]:
    """Create a new category for the authenticated user.

    This endpoint allows users to create a new category by providing the category name and an optional description.

    Provided data should be in JSON format with the following fields:
        - name (str): The name of the category, must be unique and between 3 and 20 characters.
        - description (str, optional): A brief description of the category, up to 200 characters.
        - type (str): The type of the category, either 'incomes' or 'expenses'.

    Returns:
        tuple[Response, int]: A response object with a status code and message indicating the result of the creation attempt.
    """
    user_id = get_jwt_identity()
    data = request.get_json()
    if not data:
        return create_response(400, message='Не надано даних для створення категорії')

    try:
        validated_data = CategoryCreateSchema(**data)

        new_category = Category(
            user_id=user_id,
            name=validated_data.name,
            description=validated_data.description,
            type=validated_data.type
        )
        db.session.add(new_category)
        db.session.commit()

        return create_response(201, 'Категорію успішно створено', new_category.to_dict())
    except ValidationError as e:
        return create_response(400, 'Неправильні вхідні дані', details=e.errors())
    except SQLAlchemyError as e:
        db.session.rollback()
        return create_response(500, 'Помилка бази даних', details=str(e))


@categories.route('/', methods=['GET'])
@logged_in_required
def get_categories() -> tuple[Response, int]:
    """Retrieve all categories for the authenticated user.

    This endpoint returns a list of all categories created by the authenticated user.

    Returns:
        tuple[Response, int]: A response object with a status code and a list of categories.
    """
    user_id = get_jwt_identity()
    user_categories = Category.query.filter_by(user_id=user_id).all()
    return create_response(200, 'Категорії успішно отримані',
                           [category.to_dict() for category in user_categories])


@categories.route('/<int:category_id>', methods=['GET'])
@logged_in_required
def get_category(category_id: int) -> tuple[Response, int]:
    """Retrieve a specific category by its ID for the authenticated user.

    This endpoint allows users to retrieve a specific category by its ID, ensuring that the category belongs to the authenticated user.

    Args:
        category_id (int): The ID of the category to retrieve.

    Returns:
        tuple[Response, int]: A response object with a status code and the category details if found.
    """
    user_id = get_jwt_identity()
    category = Category.query.filter_by(id=category_id, user_id=user_id).first()

    if not category:
        return create_response(404, 'Категорію не знайдено або доступ заборонено')
    return create_response(200, 'Категорія успішно отримана', category.to_dict())


@categories.route('/<int:category_id>', methods=['PUT'])
@logged_in_required
def update_category(category_id: int) -> tuple[Response, int]:
    """Update an existing category for the authenticated user.

    This endpoint allows users to update the details of an existing category by providing the category ID and the new data in JSON format.

    Provided data should be in JSON format with the following fields:
        - name (str, optional): The new name of the category, must be unique and between 3 and 20 characters.
        - description (str, optional): A new brief description of the category, up to 200 characters.

    Args:
        category_id (int): The ID of the category to update.

    Returns:
        tuple[Response, int]: A response object with a status code and message indicating the result of the update attempt.
    """
    user_id = get_jwt_identity()
    category = Category.query.filter_by(id=category_id, user_id=user_id).first()
    if not category:
        return create_response(404, 'Категорію не знайдено або доступ заборонено')

    data = request.get_json()
    if not data:
        return create_response(400, 'Не надано даних для оновлення категорії')

    try:
        validated_data = CategoryUpdateSchema(**data).model_dump(exclude_unset=True)
        if not validated_data:
            return create_response(400, 'Дані для оновлення категорії не надано')

        for key, value in validated_data.items():
            setattr(category, key, value)

        db.session.commit()
        return create_response(200, 'Категорія успішно оновлена', category.to_dict())
    except ValidationError as e:
        return create_response(400, 'Неправильні вхідні дані', details=e.errors())
    except SQLAlchemyError as e:
        db.session.rollback()
        return create_response(500, 'Помилка бази даних', details=str(e))


@categories.route('/<int:category_id>', methods=['DELETE'])
@logged_in_required
def delete_category(category_id: int) -> tuple[Response, int]:
    """Delete a specific category by its ID for the authenticated user.

    This endpoint allows users to delete a specific category by its ID, ensuring that the category belongs to the authenticated user.

    Args:
        category_id (int): The ID of the category to delete.

    Returns:
        tuple[Response, int]: A response object with a status code and message indicating the result of the deletion attempt.
    """
    user_id = get_jwt_identity()
    category = Category.query.filter_by(id=category_id, user_id=user_id).first()
    if not category:
        return create_response(404, 'Категорію не знайдено або доступ заборонено')

    transactions_exist = Transaction.query.filter_by(category_id = category_id).first()
    if transactions_exist:
        return create_response(400, 'Не можливо видалити категорію, оскільки вона містить транзакції')

    try:
        db.session.delete(category)
        db.session.commit()
        return create_response(200, 'Категорію успішно видалено')
    except SQLAlchemyError as e:
        db.session.rollback()
        return create_response(500, 'Помилка бази даних', details=str(e))
