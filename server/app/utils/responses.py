from flask import jsonify


def create_response(status_code, message=None, data=None, details=None):
    response = {
        'status': 'success' if status_code < 400 else 'error',
        'message': message,
        'data': data,
        'details': details
    }
    return jsonify(response), status_code
