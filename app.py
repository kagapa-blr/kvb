import os
import secrets
import logging
from datetime import timedelta
from dotenv import load_dotenv

from flask import Flask, render_template, send_from_directory, request, redirect, url_for, session, flash
from werkzeug.security import check_password_hash

from config import db_config
from config.db_config import get_config
from model.models import db, User, Parva, Sandhi, Padya
from routers.additional import additonal_bp
from routers.gamaka_vachana import gamaka_bp
from routers.parvya import parvya_bp
from routers.users import users_bp
from routers.web_routes.admin_routes import admin_ui_routes
from services.user_management import create_or_update_default_user
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
# Register Blueprints
app.register_blueprint(parvya_bp, url_prefix='/api/v1')
app.register_blueprint(additonal_bp)
app.register_blueprint(users_bp, url_prefix='/api/v1/users')
app.register_blueprint(gamaka_bp, url_prefix='/api')
app.register_blueprint(admin_ui_routes)


@app.before_request
def make_session_permanent():
    """Extend session for 30 minutes on each request."""
    session.permanent = True


@app.route('/')
def index():
    return render_template('test.html')


@app.route('/chitra-samputa')
def chitra_samputa():
    image_folder = os.path.join(app.static_folder, 'images', 'chitra_samputa')

    image_files = [
        f for f in os.listdir(image_folder)
        if os.path.isfile(os.path.join(image_folder, f))
    ]

    return render_template('chitra_samputa.html', images=image_files)


@app.route('/static/images/chitra_samputa/<filename>')
def get_image(filename):
    return send_from_directory(
        os.path.join(app.static_folder, 'images', 'chitra_samputa'),
        filename
    )


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


@app.route('/update')
@login_required
def update():
    """
    Update/Upload Content Route
    
    FUNCTIONALITY:
    - Upload and manage additional content
    - Update database with new data
    
    PROTECTED: Requires user login
    """
    return render_template('update.html')


@app.route('/login', methods=['GET', 'POST'])
def login():
    """
    Login Route
    
    GET: Display login form
    POST: Process login credentials
    
    FEATURES:
    - Redirect to admin if already logged in
    - Validate username and password
    - Create persistent session for 30 minutes
    - Log authentication attempts
    - Display user-friendly error messages
    
    ERRORS:
    - Invalid credentials: Display error message
    - Database error: Display generic error message
    """
    
    # Redirect if already logged in
    if 'user_id' in session:
        return redirect(url_for('admin'))

    if request.method == 'POST':
        username = request.form.get('username', '').strip()
        password = request.form.get('password', '')

        # Validate input
        if not username or not password:
            logger.warning(f'Login attempt with missing credentials from {request.remote_addr}')
            return render_template('login.html', error='ಬಳಕೆದಾರ ಹೆಸರು ಮತ್ತು ಗುಪ್ತಪದ ಎರಡೂ ಅಗತ್ಯ')

        try:
            # Query user from database
            user = User.query.filter_by(username=username).first()

            # Verify credentials
            if user and user.check_password(password):
                # Set session
                session['user_id'] = user.id
                session['username'] = user.username
                session.permanent = True
                
                logger.info(f'User {username} logged in successfully')
                
                # Redirect to admin dashboard
                return redirect(url_for('admin'))
            else:
                # Log failed attempt
                logger.warning(f'Failed login attempt for user {username} from {request.remote_addr}')
                return render_template('login.html', error='ತಪ್ಪು ಬಳಕೆದಾರ ಹೆಸರು ಅಥವಾ ಗುಪ್ತಪದ')

        except Exception as e:
            logger.error(f'Database error during login: {str(e)}')
            return render_template('login.html', error='ಡೇಟಾಬೇಸ್ ದೋಷ. ದಯವಿಟ್ಟು ನಂತರ ಪುನಃ ಪ್ರಯತ್ನಿಸಿ.')

    return render_template('login.html')


@app.route('/logout')
def logout():
    """
    Logout Route
    
    FEATURES:
    - Clear session data
    - Log logout event
    - Redirect to home page
    """
    
    username = session.get('username', 'Unknown')
    
    # Clear session
    session.pop('user_id', None)
    session.pop('username', None)
    
    logger.info(f'User {username} logged out')
    
    return redirect(url_for('index'))


@app.route('/videos')
def play_videos():

    video_dir = os.path.join(app.static_folder, 'videos')

    videos = [
        f for f in os.listdir(video_dir)
        if os.path.isfile(os.path.join(video_dir, f))
    ]

    return render_template(
        'additional/video-player.html',
        videos=videos
    )


@app.route('/static/videos/<filename>')
def get_video(filename):

    return send_from_directory(
        os.path.join(app.static_folder, 'videos'),
        filename
    )


if __name__ == '__main__':

    app.run(
        debug=False,
        host='0.0.0.0',
        port=8443
    )