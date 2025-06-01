from functools import wraps

from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt

from app.utils.responses import create_response


def logged_in_required(f):
    """Decorator to ensure the user is logged in before accessing a route.

    This decorator checks if the user is authenticated by verifying the JWT token.
    If the user is not authenticated, it returns a 401 Unauthorized response.
    """

    @wraps(f)
    @jwt_required()
    def decorated_function(*args, **kwargs):
        user_id = get_jwt_identity()
        if not user_id:
            return create_response(
                status_code=401,
                message='User not logged in'
            )

        return f(*args, **kwargs)

    return decorated_function


def user_type_required(*user_type_allowed: str):
    """Decorator to ensure the user has one of the allowed user types.
    This decorator checks the user's type from the JWT claims and ensures it matches
    one of the specified allowed types. If not, it returns a 403 Forbidden response.
    Args:
        user_type_allowed (str): Allowed user types that can access the route.
    """

    def decorator(f):
        @wraps(f)
        @logged_in_required
        def decorated_function(*args, **kwargs):
            claims = get_jwt()
            if not claims or claims.get('user_type') not in user_type_allowed:
                return create_response(403, 'Access forbidden: insufficient permissions')

            return f(*args, **kwargs)

        return decorated_function

    return decorator


def admin_required(f):
    """Decorator to ensure the user is an admin.

    This decorator checks if the user has the 'admin' type in their JWT claims.
    If not, it returns a 403 Forbidden response.
    """

    @wraps(f)
    @user_type_required('admin')
    def decorated_function(*args, **kwargs):
        return f(*args, **kwargs)

    return decorated_function
