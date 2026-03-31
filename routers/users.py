from flask import Blueprint, request, jsonify

from services.user_management import (
    is_default_user,
    get_all_users,
    get_user_by_username,
    create_user,
    update_user,
    delete_user
)

users_bp = Blueprint('users', __name__)


@users_bp.route('/', methods=['GET'])
def fetch_all_users():
    """
    API endpoint to get a list of all users.
    :return: JSON response with a list of users.
    """
    try:
        user_list = get_all_users()
        if len(user_list) == 0:
            return jsonify({'error': 'No users found'}), 404
        return jsonify(user_list), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@users_bp.route('/<username>', methods=['GET'])
def get_user(username):
    """
    API endpoint to get a specific user by username.
    :param username: The username to fetch
    :return: JSON response with user details
    """
    try:
        user_data = get_user_by_username(username)
        if not user_data:
            return jsonify({'error': f'User "{username}" not found'}), 404
        return jsonify(user_data), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@users_bp.route('/', methods=['POST'])
def add_user():
    """
    API endpoint to create a new user.
    :return: JSON response with created user details or error
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'Request body is required'}), 400
        
        username = data.get('username', '').strip()
        password = data.get('password', '').strip()
        email = data.get('email', '').strip() or None
        phone_number = data.get('phone_number', '').strip() or None
        
        success, result = create_user(username, password, email, phone_number)
        
        if success:
            return jsonify({
                'message': 'User created successfully',
                'user': result
            }), 201
        else:
            return jsonify({'error': result}), 400
    
    except Exception as e:
        return jsonify({'error': f'Failed to create user: {str(e)}'}), 500


@users_bp.route('/<username>', methods=['PUT'])
def modify_user(username):
    """
    API endpoint to update a user.
    Cannot modify the default admin user.
    :param username: The username of the user to update
    :return: JSON response with updated user details or error
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'Request body is required'}), 400
        
        # Check if trying to modify default user
        if is_default_user(username):
            return jsonify({
                'error': 'Cannot modify the default admin user',
                'code': 'DEFAULT_USER_PROTECTED'
            }), 403
        
        email = data.get('email', None)
        phone_number = data.get('phone_number', None)
        password = data.get('password', None)
        
        # At least one field must be provided
        if email is None and phone_number is None and password is None:
            return jsonify({'error': 'At least one field (email, phone_number, or password) is required'}), 400
        
        success, result = update_user(username, email, phone_number, password)
        
        if success:
            return jsonify({
                'message': 'User updated successfully',
                'user': result
            }), 200
        else:
            return jsonify({'error': result}), 400
    
    except Exception as e:
        return jsonify({'error': f'Failed to update user: {str(e)}'}), 500


@users_bp.route('/<username>', methods=['DELETE'])
def remove_user(username):
    """
    API endpoint to delete a user by username.
    Cannot delete the default admin user.
    :param username: The username of the user to delete
    :return: JSON response indicating success or failure
    """
    try:
        # Check if trying to delete default user
        if is_default_user(username):
            return jsonify({
                'error': 'Cannot delete the default admin user',
                'code': 'DEFAULT_USER_PROTECTED'
            }), 403
        
        success, message = delete_user(username)
        
        if success:
            return jsonify({'message': message}), 200
        else:
            return jsonify({'error': message}), 400
    
    except Exception as e:
        return jsonify({'error': f'Failed to delete user: {str(e)}'}), 500
