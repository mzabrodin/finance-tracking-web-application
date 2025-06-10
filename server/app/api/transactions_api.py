"""API endpoints for managing transactions."""

from decimal import Decimal

from flask import Blueprint, request, Response
from flask_jwt_extended import get_jwt_identity
from pydantic import ValidationError
from sqlalchemy.exc import SQLAlchemyError

from app.models.budget_model import Budget
from app.models.category_model import Category
from app.models.transaction_model import Transaction
from app.schemas.transaction_schemas import TransactionSchema
from app.utils.decorators import logged_in_required
from app.utils.extensions import db
from app.utils.responses import create_response

transactions = Blueprint('transactions', __name__)
"""Blueprint for transaction-related API endpoints."""


@transactions.route('/', methods=('POST',))
@logged_in_required
def create_transaction() -> tuple[Response, int]:
    """Create a new transaction for the authenticated user.

    This endpoint creates a new transaction associated with a specific budget and category.

    Provided data should be in JSON format with the following fields:
        - amount (float): The amount of the transaction in the range of 0 to 1,000,000.
        - description (str, optional): A description of the transaction (3-200 characters).
        - created_at (datetime, optional): The date and time of the transaction. Defaults to the current time.
        - type (str): The type of transaction, either 'income' or 'expense'.

    Returns:
        tuple[Response, int]: A tuple containing the response object and the HTTP status code after processing the request.
    """
    user_id = get_jwt_identity()
    data = request.get_json()
    if not data:
        return create_response(
            status_code=400,
            message='Не надано даних для створення транзакції'
        )

    try:
        validated_data = TransactionSchema(**data)
    except ValidationError as e:
        return create_response(
            status_code=400,
            message='Неправильні вхідні дані',
            details=e.errors()
        )
    except Exception as e:
        return create_response(
            status_code=500,
            message='Помилка сервера',
            details=str(e)
        )

    category_id = data.get('category_id')
    category = Category.query.filter_by(id=category_id, user_id=user_id).first()
    if not category:
        return create_response(
            status_code=404,
            message='Не існує наданої категорії'
        )

    if (category.type == 'expenses' and validated_data.type != 'expense') or (
            category.type == 'incomes' and validated_data.type != 'income'):
        return create_response(
            status_code=400,
            message='Тип категорії не відповідає типу транзакції'
        )

    budget_id = data.get('budget_id')
    budget = Budget.query.filter_by(id=budget_id, user_id=user_id).first()
    if not budget:
        return create_response(
            status_code=404,
            message='Не існує наданого бюджету'
        )

    try:
        transaction = Transaction(
            user_id=user_id,
            category_id=category.id,
            budget_id=budget.id,
            amount=validated_data.amount,
            description=validated_data.description,
            created_at=validated_data.created_at,
            type=validated_data.type
        )
        db.session.add(transaction)
        if validated_data.type == 'expense':
            budget.current -= Decimal(validated_data.amount)
        elif validated_data.type == 'income':
            budget.current += Decimal(validated_data.amount)
        db.session.commit()
    except SQLAlchemyError as e:
        db.session.rollback()
        return create_response(
            status_code=500,
            message='Помилка бази даних',
            details=str(e)
        )

    return create_response(
        status_code=201,
        message='Транзакцію успішно створено',
        data=transaction.to_dict()
    )


@transactions.route('/<int:transaction_id>', methods=('PUT',))
@logged_in_required
def update_transaction(transaction_id: int) -> tuple[Response, int]:
    """Update an existing transaction for the authenticated user.

    This endpoint updates a transaction associated with a specific budget and category.

    Provided data should be in JSON format with the following fields:
        - amount (float): The new amount of the transaction in the range of 0 to 1,000,000.
        - description (str, optional): A new description of the transaction (3-200 characters).
        - created_at (datetime, optional): The new date and time of the transaction.
        - type (str): The new type of transaction, either 'income' or 'expense'.
        - category_id (int, optional): The ID of the category to associate with the transaction.

    Returns:
        tuple[Response, int]: A tuple containing the response object and the HTTP status code after processing the request.
    """
    user_id = get_jwt_identity()
    data = request.get_json()
    if not data:
        return create_response(
            status_code=400,
            message='Не надано даних для оновлення транзакції'
        )

    transaction = Transaction.query.filter_by(id=transaction_id, user_id=user_id).first()
    if not transaction:
        return create_response(
            status_code=404,
            message='Транзакцію не знайдено'
        )

    category_id = None
    if 'category_id' in data:
        category_id = data.get('category_id')
        category = Category.query.filter_by(id=category_id, user_id=user_id).first()
        if not category:
            return create_response(
                status_code=404,
                message='Категорію не знайдено'
            )

        if (category.type == 'expenses' and data.get('type') != 'expense') or (
                category.type == 'incomes' and data.get('type') != 'income'):
            return create_response(
                status_code=400,
                message='Тип категорії не відповідає типу транзакції'
            )

    old_amount = transaction.amount
    old_type = transaction.type
    budget = transaction.budget

    try:
        validated_data = TransactionSchema(**data)
    except ValidationError as e:
        return create_response(
            status_code=400,
            message='Неправильні вхідні дані',
            details=e.errors()
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
            setattr(transaction, key, value)

        if old_type == 'expense':
            budget.current += Decimal(old_amount)
        elif old_type == 'income':
            budget.current -= Decimal(old_amount)

        new_amount = validated_data.amount
        new_type = validated_data.type

        if new_type == 'expense':
            budget.current -= Decimal(new_amount)
        elif new_type == 'income':
            budget.current += Decimal(new_amount)

        if category_id:
            transaction.category_id = category_id

        db.session.commit()
    except SQLAlchemyError as e:
        db.session.rollback()
        return create_response(
            status_code=500,
            message='Помилка бази даних',
            details=str(e)
        )

    return create_response(
        status_code=200,
        message='Транзакцію успішно оновлено',
        data=transaction.to_dict()
    )


@transactions.route('/<int:transaction_id>', methods=('DELETE',))
@logged_in_required
def delete_transaction(transaction_id: int) -> tuple[Response, int]:
    """Delete a transaction for the authenticated user.

    This endpoint deletes a transaction associated with a specific budget and category by its ID and updates the budget accordingly.

    Args:
        transaction_id (int): The ID of the transaction to delete.

    Returns:
        tuple[Response, int]: A tuple containing the response object and the HTTP status code after processing the request.
    """
    user_id = get_jwt_identity()
    if not transaction_id:
        return create_response(
            status_code=400,
            message='ID транзакції не надано'
        )

    transaction = Transaction.query.filter_by(id=transaction_id, user_id=user_id).first()
    if not transaction:
        return create_response(
            status_code=404,
            message='Транзакцію не знайдено'
        )

    budget = transaction.budget

    try:
        if transaction.type == 'income':
            budget.current -= transaction.amount
        elif transaction.type == 'expense':
            budget.current += transaction.amount

        db.session.delete(transaction)
        db.session.commit()
    except SQLAlchemyError as e:
        db.session.rollback()
        return create_response(
            status_code=500,
            message='Помилка бази даних',
            details=str(e)
        )

    return create_response(
        status_code=200,
        message='Транзакцію успішно видалено'
    )


@transactions.route('/', methods=('GET',))
@logged_in_required
def get_transactions() -> tuple[Response, int]:
    """Retrieve all transactions for the authenticated user.

    This endpoint retrieves all transactions associated with the authenticated user, sorted by creation date in descending order.

    Returns:
        tuple[Response, int]: A tuple containing the response object and the HTTP status code after processing the request.
    """
    user_id = get_jwt_identity()
    transactions = Transaction.query.filter_by(user_id=user_id).all()
    transactions.sort(key=lambda x: x.created_at, reverse=True)

    if not transactions:
        return create_response(
            status_code=404,
            message='Не знайдено транзакцій'
        )

    return create_response(
        status_code=200,
        message='Транзакції успішно отримано',
        data=[transaction.to_dict() for transaction in transactions]
    )


@transactions.route('/<int:transaction_id>', methods=('GET',))
@logged_in_required
def get_transaction(transaction_id):  # get a specific transaction by ID of the user
    user_id = get_jwt_identity()
    transaction = Transaction.query.filter_by(id=transaction_id, user_id=user_id).first()

    if not transaction:
        return create_response(
            status_code=404,
            message='Не знайдено транзакцію з таким ID'
        )

    return create_response(
        status_code=200,
        message='Транзакцію успішно отримано',
        data=transaction.to_dict()
    )


@transactions.route('/incomes/<int:budget_id>', methods=('GET',))
@logged_in_required
def get_incomes_by_budget(budget_id: int) -> tuple[Response, int]:
    """Retrieve all income transactions for a specific budget of the authenticated user.

    This endpoint retrieves all income transactions associated with a specific budget, sorted by creation date in descending order.

    Args:
        budget_id (int): The ID of the budget for which to retrieve income transactions.

    Returns:
        tuple[Response, int]: A tuple containing the response object and the HTTP status code after processing the request.
    """
    user_id = get_jwt_identity()
    transactions = Transaction.query.filter_by(user_id=user_id, budget_id=budget_id, type='income').all()
    transactions.sort(key=lambda x: x.created_at, reverse=True)

    if not transactions:
        return create_response(
            status_code=404,
            message='Не знайдено транзакцій доходів для користувача в цьому бюджеті'
        )

    total_income = sum(float(transaction.amount) for transaction in transactions)
    return create_response(
        status_code=200,
        message='Транзакції доходів успішно отримано',
        data={
            'total_income': total_income,
            'transactions': [transaction.to_dict() for transaction in transactions]
        }
    )


@transactions.route('/expenses/<int:budget_id>', methods=('GET',))
@logged_in_required
def get_expenses_by_budget(budget_id: int) -> tuple[Response, int]:
    """Retrieve all expense transactions for a specific budget of the authenticated user.

    This endpoint retrieves all expense transactions associated with a specific budget, sorted by creation date in descending order.

    Args:
        budget_id (int): The ID of the budget for which to retrieve expense transactions.

    Returns:
        tuple[Response, int]: A tuple containing the response object and the HTTP status code after processing the request.
    """
    user_id = get_jwt_identity()
    transactions = Transaction.query.filter_by(user_id=user_id, budget_id=budget_id, type='expense').all()
    transactions.sort(key=lambda x: x.created_at, reverse=True)

    if not transactions:
        return create_response(
            status_code=404,
            message='Не знайдено транзакцій витрат для користувача в цьому бюджеті'
        )

    total_expense = sum(float(transaction.amount) for transaction in transactions)
    return create_response(
        status_code=200,
        message='Транзакції витрат успішно отримано',
        data={
            'total_expense': total_expense,
            'transactions': [transaction.to_dict() for transaction in transactions]
        }
    )


@transactions.route('/category/<int:category_id>', methods=('GET',))
@logged_in_required
def get_transactions_by_category(category_id: int) -> tuple[Response, int]:
    """Retrieve all transactions for a specific category of the authenticated user.

    This endpoint retrieves all transactions associated with a specific category, sorted by creation date in descending order.

    Args:
        category_id (int): The ID of the category for which to retrieve transactions.

    Returns:
        tuple[Response, int]: A tuple containing the response object and the HTTP status code after processing the request.

    """
    user_id = get_jwt_identity()
    transactions = Transaction.query.filter_by(user_id=user_id, category_id=category_id).all()
    transactions.sort(key=lambda x: x.created_at, reverse=True)

    if not transactions:
        return create_response(
            status_code=404,
            message='Не знайдено транзакцій для цієї категорії'
        )

    return create_response(
        status_code=200,
        message='Транзакції для категорії успішно отримано',
        data=[transaction.to_dict() for transaction in transactions]
    )
