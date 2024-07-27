import os
from flask import Flask, render_template, send_from_directory, request, jsonify, redirect, url_for, session
from flask_migrate import Migrate
from werkzeug.security import check_password_hash, generate_password_hash

from model.models import db, User
from routers.parvya import parvya_bp
from routers.users import users_bp

app = Flask(__name__, static_folder='static', template_folder='templates')
app.config['SQLALCHEMY_DATABASE_URI'] = 'mysql://root:@127.0.0.1/kvb'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = 'your_secret_key_here'  # Replace with a secure key
db.init_app(app)

# Register Blueprints
app.register_blueprint(parvya_bp, url_prefix='/api')
app.register_blueprint(users_bp)
migrate = Migrate(app, db)


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/chitra/samputa')
def chitra_samputa():
    image_folder = 'static/images/chitra_samputa'
    image_files = [f for f in os.listdir(image_folder) if os.path.isfile(os.path.join(image_folder, f))]
    return render_template('chitra_samputa.html', images=image_files)


@app.route('/static/images/chitra_samputa/<filename>')
def get_image(filename):
    return send_from_directory('static/images/chitra_samputa', filename)


@app.route('/kavya')
def kavya():
    return render_template('kavya.html')


@app.route('/admin')
def admin():
    if 'user_id' not in session:
        return redirect(url_for('login'))
    return render_template('admin.html')


@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']

        user = User.query.filter_by(username=username).first()
        if user and check_password_hash(user.password, password):
            session['user_id'] = user.id
            return redirect(url_for('admin'))

        return render_template('login.html', error='Invalid username or password')

    return render_template('login.html')


@app.route('/logout')
def logout():
    session.pop('user_id', None)
    return redirect(url_for('index'))


# Add other routes here...

if __name__ == '__main__':
    app.run(debug=True, host='127.0.0.1', port=8000)
