from flask import Blueprint, make_response
from flask_jwt_extended import get_jwt_identity, unset_jwt_cookies, get_jwt

from app.models.user_model import User
from app.utils.decorators import logged_in_required
from app.utils.responses import create_response

users = Blueprint('users', __name__)


@users.route('/me', methods=('GET',))
@logged_in_required
def get_current_user():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user:
        response = make_response(create_response(
            status_code=404,
            message='User not found'
        ))
        unset_jwt_cookies(response)
        return response

    claims = get_jwt()
    user_type = claims.get('user_type', None)
    if user.type == user_type:
        return create_response(
            status_code=200,
            message='User retrieved successfully',
            data=user.to_dict()
        )
    else:
        response = make_response(create_response(
            status_code=403,
            message='Forbidden: User type mismatch')
        )
        unset_jwt_cookies(response)
        return response
