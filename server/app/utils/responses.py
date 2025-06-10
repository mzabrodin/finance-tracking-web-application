"""Custom methods for creating standardized JSON responses in Flask applications."""

from flask import jsonify, Response


def create_response(status_code: int, message: str = None, data=None, details: str = None) -> tuple[Response, int]:
    """Create a standardized JSON response for API endpoints.

    Args:
        status_code (int): HTTP status code for the response.
        message (str, optional): A brief message describing the response.
        data (Any, optional): Data to include in the response.
        details (str, optional): Additional details about the response.

    Returns:
        tuple: A tuple containing the JSON response and the HTTP status code.
    """
    response = {
        'status': 'success' if status_code < 400 else 'error',
        'message': message,
    }
    if data is not None:
        response['data'] = data
    if details is not None:
        response['details'] = details

    return jsonify(response), status_code
