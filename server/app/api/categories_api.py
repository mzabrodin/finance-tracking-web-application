from flask import Blueprint, request
from flask_jwt_extended import get_jwt_identity
from pydantic import ValidationError
from sqlalchemy.exc import SQLAlchemyError
from app.models.category_model import Category
from app.schemas.category_schemas import CategoryCreateSchema, CategoryUpdateSchema
from app.utils.decorators import logged_in_required
from app.utils.extensions import db
from app.utils.responses import create_response

categories = Blueprint('categories', __name__)


@categories.route('/', methods=['POST'])
@logged_in_required
def create_category():
    user_id = get_jwt_identity()
    data = request.get_json()
    if not data:
        return create_response(400, message='No input data provided')

    try:
        validated_data = CategoryCreateSchema(**data)

        new_category = Category(
            user_id=user_id,
            name=validated_data.name,
            description=validated_data.description
        )
        db.session.add(new_category)
        db.session.commit()

        return create_response(201, 'Category created successfully', new_category.to_dict())
    except ValidationError as e:
        return create_response(400, 'Invalid input', details=e.errors())
    except SQLAlchemyError as e:
        db.session.rollback()
        return create_response(500, 'Database error', details=str(e))


@categories.route('/', methods=['GET'])
@logged_in_required
def get_categories():
    user_id = get_jwt_identity()
    user_categories = Category.query.filter_by(user_id=user_id).all()
    return create_response(200, 'Categories retrieved successfully', [category.to_dict() for category in user_categories])

@categories.route('/<int:category_id>', methods=['GET'])
@logged_in_required
def get_category(category_id):
    user_id = get_jwt_identity()
    category = Category.query.filter_by(id=category_id, user_id=user_id).first()

    if not category:
        return create_response(404, 'Category not found or access denied')
    return create_response(200, 'Category retrieved successfully', category.to_dict())


@categories.route('/<int:category_id>', methods=['PUT'])
@logged_in_required
def update_category(category_id):
    user_id = get_jwt_identity()
    category = Category.query.filter_by(id=category_id, user_id=user_id).first()
    if not category:
        return create_response(404, 'Category not found or access denied')

    data = request.get_json()
    if not data:
        return create_response(400, 'No input data provided')

    try:
        validated_data = CategoryUpdateSchema(**data).model_dump(exclude_unset=True)
        if not validated_data:
            return create_response(400, 'No fields to update')

        for key, value in validated_data.items():
            setattr(category, key, value)

        db.session.commit()
        return create_response(200, 'Category updated successfully', category.to_dict())
    except ValidationError as e:
        return create_response(400, 'Invalid input', details=e.errors())
    except SQLAlchemyError as e:
        db.session.rollback()
        return create_response(500, 'Database error', details=str(e))


@categories.route('/<int:category_id>', methods=['DELETE'])
@logged_in_required
def delete_category(category_id):
    user_id = get_jwt_identity()
    category = Category.query.filter_by(id=category_id, user_id=user_id).first()
    if not category:
        return create_response(404, 'Category not found or access denied')

    try:
        db.session.delete(category)
        db.session.commit()
        return create_response(200, 'Category deleted successfully')
    except SQLAlchemyError as e:
        db.session.rollback()
        return create_response(500, 'Database error', details=str(e))