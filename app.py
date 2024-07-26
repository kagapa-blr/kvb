import os

from flask import Flask, render_template, send_from_directory
from model.models import db
from routers.parvya import parvya_bp

app = Flask(__name__, static_folder='static', template_folder='templates')
app.config['SQLALCHEMY_DATABASE_URI'] = 'mysql://root:@127.0.0.1/kvb'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db.init_app(app)

# Register Blueprint
app.register_blueprint(parvya_bp, url_prefix='/api')


@app.route('/')
def index():
    return render_template('index.html')  # Make sure you have an index.html file in your templates folder


@app.route('/chitra/samputa')
def chitra_samputa():
    # Get a list of all image files in the directory
    image_folder = 'static/images/chitra_samputa'
    image_files = [f for f in os.listdir(image_folder) if os.path.isfile(os.path.join(image_folder, f))]
    return render_template('chitra_samputa.html', images=image_files)


@app.route('/static/images/chitra_samputa/<filename>')
def get_image(filename):
    return send_from_directory('static/images/chitra_samputa', filename)


@app.route('/kavya')
def kavya():
    return render_template('kavya.html')  # Make sure you have an index.html file in your templates folder


if __name__ == '__main__':
    app.run(debug=True)
