"""API for budget management."""

import datetime

from flask import Blueprint, request, make_response, Response
from flask_jwt_extended import get_jwt_identity
from pydantic import ValidationError
from sqlalchemy.exc import SQLAlchemyError

from app.models.budget_model import Budget
from app.schemas.budget_schemas import BudgetSchema
from app.utils.decorators import logged_in_required
from app.utils.extensions import db
from app.utils.responses import create_response

budgets = Blueprint('budgets', __name__)
"""Blueprint for budget-related API endpoints."""


@budgets.route('/', methods=('GET',))
@logged_in_required
def get_budgets() -> tuple[Response, int] | Response:
    """Retrieve all budgets for the logged-in user.

    This endpoint fetches all budgets associated with the currently authenticated user.

    Returns:
        tuple[Response, int] | Response: A response object containing the status code, message, and list of budgets if found.
    """
    user_id = get_jwt_identity()
    try:
        result_budgets = Budget.query.filter_by(user_id=user_id).all()
        budget_list = [budget.to_dict() for budget in result_budgets]
    except SQLAlchemyError as e:
        return create_response(
            status_code=500,
            message='Помилка бази даних',
            details=str(e)
        )

    if not budget_list:
        return create_response(
            status_code=404,
            message='Не знайдено жодного бюджету'
        )

    return make_response(create_response(
        status_code=200,
        message='Бюджети отримані успішно',
        data=budget_list
    ))


@budgets.route('/<int:budget_id>', methods=('GET',))
@logged_in_required
def get_budget(budget_id: int) -> tuple[Response, int] | Response:
    """Retrieve a specific budget by its ID for the logged-in user.

    This endpoint fetches a budget associated with the currently authenticated user by its ID.

    Args:
        budget_id (int): The ID of the budget to retrieve. It must be provided in the URL path.

    Returns:
        tuple[Response, int] | Response: A response object containing the status code, message, and budget details if found.
    """
    user_id = get_jwt_identity()
    if not budget_id:
        return create_response(
            status_code=400,
            message="ID бюджету є обов'язковим"
        )

    try:
        budget = Budget.query.filter_by(id=budget_id, user_id=user_id).first()
    except SQLAlchemyError as e:
        return create_response(
            status_code=500,
            message='Помилка бази даних',
            details=str(e)
        )

    if not budget:
        return create_response(
            status_code=404,
            message='Не знайдено бюджет з таким ID'
        )

    return make_response(create_response(
        status_code=200,
        message='Бюджет отримано успішно',
        data=budget.to_dict()
    ))


@budgets.route('/', methods=('POST',))
@logged_in_required
def create_budget() -> tuple[Response, int] | Response:
    """Create a new budget for the logged-in user.

    This endpoint allows the user to create a new budget by providing the necessary details in JSON format.

    Provided data should be in JSON format with the following fields:
        - name (str): The name of the budget, must be between 3 and 30 characters.
        - initial (float): The initial amount for the budget, must be between 0 and 100,000,000.
        - current (float): The current amount for the budget, defaults to initial if not provided. Must be between 0 and 100,000,000.
        - goal (float, optional): The goal amount for the budget, must be greater than or equal to current if provided. Must be between 0 and 100,000,000.
        - created_at (date, optional): The date when the budget was created, defaults to today if not provided.
        - end_at (date, optional): The end date for the budget, must be in the future or today if provided.

    Restrictions for provided data:
        - The 'goal' and 'end_at' fields must be provided together if either is specified.
        - The 'current' field defaults to the value of 'initial' if not provided.
        - The 'goal' must be greater than or equal to the 'current'.
        - The 'end_at' date must be greater than or equal to the 'created_at' date and cannot be in the past.

    Returns:
        tuple[Response, int] | Response: A response object with a status code and message indicating the result of the budget creation.
    """
    user_id = get_jwt_identity()
    data = request.get_json()
    if not data:
        return create_response(
            status_code=400,
            message='Не надано даних для створення бюджету'
        )

    try:
        validated_data = BudgetSchema(**data)
    except ValidationError as e:
        return create_response(
            status_code=400,
            message='Неправильний формат вхідних даних',
            details=str(e.errors())
        )
    except Exception as e:
        return create_response(
            status_code=500,
            message='Помилка сервера',
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
            message='Помилка бази даних',
            details=str(e)
        )

    return make_response(create_response(
        status_code=201,
        message='Бюджет створено успішно',
        data=budget.to_dict()
    ))


@budgets.route('/<int:budget_id>', methods=('PUT',))
@logged_in_required
def update_budget(budget_id: int) -> tuple[Response, int] | Response:
    """Update an existing budget for the logged-in user.

    This endpoint allows the user to update an existing budget by providing the budget ID and the new details in JSON format.

    Args:
        budget_id (int): The ID of the budget to update. It must be provided in the URL path.

    Provided data should be in JSON format with the following fields:
        - name (str): The name of the budget, must be between 3 and 30 characters.
        - initial (float): The initial amount for the budget, must be between 0 and 100,000,000.
        - current (float): The current amount for the budget, defaults to initial if not provided. Must be between 0 and 100,000,000.
        - goal (float, optional): The goal amount for the budget, must be greater than or equal to current if provided. Must be between 0 and 100,000,000.
        - created_at (date, optional): The date when the budget was created, defaults to today if not provided.
        - end_at (date, optional): The end date for the budget, must be in the future or today if provided.

    Restrictions for provided data:
        - The 'goal' and 'end_at' fields must be provided together if either is specified.
        - The 'current' field defaults to the value of 'initial' if not provided.
        - The 'goal' must be greater than or equal to the 'current'.
        - The 'end_at' date must be greater than or equal to the 'created_at' date and cannot be in the past.

    Returns:
        tuple[Response, int] | Response: A response object with a status code and message indicating the result of the budget update.
    """
    user_id = get_jwt_identity()
    if not budget_id:
        return create_response(
            status_code=400,
            message="ID бюджету є обов'язковим"
        )

    budget = Budget.query.filter_by(id=budget_id, user_id=user_id).first()
    if not budget:
        return create_response(
            status_code=404,
            message='Бюджет не знайдено'
        )

    data = request.get_json()
    if not data:
        return create_response(
            status_code=400,
            message='Не надано даних для оновлення бюджету'
        )

    try:
        validated_data = BudgetSchema(**data)
    except ValidationError as e:
        return create_response(
            status_code=400,
            message='Неправильний формат вхідних даних',
            details=str(e.errors())
        )
    except Exception as e:
        return create_response(
            status_code=500,
            message='Помилка сервера',
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
            message='Помилка бази даних',
            details=str(e)
        )

    return make_response(create_response(
        status_code=200,
        message='Бюджет оновлено успішно',
        data=budget.to_dict()
    ))


@budgets.route('/<int:budget_id>', methods=('DELETE',))
@logged_in_required
def delete_budget(budget_id: int) -> tuple[Response, int] | Response:
    """Delete a budget for the logged-in user.

    This endpoint allows the user to delete a budget by providing the budget ID in the URL path.

    Args:
        budget_id (int): The ID of the budget to delete. It must be provided in the URL path.

    Returns:
        tuple[Response, int] | Response: A response object with a status code and message indicating the result of the budget deletion.
    """
    user_id = get_jwt_identity()
    if not budget_id:
        return create_response(
            status_code=400,
            message="ID бюджету є обов'язковим"
        )

    try:
        budget = Budget.query.filter_by(id=budget_id, user_id=user_id).first()
    except SQLAlchemyError as e:
        return create_response(
            status_code=500,
            message='Неможливо видалити бюджет до якого прив`зані транзакції ',
            details=str(e)
        )

    if not budget:
        return create_response(
            status_code=404,
            message='Бюджет не знайдено'
        )

    try:
        db.session.delete(budget)
        db.session.commit()
    except SQLAlchemyError as e:
        db.session.rollback()
        return create_response(
            status_code=500,
            message='Неможливо видалити бюджет до якого прив`зані транзакції',
            details=str(e)
        )

    return make_response(create_response(
        status_code=200,
        message='Бюджет видалено успішно'
    ))


@budgets.route('/balance', methods=('GET',))
@logged_in_required
def get_budget_balance() -> tuple[Response, int] | Response:
    """Retrieve the total balance of all budgets for the logged-in user.

    This endpoint calculates the total balance by summing the current amounts of all budgets associated with the user.

    Returns:
        tuple[Response, int] | Response: A response object containing the status code, message, and total balance if successful.
    """
    user_id = get_jwt_identity()
    try:
        res_budgets = Budget.query.filter_by(user_id=user_id).all()
        total_balance = sum(budget.current for budget in res_budgets)
    except SQLAlchemyError as e:
        return create_response(
            status_code=500,
            message='Помилка бази даних',
            details=str(e)
        )

    return make_response(create_response(
        status_code=200,
        message='Загальний баланс отримано успішно',
        data={'total_balance': total_balance}
    ))


@budgets.route('/<int:budget_id>/plan', methods=('GET',))
@logged_in_required
def get_budget_plan(budget_id: int) -> tuple[Response, int] | Response:
    """Retrieve the daily budget plan for a specific budget.

    This endpoint calculates the daily budget plan based on the goal, current amount, and end date of the specified budget.

    Args:
        budget_id (int): The ID of the budget for which to retrieve the plan. It must be provided in the URL path.

    Returns:
        tuple[Response, int] | Response: A response object containing the status code, message, and daily budget plan if successful.
    """
    user_id = get_jwt_identity()
    if not budget_id:
        return create_response(
            status_code=400,
            message="ID бюджету є обов'язковим"
        )

    try:
        budget = Budget.query.filter_by(id=budget_id, user_id=user_id).first()
    except SQLAlchemyError as e:
        return create_response(
            status_code=500,
            message='Помилка бази даних',
            details=str(e)
        )

    if not budget:
        return create_response(
            status_code=404,
            message='Бюджет не знайдено'
        )

    if budget.goal is None or budget.end_at is None:
        return create_response(
            status_code=400,
            message='Ціль або дата закінчення бюджету не вказані'
        )

    today = datetime.date.today()
    end_at = budget.end_at
    goal = budget.goal
    current = budget.current

    if today > end_at:
        return create_response(
            status_code=400,
            message='Дата закінчення бюджету вже минула'
        )

    days_remaining = (end_at - today).days
    if days_remaining <= 0:
        return create_response(
            status_code=400,
            message='Не залишилося днів до закінчення бюджету'
        )

    daily_plan = (goal - current) / days_remaining
    if daily_plan < 0:
        return create_response(
            status_code=400,
            message='Бюджет вже перевищено, неможливо створити план'
        )

    return make_response(create_response(
        status_code=200,
        message='План бюджету отримано успішно',
        data={
            'daily_plan': daily_plan,
            'days_remaining': days_remaining,
            'end_at': end_at.isoformat(),
            'goal': goal,
            'current': current
        }
    ))
