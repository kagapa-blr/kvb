from flask import Flask, render_template
from model.models import db
from routers.parvya import parvya_bp

app = Flask(__name__, static_folder='static', template_folder='templates')
app.config['SQLALCHEMY_DATABASE_URI'] = 'mysql://root:@localhost/kvb'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db.init_app(app)

# Register Blueprint
app.register_blueprint(parvya_bp, url_prefix='/api')


@app.route('/')
def index():
    return render_template('index.html')  # Make sure you have an index.html file in your templates folder


@app.route('/kavya')
def kavya():
    return render_template('kavya.html')  # Make sure you have an index.html file in your templates folder


if __name__ == '__main__':
    app.run(debug=True)
