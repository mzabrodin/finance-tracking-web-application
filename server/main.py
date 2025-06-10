"""Runs the Flask application with CORS enabled."""

from app import create_app
from flask_cors import CORS

app = create_app()
"""variable app is the Flask application instance"""

CORS(app, supports_credentials=True)

if __name__ == '__main__':
    app.run()