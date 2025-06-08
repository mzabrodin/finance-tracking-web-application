import datetime

from flask import Blueprint, request, make_response
from flask_jwt_extended import get_jwt_identity
from pydantic import ValidationError
from pydantic.v1 import PydanticValueError
from sqlalchemy.exc import SQLAlchemyError

from app.models.budget_model import Budget
from app.schemas.budget_schemas import BudgetSchema
from app.utils.decorators import logged_in_required
from app.utils.extensions import db
from app.utils.responses import create_response

budgets = Blueprint('budgets', __name__)


@budgets.route('/', methods=('GET',))
@logged_in_required
def get_budgets():
    user_id = get_jwt_identity()

    try:
        result_budgets = Budget.query.filter_by(user_id=user_id).all()
        budget_list = [budget.to_dict() for budget in result_budgets]
    except SQLAlchemyError as e:
        return create_response(
            status_code=500,
            message='Database error',
            details=str(e)
        )

    if not budget_list:
        return create_response(
            status_code=404,
            message='No budgets found for the user'
        )

    return make_response(create_response(
        status_code=200,
        message='Budgets retrieved successfully',
        data=budget_list
    ))


@budgets.route('/<int:budget_id>', methods=('GET',))
@logged_in_required
def get_budget(budget_id):
    user_id = get_jwt_identity()

    if not budget_id:
        return create_response(
            status_code=400,
            message='Budget ID is required'
        )

    try:
        budget = Budget.query.filter_by(id=budget_id, user_id=user_id).first()
    except SQLAlchemyError as e:
        return create_response(
            status_code=500,
            message='Database error',
            details=str(e)
        )

    if not budget:
        return create_response(
            status_code=404,
            message='Budget not found'
        )

    return make_response(create_response(
        status_code=200,
        message='Budget retrieved successfully',
        data=budget.to_dict()
    ))


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
        validated_data = BudgetSchema(**data)
    except ValidationError as e:
        return create_response(
            status_code=400,
            message='Invalid input',
            details=str(e.errors())
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
    except SQLAlchemyError as e:
        db.session.rollback()
        return create_response(
            status_code=500,
            message='Database error',
            details=str(e)
        )

    return make_response(create_response(
        status_code=201,
        message='Budget created successfully',
        data=budget.to_dict()
    ))


@budgets.route('/<int:budget_id>', methods=('PUT',))
@logged_in_required
def update_budget(budget_id):
    user_id = get_jwt_identity()
    if not budget_id:
        return create_response(
            status_code=400,
            message='Budget ID is required'
        )

    budget = Budget.query.filter_by(id=budget_id, user_id=user_id).first()
    if not budget:
        return create_response(
            status_code=404,
            message='Budget not found'
        )

    data = request.get_json()
    if not data:
        return create_response(
            status_code=400,
            message='No input data provided'
        )

    try:
        validated_data = BudgetSchema(**data)
    except ValidationError as e:
        return create_response(
            status_code=400,
            message='Invalid input',
            details=str(e.errors())
        )
    except Exception as e:
        return create_response(
            status_code=500,
            message='Internal server error',
            details=str(e)
        )

    update_data = validated_data.model_dump(exclude_unset=True)

    try:
        for key, value in update_data.items():
            setattr(budget, key, value)
        db.session.commit()
    except SQLAlchemyError as e:
        db.session.rollback()
        return create_response(
            status_code=500,
            message='Database error',
            details=str(e)
        )

    return make_response(create_response(
        status_code=200,
        message='Budget updated successfully',
        data=budget.to_dict()
    ))


@budgets.route('/<int:budget_id>', methods=('DELETE',))
@logged_in_required
def delete_budget(budget_id):
    user_id = get_jwt_identity()

    if not budget_id:
        return create_response(
            status_code=400,
            message='Budget ID is required'
        )

    try:
        budget = Budget.query.filter_by(id=budget_id, user_id=user_id).first()
    except SQLAlchemyError as e:
        return create_response(
            status_code=500,
            message='Database error',
            details=str(e)
        )

    if not budget:
        return create_response(
            status_code=404,
            message='Budget not found'
        )

    try:
        db.session.delete(budget)
        db.session.commit()
    except SQLAlchemyError as e:
        db.session.rollback()
        return create_response(
            status_code=500,
            message='Database error',
            details=str(e)
        )

    return make_response(create_response(
        status_code=200,
        message='Budget deleted successfully'
    ))


@budgets.route('/balance', methods=('GET',))
@logged_in_required
def get_budget_balance():
    user_id = get_jwt_identity()

    try:
        res_budgets = Budget.query.filter_by(user_id=user_id).all()
        total_balance = sum(budget.current for budget in res_budgets)
    except SQLAlchemyError as e:
        return create_response(
            status_code=500,
            message='Database error',
            details=str(e)
        )

    return make_response(create_response(
        status_code=200,
        message='Total budget balance retrieved successfully',
        data={'total_balance': total_balance}
    ))

@budgets.route('/<int:budget_id>/plan', methods=('GET',))
@logged_in_required
def get_budget_plan(budget_id):
    user_id = get_jwt_identity()

    if not budget_id:
        return create_response(
            status_code=400,
            message='Budget ID is required'
        )

    try:
        budget = Budget.query.filter_by(id=budget_id, user_id=user_id).first()
    except SQLAlchemyError as e:
        return create_response(
            status_code=500,
            message='Database error',
            details=str(e)
        )

    if not budget:
        return create_response(
            status_code=404,
            message='Budget not found'
        )

    if budget.goal is None or budget.end_at is None:
        return create_response(
            status_code=400,
            message='Budget goal or end date not set'
        )

    today = datetime.date.today()
    end_at = budget.end_at
    goal = budget.goal
    current = budget.current

    if today > end_at:
        return create_response(
            status_code=400,
            message='Budget end date has passed'
        )

    days_remaining = (end_at - today).days
    if days_remaining <= 0:
        return create_response(
            status_code=400,
            message='No days remaining in the budget period'
        )

    daily_plan = (goal - current) / days_remaining
    if daily_plan < 0:
        return create_response(
            status_code=400,
            message='Current budget exceeds the goal'
        )

    return make_response(create_response(
        status_code=200,
        message='Budget plan retrieved successfully',
        data={
            'daily_plan': daily_plan,
            'days_remaining': days_remaining,
            'end_at': end_at.isoformat(),
            'goal': goal,
            'current': current
        }
    ))
