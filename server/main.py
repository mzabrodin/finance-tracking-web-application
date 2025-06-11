"""Runs the Flask application with CORS enabled."""

from app import create_app

app = create_app()
"""variable app is the Flask application instance"""

if __name__ == '__main__':
    app.run()