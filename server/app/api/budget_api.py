from flask import Blueprint, request, make_response
from flask_jwt_extended import get_jwt_identity
from pydantic import ValidationError
from sqlalchemy.exc import SQLAlchemyError

from app.models.budget_model import Budget
from app.schemas.budget_schemas import BudgetCreateSchema
from app.utils.decorators import logged_in_required
from app.utils.extensions import db
from app.utils.responses import create_response

budgets = Blueprint('budgets', __name__)


@budgets.route('/', methods=('GET',))
@logged_in_required
def get_budgets():
    # TODO: Returns all budgets for the authenticated user
    pass


@budgets.route('/<int:budget_id>', methods=('GET',))
@logged_in_required
def get_budget():
    # TODO: Returns a specific budget by ID for the authenticated user
    pass


@budgets.route('/', methods=('POST',))
@logged_in_required
def create_budget():
    user_id = get_jwt_identity()

    data = request.get_json()
    if not data:
        return create_response(
            status_code=400,
            message='No input data provided'
        )

    try:
        validated_data = BudgetCreateSchema(**data)
    except ValidationError as ve:
        return create_response(
            status_code=400,
            message='Invalid input',
            details=ve.errors()
        )
    except Exception as e:
        return create_response(
            status_code=500,
            message='Internal server error',
            details=str(e)
        )

    try:
        budget = Budget(
            user_id=user_id,
            name=validated_data.name,
            initial=validated_data.initial,
            current=validated_data.current,
            goal=validated_data.goal,
            created_at=validated_data.created_at,
            end_at=validated_data.end_at
        )
        db.session.add(budget)
        db.session.commit()
    except SQLAlchemyError as sqle:
        db.session.rollback()
        return create_response(
            status_code=500,
            message='Database error',
            details=str(sqle)
        )

    return make_response(create_response(
        status_code=201,
        message='Budget created successfully',
        data=budget.to_dict()
    ))


@budgets.route('/<int:budget_id>', methods=('PUT',))
@logged_in_required
def update_budget():
    # TODO: Updates an existing budget by ID for the authenticated user
    pass


@budgets.route('/<int:budget_id>', methods=('DELETE',))
@logged_in_required
def delete_budget():
    # TODO: Deletes a specific budget by ID for the authenticated user
    pass
