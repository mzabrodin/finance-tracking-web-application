from flask import Flask
from flask_cors import CORS


def create_app():
    from app.api import api
    from app.config import Config

    app = Flask(__name__)
    app.config.from_object(Config)

    from app.utils.extensions import db, jwt, bcrypt

    db.init_app(app)
    jwt.init_app(app)
    bcrypt.init_app(app)

    CORS(app, resources={r"/*": {"origins": "*"}})

    app.register_blueprint(api)

    return app
