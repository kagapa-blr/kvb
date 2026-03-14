import os
import secrets
from datetime import timedelta
from dotenv import load_dotenv

from flask import Flask, render_template, send_from_directory, request, redirect, url_for, session
from werkzeug.security import check_password_hash

from config.db_config import get_config
from model.models import db, User, Parva, Sandhi, Padya
from routers.additional import additonal_bp
from routers.gamaka_vachana import gamaka_bp
from routers.parvya import parvya_bp
from routers.users import users_bp
from services.user_management import create_or_update_default_user

# Load environment variables
load_dotenv()

app = Flask(__name__, static_folder='static', template_folder='templates')

# Secret key
app.config['SECRET_KEY'] = os.getenv('FLASK_SECRET_KEY', secrets.token_hex(16))

# Database configuration using centralized config
db_config = get_config()
DATABASE_URL = db_config.get_database_url('pymysql')

app.config['SQLALCHEMY_DATABASE_URI'] = DATABASE_URL
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Session timeout
app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(minutes=30)

# Initialize SQLAlchemy
db.init_app(app)
with app.app_context():
    create_or_update_default_user()
# Register Blueprints
app.register_blueprint(parvya_bp, url_prefix='/api')
app.register_blueprint(additonal_bp)
app.register_blueprint(users_bp)
app.register_blueprint(gamaka_bp, url_prefix='/api')


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
def admin():
    """
    Admin Dashboard Route
    
    FUNCTIONALITY:
    - Display admin statistics (users, padyas, parvas, sandhis)
    - Manage admin users (add, view, delete)
    - Upload and manage additional content (Gade Suchi, Akaradi Suchi, Tippani)
    - Update database with new content
    
    ACCESS: Requires user login (session['user_id'])
    """
    if 'user_id' not in session:
        return redirect(url_for('login'))
    
    try:
        # Fetch statistics for dashboard
        total_users = User.query.count()
        total_padyas = Padya.query.count()
        total_parvas = Parva.query.count()
        total_sandhis = Sandhi.query.count()
        
        return render_template(
            'admin.html',
            total_users=total_users,
            total_padyas=total_padyas,
            total_parvas=total_parvas,
            total_sandhis=total_sandhis
        )
    except Exception as e:
        return render_template('admin.html', error=str(e))


@app.route('/stats')
def new_admin():
    return render_template('statistics.html')


@app.route('/update')
def update():
    if 'user_id' not in session:
        return redirect(url_for('login'))
    return render_template('update.html')


@app.route('/login', methods=['GET', 'POST'])
def login():

    if 'user_id' in session:
        return redirect(url_for('admin'))

    if request.method == 'POST':

        username = request.form.get('username')
        password = request.form.get('password')

        try:

            user = User.query.filter_by(username=username).first()

            if user and check_password_hash(user.password, password):

                session['user_id'] = user.id
                session.permanent = True

                return redirect(url_for('admin'))

            error = 'Invalid username or password'

        except Exception as e:

            error = f'Database error. Please try again later. {e}'

        return render_template('login.html', error=error)

    return render_template('login.html')


@app.route('/logout')
def logout():

    session.pop('user_id', None)

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