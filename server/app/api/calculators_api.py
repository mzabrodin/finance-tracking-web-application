"""API endpoints for managing calculators such as savings, credit, pension, tax for FOP, and balance forecast."""

from flask import Blueprint, request
from flask_jwt_extended import get_jwt_identity
from pydantic import ValidationError
from sqlalchemy import func, extract
from werkzeug.wrappers import Response
from app.models.transaction_model import Transaction
from app.models.budget_model import Budget
from app.schemas.calculator_schemas import SavingsSchema, CreditSchema, PensionSchema, TaxFopSchema, \
    BalanceForecastSchema
from app.utils.decorators import logged_in_required
from app.utils.extensions import db
from app.utils.responses import create_response

calculators = Blueprint('calculators', __name__)
"""Blueprint for calculators API endpoints."""


@calculators.route('/savings', methods=['POST'])
@logged_in_required
def calculate_savings() -> tuple[Response, int]:
    """Calculate the final amount of savings based on initial sum, annual interest rate, and term in months.

    Provided data should be in JSON format with the following fields:
        - initial_sum (float): Initial amount of savings. Must be non-negative.
        - term_months (int): Term in months. Must be between 1 and 120.
        - annual_rate (float): Annual interest rate in percentage. Must be between 0 and 100.

    Returns:
        tuple[Response, int]: A tuple containing the response object and the HTTP status code.
    """
    data = request.get_json()
    if not data:
        return create_response(status_code=400, message='Не надано вхідних даних')

    try:
        validated_data = SavingsSchema(**data)
    except ValidationError as e:
        return create_response(status_code=400, message='Неправильні вхідні дані', details=e.errors())

    P = validated_data.initial_sum
    r = validated_data.annual_rate / 100.0
    n = 12
    t = validated_data.term_months / 12.0

    final_amount = P * ((1 + r / n) ** (n * t))

    return create_response(
        status_code=200,
        message='Розрахунок заощаджень успішно виконано',
        data={'final_amount': round(final_amount, 2)}
    )


@calculators.route('/credit', methods=['POST'])
@logged_in_required
def calculate_credit() -> tuple[Response, int]:
    """Calculate the monthly payment, total payment, and overpayment and schedule for a credit.

    Provided data should be in JSON format with the following fields:
        - principal (float): The total amount of the credit. Must be greater than 0.
        - annual_rate (float): Annual interest rate in percentage. Must be between 0 and 100.
        - term_months (int): Credit term in months. Must be greater than 0.
    """
    data = request.get_json()
    if not data:
        return create_response(status_code=400, message='Не надано вхідних даних')

    try:
        validated_data = CreditSchema(**data)
    except ValidationError as e:
        return create_response(status_code=400, message='Неправильні вхідні дані', details=e.errors())

    P = validated_data.principal
    monthly_rate = (validated_data.annual_rate / 100.0) / 12
    n_payments = validated_data.term_months

    if monthly_rate == 0:
        monthly_payment = P / n_payments
    else:
        monthly_payment = P * (monthly_rate * (1 + monthly_rate) ** n_payments) / (
                ((1 + monthly_rate) ** n_payments) - 1)

    total_payment = monthly_payment * n_payments
    total_overpayment = total_payment - P

    payment_schedule = []
    remaining_balance = P
    for i in range(1, n_payments + 1):
        interest_payment = remaining_balance * monthly_rate
        principal_payment = monthly_payment - interest_payment
        remaining_balance -= principal_payment
        payment_schedule.append({
            'month': i,
            'monthly_payment': round(monthly_payment, 2),
            'principal_payment': round(principal_payment, 2),
            'interest_payment': round(interest_payment, 2),
            'remaining_balance': round(remaining_balance if remaining_balance > 0 else 0, 2)
        })

    return create_response(
        status_code=200,
        message='Кредит розраховано успішно',
        data={
            'monthly_payment': round(monthly_payment, 2),
            'total_payment': round(total_payment, 2),
            'total_overpayment': round(total_overpayment, 2),
            'payment_schedule': payment_schedule
        }
    )


@calculators.route('/pension', methods=['POST'])
@logged_in_required
def calculate_pension() -> tuple[Response, int]:
    """Calculate the final amount of pension savings based on initial sum, monthly contribution, annual rate, and term in years.

    Provided data should be in JSON format with the following fields:
        - initial_sum (float): Initial amount of savings. Must be non-negative.
        - monthly_contribution (float): Regular monthly contribution. Must be non-negative.
        - annual_rate (float): Average annual rate of return in percentage. Must be between 0 and 100.
        - term_years (int): Term of accumulation in years. Must be between 1 and 60.

    Returns:
        tuple[Response, int]: A tuple containing the response object and the HTTP status code.
    """
    data = request.get_json()
    if not data:
        return create_response(status_code=400, message='Не надано вхідних даних')

    try:
        validated_data = PensionSchema(**data)
    except ValidationError as e:
        return create_response(status_code=400, message='Неправильні вхідні дані', details=e.errors())

    P = validated_data.initial_sum
    C = validated_data.monthly_contribution
    r = (validated_data.annual_rate / 100.0) / 12
    n = validated_data.term_years * 12

    if r == 0:
        future_value_of_series = C * n
    else:
        future_value_of_series = C * (((1 + r) ** n - 1) / r)

    future_value_of_initial = P * ((1 + r) ** n)
    total_savings = future_value_of_initial + future_value_of_series

    return create_response(
        status_code=200,
        message='Розрахунок пенсійних заощаджень успішно виконано',
        data={'final_amount': round(total_savings, 2)}
    )


@calculators.route('/tax-fop', methods=['POST'])
@logged_in_required
def calculate_tax_fop() -> tuple[Response, int]:
    """Calculate the tax amount for FOP based on income and tax group.

    Provided data should be in JSON format with the following fields:
        - income (float): Total income amount. Must be non-negative.
        - tax_group (int): Tax group for FOP (3 or 5).
        - unified_social_contribution (float, optional): Unified Social Contribution amount. Must be non-negative if provided.

    Returns:
        tuple[Response, int]: A tuple containing the response object and the HTTP status code.
    """
    data = request.get_json()
    if not data:
        return create_response(status_code=400, message='Не надано вхідних даних')

    try:
        validated_data = TaxFopSchema(**data)
    except ValidationError as e:
        return create_response(status_code=400, message='Неправильні вхідні дані', details=e.errors())

    income = validated_data.income
    rate = validated_data.tax_group
    tax_amount = income * (rate / 100.0)

    response_data = {'tax_amount': round(tax_amount, 2)}

    if validated_data.unified_social_contribution is not None:
        usc = validated_data.unified_social_contribution
        response_data['unified_social_contribution'] = usc
        response_data['total_tax'] = round(tax_amount + usc, 2)

    return create_response(
        status_code=200,
        message='Податок для ФОП розраховано успішно',
        data=response_data
    )


@calculators.route('/balance-forecast', methods=['POST'])
@logged_in_required
def calculate_balance_forecast() -> tuple[Response, int]:
    """Calculates the future balance based on average monthly income and expenses.

    This endpoint uses the user's transaction history to determine the average
    monthly surplus or deficit and projects the future balance based on that.

    The request body should be a JSON object with the following fields:
        - forecast_months (int): The number of months to forecast into the future (1-120).

    Returns:
        tuple[Response, int]: A tuple containing the response object with the forecast details.
    """
    user_id = get_jwt_identity()
    data = request.get_json()
    if not data:
        return create_response(status_code=400, message='Не надано вхідних даних')

    try:
        validated_data = BalanceForecastSchema(**data)
        forecast_months = validated_data.forecast_months
    except ValidationError as e:
        return create_response(400, 'Неправильні вхідні дані', details=e.errors())

    income_subquery = db.session.query(
        func.sum(Transaction.amount).label('total')
    ).filter(
        Transaction.user_id == user_id,
        Transaction.type == 'income'
    ).group_by(
        extract('year', Transaction.created_at),
        extract('month', Transaction.created_at)
    ).subquery()
    avg_income_result = db.session.query(func.avg(income_subquery.c.total)).scalar()
    avg_monthly_income = float(avg_income_result or 0)

    expense_subquery = db.session.query(
        func.sum(Transaction.amount).label('total')
    ).filter(
        Transaction.user_id == user_id,
        Transaction.type == 'expense'
    ).group_by(
        extract('year', Transaction.created_at),
        extract('month', Transaction.created_at)
    ).subquery()
    avg_expense_result = db.session.query(func.avg(expense_subquery.c.total)).scalar()
    avg_monthly_expense = float(avg_expense_result or 0)

    current_balance_result = db.session.query(func.sum(Budget.current)).filter(Budget.user_id == user_id).scalar()
    current_balance = float(current_balance_result or 0)

    monthly_surplus = avg_monthly_income - avg_monthly_expense
    forecasted_balance = current_balance + (monthly_surplus * forecast_months)

    return create_response(200, "Прогноз балансу успішно розраховано", {
        'current_balance': round(current_balance, 2),
        'avg_monthly_income': round(avg_monthly_income, 2),
        'avg_monthly_expense': round(avg_monthly_expense, 2),
        'monthly_surplus': round(monthly_surplus, 2),
        'forecasted_balance': round(forecasted_balance, 2)
    })
