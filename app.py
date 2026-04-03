import logging
import os
import secrets
from datetime import timedelta

from dotenv import load_dotenv
from flask import Flask, render_template, request, redirect, url_for, session, flash, jsonify
from sqlalchemy import or_

from config.db_config import get_config
from model.models import db, User, Parva, Sandhi, Padya
from routers.additional import additonal_bp
from routers.api_routes.additional_api_routes import additional_api_routes

from routers.gamaka_vachana import gamaka_bp
from routers.parvya import parvya_bp
from routers.users import users_bp
from routers.web_routes.additional_web_routes import additonal_web_routes
from routers.web_routes.admin_routes import admin_ui_routes
from services.additional_service import AkaradiSuchiService
from services.jwt_service import JWTService, require_jwt
from services.user_management import (
    create_or_update_default_user,
    request_password_reset,
    reset_password_with_token,
    change_password
)
from utils.auth_decorator import login_required

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

app = Flask(__name__, static_folder='static', template_folder='templates')

# Secret key
app.config['SECRET_KEY'] = os.getenv('FLASK_SECRET_KEY', secrets.token_hex(16))

# Database configuration using centralized config
config = get_config()

engine = config.get_engine()

app.config["SQLALCHEMY_DATABASE_URI"] = (config.get_database_url())

app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Session timeout
app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(minutes=30)

# Initialize SQLAlchemy
db.init_app(app)
with app.app_context():
    create_or_update_default_user()
    AkaradiSuchiService().refresh_akaradi_suchi()

# Register Blueprints
app.register_blueprint(parvya_bp, url_prefix='/api/v1')
app.register_blueprint(additonal_bp)
app.register_blueprint(users_bp, url_prefix='/api/v1/users')
app.register_blueprint(gamaka_bp, url_prefix='/api')
app.register_blueprint(admin_ui_routes)

app.register_blueprint(additonal_web_routes,url_prefix='/additional')
app.register_blueprint(additional_api_routes,url_prefix='/api/v1/additional')


@app.before_request
def make_session_permanent():
    """Extend session for 30 minutes on each request."""
    session.permanent = True


@app.route('/')
def index():
    return render_template('test.html')



@app.route('/kavya')
def kavya():
    return render_template('test.html')


@app.route('/admin')
@login_required
def admin():
    """
    Admin Dashboard Route
    
    FUNCTIONALITY:
    - Display admin statistics (users, padyas, parvas, sandhis)
    - Manage admin users (add, view, delete)
    - Upload and manage additional content (Gade Suchi, Akaradi Suchi, Tippani)
    - Update database with new content
    
    PROTECTED: Requires user login (session['user_id'])
    """
    try:
        # Fetch statistics for dashboard
        total_users = User.query.count()
        total_padyas = Padya.query.count()
        total_parvas = Parva.query.count()
        total_sandhis = Sandhi.query.count()

        return render_template(
            'admin/dashboard.html',
            total_users=total_users,
            total_padyas=total_padyas,
            total_parvas=total_parvas,
            total_sandhis=total_sandhis
        )
    except Exception as e:
        logger.error(f'Error loading admin dashboard: {str(e)}')
        return render_template('admin.html', error=str(e))


@app.route('/stats')
def new_admin():
    return render_template('statistics.html')


@app.route('/login', methods=['GET', 'POST'])
def login():
    """
    Login Route
    
    GET: Display login form
    POST: Process login credentials & generate JWT token
    
    FEATURES:
    - Redirect to admin if already logged in
    - Validate username and password
    - Generate JWT token (1 hour expiration)
    - Create persistent session for 30 minutes
    - Log authentication attempts
    
    RESPONSES:
    - Success: JWT token + session
    - Failure: Error message
    """

    # Redirect if already logged in
    if 'user_id' in session:
        return redirect(url_for('admin'))

    if request.method == 'POST':
        credential = request.form.get('username', '').strip()  # Can be username or email
        password = request.form.get('password', '')

        # Validate input
        if not credential or not password:
            logger.warning(f'Login attempt with missing credentials from {request.remote_addr}')
            return render_template('login.html', error='ಬಳಕೆದಾರ ಹೆಸರು ಮತ್ತು ಗುಪ್ತಪದ ಎರಡೂ ಅಗತ್ಯ')

        try:
            # Query user by username OR email
            user = User.query.filter(or_(User.username == credential, User.email == credential)).first()

            # Verify credentials
            if user and user.check_password(password):
                # Generate JWT token
                jwt_token = JWTService.generate_token(user.id, user.username)
                
                # Set session
                session['user_id'] = user.id
                session['username'] = user.username
                session['jwt_token'] = jwt_token
                session.permanent = True

                logger.info(f'User {user.username} logged in successfully with JWT token')

                # Redirect to admin dashboard
                return redirect(url_for('admin'))
            else:
                # Log failed attempt
                logger.warning(f'Failed login attempt for credential {credential} from {request.remote_addr}')
                return render_template('login.html', error='ತಪ್ಪು ಬಳಕೆದಾರ ಹೆಸರು/ಇಮೇಲ್ ಅಥವಾ ಗುಪ್ತಪದ')

        except Exception as e:
            logger.error(f'Database error during login: {str(e)}')
            return render_template('login.html', error='ಡೇಟಾಬೇಸ್ ದೋಷ. ದಯವಿಟ್ಟು ನಂತರ ಪುನಃ ಪ್ರಯತ್ನಿಸಿ.')

    return render_template('login.html')


@app.route('/logout')
def logout():
    """
    Logout Route
    
    FEATURES:
    - Clear session data including JWT token
    - Log logout event
    - Redirect to home page
    """

    username = session.get('username', 'Unknown')

    # Clear session
    session.pop('user_id', None)
    session.pop('username', None)
    session.pop('jwt_token', None)

    logger.info(f'User {username} logged out')

    return redirect(url_for('index'))


@app.route('/api/v1/auth/forgot-password', methods=['POST'])
def forgot_password():
    """
    Password Reset Request
    
    POST: Request password reset token
    
    JSON Body:
    {
        "username": "username"
    }
    
    Returns:
    - Success: Password reset token
    - Failure: Error message
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'Request body required'}), 400
        
        username = data.get('username', '').strip()
        if not username:
            return jsonify({'error': 'Username required'}), 400
        
        success, result = request_password_reset(username)
        
        if success:
            return jsonify({
                'message': 'Password reset token generated',
                'reset_token': result
            }), 200
        else:
            return jsonify({'error': result}), 400
    
    except Exception as e:
        logger.error(f'Error in forgot_password: {str(e)}')
        return jsonify({'error': f'Server error: {str(e)}'}), 500


@app.route('/api/v1/auth/reset-password', methods=['POST'])
def reset_password():
    """
    Password Reset Confirmation
    
    POST: Reset password using reset token
    
    JSON Body:
    {
        "reset_token": "token",
        "new_password": "new_password"
    }
    
    Returns:
    - Success: Password reset confirmation
    - Failure: Error message
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'Request body required'}), 400
        
        reset_token = data.get('reset_token', '').strip()
        new_password = data.get('new_password', '').strip()
        
        if not reset_token or not new_password:
            return jsonify({'error': 'Reset token and new password required'}), 400
        
        success, result = reset_password_with_token(reset_token, new_password)
        
        if success:
            return jsonify({'message': result}), 200
        else:
            return jsonify({'error': result}), 400
    
    except Exception as e:
        logger.error(f'Error in reset_password: {str(e)}')
        return jsonify({'error': f'Server error: {str(e)}'}), 500


@app.route('/api/v1/auth/change-password', methods=['POST'])
@require_jwt
def change_password_route():
    """
    Change Password (Authenticated User)
    
    POST: Change password for currently logged in user
    Requires: Valid JWT token
    
    JSON Body:
    {
        "old_password": "current_password",
        "new_password": "new_password"
    }
    
    Returns:
    - Success: Password change confirmation
    - Failure: Error message
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'Request body required'}), 400
        
        username = request.username
        old_password = data.get('old_password', '').strip()
        new_password = data.get('new_password', '').strip()
        
        if not old_password or not new_password:
            return jsonify({'error': 'Old and new passwords required'}), 400
        
        success, result = change_password(username, old_password, new_password)
        
        if success:
            return jsonify({'message': result}), 200
        else:
            return jsonify({'error': result}), 400
    
    except Exception as e:
        logger.error(f'Error in change_password: {str(e)}')
        return jsonify({'error': f'Server error: {str(e)}'}), 500


@app.route('/profile', methods=['GET', 'POST'])
@login_required
def profile():
    """
    User Profile Edit Route
    
    GET: Display user profile with existing details
    POST: Update user profile (email, phone, password)
    
    PROTECTED: Requires user login
    """
    try:
        user_id = session.get('user_id')
        user = User.query.get(user_id)
        
        if not user:
            flash('User not found', 'error')
            return redirect(url_for('logout'))
        
        if request.method == 'GET':
            # Display profile with existing data
            return render_template(
                'profile.html',
                user={
                    'username': user.username,
                    'email': user.email or '',
                    'phone_number': user.phone_number or ''
                }
            )
        
        elif request.method == 'POST':
            # Update profile
            email = request.form.get('email', '').strip() or None
            phone = request.form.get('phone_number', '').strip() or None
            new_password = request.form.get('new_password', '').strip()
            old_password = request.form.get('old_password', '').strip()
            
            # Update email and phone
            if email:
                user.email = email
            if phone:
                user.phone_number = phone
            
            # Update password if provided
            if new_password:
                if not old_password:
                    flash('Current password required to change password', 'error')
                    return redirect(url_for('profile'))
                
                if not user.check_password(old_password):
                    flash('Current password is incorrect', 'error')
                    return redirect(url_for('profile'))
                
                user.set_password(new_password)
            
            db.session.commit()
            logger.info(f'User {user.username} profile updated')
            flash('Profile updated successfully', 'success')
            return redirect(url_for('admin'))
        
    except Exception as e:
        logger.error(f'Error in profile route: {str(e)}')
        flash(f'Error: {str(e)}', 'error')
        return redirect(url_for('admin'))


if __name__ == '__main__':
    app.run(
        debug=False,
        host='0.0.0.0',
        port=8443
    )