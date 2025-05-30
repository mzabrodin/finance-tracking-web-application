from flask import Blueprint
from app.api.auth_api import auth

api = Blueprint('api', __name__, url_prefix='/api')

api.register_blueprint(auth, url_prefix='/auth')
