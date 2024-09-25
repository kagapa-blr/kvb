import os
import secrets
from datetime import timedelta

from flask import Flask, render_template, send_from_directory, request, redirect, url_for, session
from flask_migrate import Migrate
from werkzeug.security import check_password_hash

from model.models import db, User
from routers.additional import additonal_bp
from routers.parvya import parvya_bp
from routers.users import users_bp

app = Flask(__name__, static_folder='static', template_folder='templates')

# Load configuration from environment variables
app.config['SECRET_KEY'] = os.getenv('FLASK_SECRET_KEY', secrets.token_hex(16))
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'mysql://root:@127.0.0.1/kvb')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Set session timeout to 30 minutes
app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(minutes=30)

db.init_app(app)
migrate = Migrate(app, db)

# Register Blueprints
app.register_blueprint(parvya_bp, url_prefix='/api')
app.register_blueprint(additonal_bp)
app.register_blueprint(users_bp)


@app.before_request
def make_session_permanent():
    """Extend session for 30 minutes on each request."""
    session.permanent = True


@app.route('/')
def index():
    return render_template('test.html')


@app.route('/chitra-samputa')
def chitra_samputa():
    image_folder = 'static/images/chitra_samputa'
    image_files = [f for f in os.listdir(image_folder) if os.path.isfile(os.path.join(image_folder, f))]
    return render_template('chitra_samputa.html', images=image_files)


@app.route('/static/images/chitra_samputa/<filename>')
def get_image(filename):
    return send_from_directory('static/images/chitra_samputa', filename)


@app.route('/kavya')
def kavya():
    return render_template('test.html')


@app.route('/admin')
def admin():
    if 'user_id' not in session:
        return redirect(url_for('login'))
    return render_template('admin.html')


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
        username = request.form['username']
        password = request.form['password']
        try:
            user = User.query.filter_by(username=username).first()
            if user and check_password_hash(user.password, password):
                session['user_id'] = user.id
                session.permanent = True  # Mark the session as permanent (for 30 min)
                return redirect(url_for('admin'))
            error = 'Invalid username or password'
        except Exception as e:
            error = 'An error occurred while accessing the database. Please try again later.' + str(e)

        return render_template('login.html', error=error)

    return render_template('login.html')


@app.route('/logout')
def logout():
    session.pop('user_id', None)
    return redirect(url_for('index'))


@app.route('/videos')
def play_videos():
    video_dir = 'static/videos/'
    videos = [f for f in os.listdir(video_dir) if os.path.isfile(os.path.join(video_dir, f))]
    return render_template('additional/video-player.html', videos=videos)


@app.route('/static/videos/<filename>')
def get_video(filename):
    return send_from_directory('static/videos/', filename)


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=8000)
