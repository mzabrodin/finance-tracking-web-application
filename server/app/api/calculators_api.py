from flask import Blueprint, request
from pydantic import ValidationError
from app.utils.decorators import logged_in_required
from app.utils.responses import create_response
from app.schemas.calculator_schemas import SavingsSchema, CreditSchema, PensionSchema, TaxFopSchema, BalanceForecastSchema

calculators = Blueprint('calculators', __name__)


@calculators.route('/savings', methods=['POST'])
@logged_in_required
def calculate_savings():
    data = request.get_json()
    if not data:
        return create_response(status_code=400, message='No input data provided')

    try:
        validated_data = SavingsSchema(**data)
    except ValidationError as e:
        return create_response(status_code=400, message='Invalid input', details=e.errors())

    P = validated_data.initial_sum
    r = validated_data.annual_rate / 100.0
    n = 12
    t = validated_data.term_months / 12.0

    final_amount = P * ((1 + r / n) ** (n * t))

    return create_response(
        status_code=200,
        message='Savings calculated successfully',
        data={'final_amount': round(final_amount, 2)}
    )


@calculators.route('/credit', methods=['POST'])
@logged_in_required
def calculate_credit():
    data = request.get_json()
    if not data:
        return create_response(status_code=400, message='No input data provided')

    try:
        validated_data = CreditSchema(**data)
    except ValidationError as e:
        return create_response(status_code=400, message='Invalid input', details=e.errors())

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
        message='Credit calculated successfully',
        data={
            'monthly_payment': round(monthly_payment, 2),
            'total_payment': round(total_payment, 2),
            'total_overpayment': round(total_overpayment, 2),
            'payment_schedule': payment_schedule
        }
    )


@calculators.route('/pension', methods=['POST'])
@logged_in_required
def calculate_pension():
    data = request.get_json()
    if not data:
        return create_response(status_code=400, message='No input data provided')

    try:
        validated_data = PensionSchema(**data)
    except ValidationError as e:
        return create_response(status_code=400, message='Invalid input', details=e.errors())

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
        message='Pension savings calculated successfully',
        data={'final_amount': round(total_savings, 2)}
    )


@calculators.route('/tax-fop', methods=['POST'])
@logged_in_required
def calculate_tax_fop():
    data = request.get_json()
    if not data:
        return create_response(status_code=400, message='No input data provided')

    try:
        validated_data = TaxFopSchema(**data)
    except ValidationError as e:
        return create_response(status_code=400, message='Invalid input', details=e.errors())

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
        message='FOP tax calculated successfully',
        data=response_data
    )


@calculators.route('/balance-forecast', methods=['POST'])
@logged_in_required
def calculate_balance_forecast():
    #TODO: This endpoint requires an implemented transaction system to fetch the user's average monthly income and expenses.
    pass