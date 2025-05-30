from functools import wraps

from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt


def logged(f):
    @wraps(f)
    @jwt_required()
    def decorated_function(*args, **kwargs):
        user_id = get_jwt_identity()
        if not user_id:
            return {'error': 'Unauthorized'}, 401

        return f(*args, **kwargs)

    return decorated_function


def user_type_required(*user_type_allowed):
    def decorator(f):
        @wraps(f)
        @logged
        def decorated_function(*args, **kwargs):
            claims = get_jwt()
            if not claims or claims.get('user_type') not in user_type_allowed:
                return {'error': 'Access forbidden'}, 403

            return f(*args, **kwargs)

        return decorated_function

    return decorator


def admin_required(f):
    @wraps(f)
    @logged
    def decorated_function(*args, **kwargs):
        claims = get_jwt()
        if not claims or claims.get('user_type') != 'admin':
            return {'error': 'Admin access required'}, 403

        return f(*args, **kwargs)

    return decorated_function
