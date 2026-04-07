"""
JWT Authentication Service
Handles token generation, verification, and password reset token management
"""

import os
from datetime import datetime, timedelta
from functools import wraps
import jwt
from dotenv import load_dotenv
from flask import request, jsonify
from utils.logger import get_logger

load_dotenv()
logger = get_logger()

# Load JWT configuration from environment
JWT_SECRET = os.getenv('JWT_SECRET_KEY', os.getenv('FLASK_SECRET_KEY', 'your-secret-key'))
JWT_EXPIRATION_HOURS = int(os.getenv('JWT_EXPIRATION_HOURS', 1))
JWT_ALGORITHM = 'HS256'
PASSWORD_RESET_TOKEN_EXPIRATION_MINUTES = int(os.getenv('PASSWORD_RESET_TOKEN_EXPIRATION_MINUTES', 30))


class JWTService:
    """Service for JWT token operations"""
    
    @staticmethod
    def generate_token(user_id, username, expires_in_hours=JWT_EXPIRATION_HOURS):
        """
        Generate a JWT token for a user
        
        Args:
            user_id: User ID
            username: Username
            expires_in_hours: Token expiration time in hours
            
        Returns:
            JWT token string
        """
        try:
            payload = {
                'user_id': user_id,
                'username': username,
                'exp': datetime.utcnow() + timedelta(hours=expires_in_hours),
                'iat': datetime.utcnow()
            }
            token = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
            logger.info(f'Generated JWT token for user: {username}')
            return token
        except Exception as e:
            logger.error(f'Error generating JWT token: {str(e)}')
            raise
    
    @staticmethod
    def verify_token(token):
        """
        Verify and decode a JWT token
        
        Args:
            token: JWT token string
            
        Returns:
            Decoded payload if valid, None if invalid/expired
        """
        try:
            payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
            return payload
        except jwt.ExpiredSignatureError:
            logger.warning('JWT token has expired')
            return None
        except jwt.InvalidTokenError:
            logger.warning('Invalid JWT token')
            return None
        except Exception as e:
            logger.error(f'Error verifying JWT token: {str(e)}')
            return None
    
    @staticmethod
    def generate_password_reset_token(user_id, username):
        """
        Generate a password reset token (short-lived)
        
        Args:
            user_id: User ID
            username: Username
            
        Returns:
            Password reset token
        """
        try:
            payload = {
                'user_id': user_id,
                'username': username,
                'purpose': 'password_reset',
                'exp': datetime.utcnow() + timedelta(minutes=PASSWORD_RESET_TOKEN_EXPIRATION_MINUTES),
                'iat': datetime.utcnow()
            }
            token = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
            logger.info(f'Generated password reset token for user: {username}')
            return token
        except Exception as e:
            logger.error(f'Error generating password reset token: {str(e)}')
            raise
    
    @staticmethod
    def verify_password_reset_token(token):
        """
        Verify password reset token
        
        Args:
            token: Password reset token
            
        Returns:
            Decoded payload if valid and purpose is 'password_reset', None otherwise
        """
        try:
            payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
            # Verify it's actually a password reset token
            if payload.get('purpose') != 'password_reset':
                logger.warning('Token is not a password reset token')
                return None
            return payload
        except jwt.ExpiredSignatureError:
            logger.warning('Password reset token has expired')
            return None
        except jwt.InvalidTokenError:
            logger.warning('Invalid password reset token')
            return None
        except Exception as e:
            logger.error(f'Error verifying password reset token: {str(e)}')
            return None


def require_jwt(f):
    """
    Decorator to require valid JWT token in Authorization header
    Usage:
        @require_jwt
        def protected_route():
            pass
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        token = None
        
        # Check Authorization header
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            try:
                token = auth_header.split(" ")[1]
            except IndexError:
                return jsonify({'error': 'Invalid authorization header format'}), 401
        
        if not token:
            return jsonify({'error': 'Authorization token required'}), 401
        
        payload = JWTService.verify_token(token)
        if not payload:
            return jsonify({'error': 'Invalid or expired token'}), 401
        
        # Store user info in request context
        request.user_id = payload.get('user_id')
        request.username = payload.get('username')
        
        return f(*args, **kwargs)
    
    return decorated_function


def get_token_from_request():
    """Extract JWT token from Authorization header"""
    token = None
    
    if 'Authorization' in request.headers:
        auth_header = request.headers['Authorization']
        try:
            token = auth_header.split(" ")[1]
        except IndexError:
            return None
    
    return token
