from flask import Blueprint, request, jsonify
from model.models import db, User

users_bp = Blueprint('users', __name__, url_prefix='/api/users')


@users_bp.route('/', methods=['POST'])
def add_user():
    data = request.get_json()
    if not data or not 'username' in data or not 'password' in data:
        return jsonify({'error': 'Username and password are required'}), 400

    username = data['username']
    password = data['password']
    phone_number = data.get('phone_number')
    email = data.get('email')

    if User.query.filter_by(username=username).first():
        return jsonify({'error': 'User already exists'}), 400

    new_user = User(username=username, phone_number=phone_number, email=email)
    new_user.set_password(password)
    db.session.add(new_user)
    db.session.commit()

    return jsonify({'message': 'User added successfully'}), 201

@users_bp.route('/<username>', methods=['DELETE'])
def remove_user(username):
    """
    API endpoint to remove a user by username.
    :param username: The username of the user to be removed.
    :return: JSON response indicating success or failure.
    """
    user = User.query.filter_by(username=username).first()
    if not user:
        return jsonify({'error': 'User not found'}), 404

    db.session.delete(user)
    db.session.commit()

    return jsonify({'message': 'User removed successfully'}), 200


@users_bp.route('', methods=['GET'])
def get_users():
    """
    API endpoint to get a list of all users.
    :return: JSON response with a list of users.
    """
    users = User.query.all()
    user_list = [
        {
            'username': user.username,
            'phone_number': user.phone_number,
            'email': user.email
        }
        for user in users
    ]
    if len(user_list) == 0:
        return jsonify({'error': 'No users found'}), 404

    return jsonify(user_list), 200
