from decimal import Decimal

from flask import Blueprint, request
from flask_jwt_extended import get_jwt_identity
from pydantic import ValidationError
from sqlalchemy.exc import SQLAlchemyError

from app.api import budgets
from app.models.budget_model import Budget
from app.models.category_model import Category
from app.models.transaction_model import Transaction
from app.schemas.transaction_schemas import TransactionSchema
from app.utils.decorators import logged_in_required
from app.utils.extensions import db
from app.utils.responses import create_response

transactions = Blueprint('transactions', __name__)


@transactions.route('/', methods=('POST',))
@logged_in_required
def create_transaction():
    user_id = get_jwt_identity()
    data = request.get_json()
    if not data:
        return create_response(
            status_code=400,
            message='No data provided'
        )

    try:
        validated_data = TransactionSchema(**data)
    except ValidationError as e:
        return create_response(
            status_code=400,
            message='Validation error',
            details=e.errors()
        )
    except Exception as e:
        return create_response(
            status_code=500,
            message='Internal server error',
            details=str(e)
        )

    category_id = data.get('category_id')
    category = Category.query.filter_by(id=category_id, user_id=user_id).first()
    if not category:
        return create_response(
            status_code=404,
            message='Category not found for the user'
        )

    budget_id = data.get('budget_id')
    budget = Budget.query.filter_by(id=budget_id, user_id=user_id).first()
    if not budget:
        return create_response(
            status_code=404,
            message='Budget not found for the user'
        )
    if not budget:
        return create_response(
            status_code=404,
            message='Budget not found for the user'
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
            message='Database error',
            details=str(e)
        )

    return create_response(
        status_code=201,
        message='Transaction created successfully',
        data=transaction.to_dict()
    )


@transactions.route('/<int:transaction_id>', methods=('PUT',))
@logged_in_required
def update_transaction(transaction_id):
    user_id = get_jwt_identity()
    data = request.get_json()
    if not data:
        return create_response(
            status_code=400,
            message='No data provided'
        )

    transaction = Transaction.query.filter_by(id=transaction_id, user_id=user_id).first()
    if not transaction:
        return create_response(
            status_code=404,
            message='Transaction not found'
        )

    category_id = None
    if 'category_id' in data:
        category_id = data.get('category_id')
        category = Category.query.filter_by(id=category_id, user_id=user_id).first()
        if not category:
            return create_response(
                status_code=404,
                message='Category not found for the user'
            )

    old_amount = transaction.amount
    old_type = transaction.type
    budget = transaction.budget

    try:
        validated_data = TransactionSchema(**data)
    except ValidationError as e:
        return create_response(
            status_code=400,
            message='Validation error',
            details=e.errors()
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
            setattr(transaction, key, value)

        new_amount = validated_data.amount
        new_type = validated_data.type

        if old_type == 'expense':
            budget.current += Decimal(old_amount)
        elif old_type == 'income':
            budget.current -= Decimal(old_amount)

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
            message='Database error',
            details=str(e)
        )

    return create_response(
        status_code=200,
        message='Transaction updated successfully',
        data=transaction.to_dict()
    )


@transactions.route('/<int:transaction_id>', methods=('DELETE',))
@logged_in_required
def delete_transaction(transaction_id):
    user_id = get_jwt_identity()

    if not transaction_id:
        return create_response(
            status_code=400,
            message='Transaction ID is required'
        )

    transaction = Transaction.query.filter_by(id=transaction_id, user_id=user_id).first()
    if not transaction:
        return create_response(
            status_code=404,
            message='Transaction not found'
        )

    try:
        db.session.delete(transaction)
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
        message='Transaction deleted successfully'
    )


@transactions.route('/', methods=('GET',))
@logged_in_required
def get_transactions():  # all transactions for the user
    user_id = get_jwt_identity()
    transactions = Transaction.query.filter_by(user_id=user_id).all()
    transactions.sort(key=lambda x: x.created_at, reverse=True)

    if not transactions:
        return create_response(
            status_code=404,
            message='No transactions found for the user'
        )

    return create_response(
        status_code=200,
        message='Transactions retrieved successfully',
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
            message='Transaction not found'
        )

    return create_response(
        status_code=200,
        message='Transaction retrieved successfully',
        data=transaction.to_dict()
    )


@transactions.route('/incomes/<int:budget_id>', methods=('GET',))
@logged_in_required
def get_incomes_by_budget(budget_id):
    user_id = get_jwt_identity()
    transactions = Transaction.query.filter_by(user_id=user_id, budget_id=budget_id, type='income').all()

    if not transactions:
        return create_response(
            status_code=404,
            message='No income transactions found for the user in this budget'
        )

    total_income = sum(float(transaction.amount) for transaction in transactions)
    return create_response(
        status_code=200,
        message='Income transactions retrieved successfully',
        data={
            'total_income': total_income,
            'transactions': [transaction.to_dict() for transaction in transactions]
        }
    )


@transactions.route('/expenses/<int:budget_id>', methods=('GET',))
@logged_in_required
def get_expenses_by_budget(budget_id):
    user_id = get_jwt_identity()
    transactions = Transaction.query.filter_by(user_id=user_id, budget_id=budget_id, type='expense').all()

    if not transactions:
        return create_response(
            status_code=404,
            message='No expense transactions found for the user in this budget'
        )

    total_expense = sum(float(transaction.amount) for transaction in transactions)
    return create_response(
        status_code=200,
        message='Expense transactions retrieved successfully',
        data={
            'total_expense': total_expense,
            'transactions': [transaction.to_dict() for transaction in transactions]
        }
    )

@transactions.route('/<int:category_id>/category', methods=('GET',))
@logged_in_required
def get_transactions_by_category(category_id):
    user_id = get_jwt_identity()
    transactions = Transaction.query.filter_by(user_id=user_id, category_id=category_id).all()

    if not transactions:
        return create_response(
            status_code=404,
            message='No transactions found for this category'
        )

    return create_response(
        status_code=200,
        message='Transactions by category retrieved successfully',
        data=[transaction.to_dict() for transaction in transactions]
    )
