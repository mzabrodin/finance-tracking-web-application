from flask import Blueprint
from app.api.auth_api import auth
from app.api.budget_api import budgets
from app.api.users_api import users

api = Blueprint('api', __name__, url_prefix='/api')

api.register_blueprint(auth, url_prefix='/auth')
api.register_blueprint(users, url_prefix='/users')
api.register_blueprint(budgets, url_prefix='/budgets')