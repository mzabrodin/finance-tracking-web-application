"""Contains api blueprints for the application.

This module initializes the API blueprints for the application, allowing for modular organization of routes.
"""

from flask import Blueprint
from app.api.auth_api import auth
from app.api.budget_api import budgets
from app.api.transactions_api import transactions
from app.api.users_api import users
from app.api.calculators_api import calculators
from app.api.categories_api import categories
from .feedback import feedback

api = Blueprint('api', __name__, url_prefix='/api')
"""Main API blueprint for the application."""

api.register_blueprint(auth, url_prefix='/auth')
api.register_blueprint(users, url_prefix='/users')
api.register_blueprint(budgets, url_prefix='/budgets')
api.register_blueprint(calculators, url_prefix='/calculators')
api.register_blueprint(categories, url_prefix='/categories')
api.register_blueprint(transactions, url_prefix='/transactions')
api.register_blueprint(feedback)