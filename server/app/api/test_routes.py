from flask import Blueprint

test_routes = Blueprint('test_routes', __name__)

@test_routes.route('/test1', methods=('GET',))
def test1():
    return 'test1'