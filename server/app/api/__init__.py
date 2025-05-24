from flask import Blueprint
from .test_routes import test_routes

api = Blueprint('api', __name__, url_prefix='/api')

api.register_blueprint(test_routes, url_prefix='/test')