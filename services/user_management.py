import os
import re

from dotenv import load_dotenv
from model.models import db, User
from utils.logger import get_logger

load_dotenv()

logger = get_logger()

# Cache default admin username
_DEFAULT_ADMIN_USERNAME = os.getenv("DEFAULT_ADMIN_USERNAME")


def get_default_admin_username():
    """
    Get the default admin username from environment.
    :return: Default admin username or None
    """
    return _DEFAULT_ADMIN_USERNAME


def is_default_user(username):
    """
    Check if a user is the default admin user.
    :param username: Username to check
    :return: True if user is default admin, False otherwise
    """
    default_username = get_default_admin_username()
    return default_username and username == default_username


def validate_username(username):
    """
    Validate username format and length.
    :param username: Username to validate
    :return: Tuple (is_valid, error_message)
    """
    if not username or not isinstance(username, str):
        return False, "Username must be a non-empty string"
    
    username = username.strip()
    
    if len(username) < 3:
        return False, "Username must be at least 3 characters long"
    
    if len(username) > 255:
        return False, "Username must not exceed 255 characters"
    
    if not re.match(r"^[a-zA-Z0-9_.-]+$", username):
        return False, "Username can only contain letters, numbers, dots, hyphens, and underscores"
    
    return True, ""


def validate_password(password):
    """
    Validate password strength.
    :param password: Password to validate
    :return: Tuple (is_valid, error_message)
    """
    if not password or not isinstance(password, str):
        return False, "Password must be a non-empty string"
    
    if len(password) < 6:
        return False, "Password must be at least 6 characters long"
    
    if len(password) > 255:
        return False, "Password must not exceed 255 characters"
    
    return True, ""


def validate_email(email):
    """
    Validate email format.
    :param email: Email to validate
    :return: Tuple (is_valid, error_message)
    """
    if not email:
        return True, ""  # Email is optional
    
    if not isinstance(email, str):
        return False, "Email must be a string"
    
    email_regex = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
    if not re.match(email_regex, email):
        return False, "Invalid email format"
    
    return True, ""


def validate_phone(phone):
    """
    Validate phone number format.
    :param phone: Phone number to validate
    :return: Tuple (is_valid, error_message)
    """
    if not phone:
        return True, ""  # Phone is optional
    
    if not isinstance(phone, str):
        return False, "Phone number must be a string"
    
    if len(phone) > 20:
        return False, "Phone number must not exceed 20 characters"
    
    return True, ""


def create_or_update_default_user():
    """
    Create default admin user if not exists.
    If exists, update the details including password.

    Safe to run multiple times (idempotent).
    """

    username = os.getenv("DEFAULT_ADMIN_USERNAME")
    password = os.getenv("DEFAULT_ADMIN_PASSWORD")
    email = os.getenv("DEFAULT_ADMIN_EMAIL")
    phone = os.getenv("DEFAULT_ADMIN_PHONE")

    if not username or not password:
        logger.warning(
            "Default admin credentials not provided in .env"
        )
        return None

    try:
        user = User.query.filter_by(
            username=username
        ).first()

        if user:
            # Update existing user
            user.email = email
            user.phone_number = phone

            if password:
                user.set_password(password)

            logger.info("Default user updated.")

        else:
            # Create new user
            user = User(
                username=username,
                email=email,
                phone_number=phone,
            )

            user.set_password(password)

            db.session.add(user)

            logger.info("Default user created.")

        db.session.commit()

        return user

    except Exception as e:
        db.session.rollback()

        logger.error(
            "Failed to create/update default user: %s",
            e
        )

        raise


def get_all_users():
    """
    Get all users from the database.
    :return: List of users with their details
    """
    try:
        users = User.query.all()
        user_list = []
        for user in users:
            user_list.append({
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'phone_number': user.phone_number,
                'is_default': is_default_user(user.username)
            })
        return user_list
    except Exception as e:
        logger.error("Failed to fetch users: %s", e)
        raise


def get_user_by_username(username):
    """
    Get a specific user by username.
    :param username: Username to search for
    :return: User object or None
    """
    try:
        user = User.query.filter_by(username=username).first()
        if user:
            return {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'phone_number': user.phone_number,
                'is_default': is_default_user(user.username)
            }
        return None
    except Exception as e:
        logger.error("Failed to fetch user: %s", e)
        raise


def create_user(username, password, email=None, phone_number=None):
    """
    Create a new user with validation.
    :param username: Username
    :param password: Password
    :param email: Email (optional)
    :param phone_number: Phone number (optional)
    :return: Tuple (success, user_data/error_message)
    """
    try:
        # Validate inputs
        is_valid, error_msg = validate_username(username)
        if not is_valid:
            return False, error_msg
        
        is_valid, error_msg = validate_password(password)
        if not is_valid:
            return False, error_msg
        
        is_valid, error_msg = validate_email(email)
        if not is_valid:
            return False, error_msg
        
        is_valid, error_msg = validate_phone(phone_number)
        if not is_valid:
            return False, error_msg
        
        # Check if user already exists
        existing_user = User.query.filter_by(username=username).first()
        if existing_user:
            return False, f"User '{username}' already exists"
        
        # Create new user
        new_user = User(
            username=username,
            email=email,
            phone_number=phone_number
        )
        new_user.set_password(password)
        
        db.session.add(new_user)
        db.session.commit()
        
        logger.info(f"User '{username}' created successfully")
        
        return True, {
            'id': new_user.id,
            'username': new_user.username,
            'email': new_user.email,
            'phone_number': new_user.phone_number,
            'is_default': False
        }
    
    except Exception as e:
        db.session.rollback()
        logger.error(f"Failed to create user: {e}")
        return False, f"Failed to create user: {str(e)}"


def update_user(username, email=None, phone_number=None, password=None):
    """
    Update an existing user.
    Prevents modification of default admin user.
    :param username: Username of user to update
    :param email: New email (optional)
    :param phone_number: New phone number (optional)
    :param password: New password (optional)
    :return: Tuple (success, user_data/error_message)
    """
    try:
        # Check if this is the default user
        if is_default_user(username):
            return False, "Cannot modify the default admin user"
        
        # Find the user
        user = User.query.filter_by(username=username).first()
        if not user:
            return False, f"User '{username}' not found"
        
        # Validate inputs if provided
        if email is not None:
            is_valid, error_msg = validate_email(email)
            if not is_valid:
                return False, error_msg
            user.email = email
        
        if phone_number is not None:
            is_valid, error_msg = validate_phone(phone_number)
            if not is_valid:
                return False, error_msg
            user.phone_number = phone_number
        
        if password is not None:
            is_valid, error_msg = validate_password(password)
            if not is_valid:
                return False, error_msg
            user.set_password(password)
        
        db.session.commit()
        logger.info(f"User '{username}' updated successfully")
        
        return True, {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'phone_number': user.phone_number,
            'is_default': is_default_user(user.username)
        }
    
    except Exception as e:
        db.session.rollback()
        logger.error(f"Failed to update user: {e}")
        return False, f"Failed to update user: {str(e)}"


def delete_user(username):
    """
    Delete a user by username.
    Prevents deletion of default admin user.
    :param username: Username of user to delete
    :return: Tuple (success, message)
    """
    try:
        # Check if this is the default user
        if is_default_user(username):
            return False, "Cannot delete the default admin user"
        
        # Find and delete the user
        user = User.query.filter_by(username=username).first()
        if not user:
            return False, f"User '{username}' not found"
        
        db.session.delete(user)
        db.session.commit()
        logger.info(f"User '{username}' deleted successfully")
        
        return True, f"User '{username}' deleted successfully"
    
    except Exception as e:
        db.session.rollback()
        logger.error(f"Failed to delete user: {e}")
        return False, f"Failed to delete user: {str(e)}"

def request_password_reset(username):
    """
    Generate a password reset token for a user
    
    Args:
        username: Username requesting password reset
        
    Returns:
        Tuple (success: bool, result: str or token)
    """
    try:
        user = User.query.filter_by(username=username).first()
        
        if not user:
            return False, "User not found"
        
        # Import here to avoid circular imports
        from services.jwt_service import JWTService
        
        reset_token = JWTService.generate_password_reset_token(user.id, user.username)
        logger.info(f"Password reset token generated for user: {username}")
        
        return True, reset_token
    
    except Exception as e:
        logger.error(f"Failed to generate password reset token: {e}")
        return False, f"Failed to generate reset token: {str(e)}"


def reset_password_with_token(reset_token, new_password):
    """
    Reset user password using reset token
    
    Args:
        reset_token: Password reset token
        new_password: New password
        
    Returns:
        Tuple (success: bool, message: str)
    """
    try:
        # Import here to avoid circular imports
        from services.jwt_service import JWTService
        
        # Verify token
        payload = JWTService.verify_password_reset_token(reset_token)
        if not payload:
            return False, "Invalid or expired reset token"
        
        user_id = payload.get('user_id')
        
        # Validate new password
        is_valid, error_msg = validate_password(new_password)
        if not is_valid:
            return False, error_msg
        
        # Get user
        user = User.query.get(user_id)
        if not user:
            return False, "User not found"
        
        # Update password
        user.set_password(new_password)
        db.session.commit()
        
        logger.info(f"Password reset successful for user: {user.username}")
        return True, "Password reset successfully"
    
    except Exception as e:
        db.session.rollback()
        logger.error(f"Failed to reset password: {e}")
        return False, f"Failed to reset password: {str(e)}"


def change_password(username, old_password, new_password):
    """
    Change password for authenticated user
    
    Args:
        username: Username
        old_password: Current password
        new_password: New password
        
    Returns:
        Tuple (success: bool, message: str)
    """
    try:
        user = User.query.filter_by(username=username).first()
        
        if not user:
            return False, "User not found"
        
        # Verify old password
        if not user.check_password(old_password):
            return False, "Current password is incorrect"
        
        # Validate new password
        is_valid, error_msg = validate_password(new_password)
        if not is_valid:
            return False, error_msg
        
        # Update password
        user.set_password(new_password)
        db.session.commit()
        
        logger.info(f"Password changed successfully for user: {username}")
        return True, "Password changed successfully"
    
    except Exception as e:
        db.session.rollback()
        logger.error(f"Failed to change password: {e}")
        return False, f"Failed to change password: {str(e)}"