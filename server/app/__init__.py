"""Flask application factory for the app package.

This module contains the application factory function `create_app`.

Packages:
    - api: Contains the API routes and logic.
    - models: Contains the database models.
    - schemas: Contains the data validation schemas.
    - utils: Contains utility functions and classes.

Modules:
    - config: Configuration settings for the application.
"""

from flask import Flask
from flask_cors import CORS


def create_app() -> Flask:
    """Creates and configures the Flask application.

    Configures the application with settings from the Config class,
    initializes extensions like database, JWT, and bcrypt, and sets up
    CORS for the application.

    Returns:
        Flask: The configured Flask application instance.
    """
    from app.api import api
    from app.config import Config

    app = Flask(__name__)
    app.config.from_object(Config)

    from app.utils.extensions import db, jwt, bcrypt

    db.init_app(app)
    jwt.init_app(app)
    bcrypt.init_app(app)

    CORS(app, resources={
        r"/*": {
            "origins": ["http://localhost:3000", "https://your-frontend-domain.com"],
            "supports_credentials": True
        }
    })

    app.register_blueprint(api)

    return app
