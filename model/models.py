from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash

db = SQLAlchemy()


class Parva(db.Model):
    __tablename__ = 'parva'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    parvantya = db.Column(db.Text, nullable=True)  # New column added


class Sandhi(db.Model):
    __tablename__ = 'sandhi'
    id = db.Column(db.Integer, primary_key=True)
    parva_id = db.Column(db.Integer, db.ForeignKey('parva.id'), nullable=False)
    name = db.Column(db.String(255), nullable=False)
    parva = db.relationship('Parva', backref=db.backref('sandhis', lazy=True))


class Padya(db.Model):
    __tablename__ = 'padya'
    id = db.Column(db.Integer, primary_key=True)
    sandhi_id = db.Column(db.Integer, db.ForeignKey('sandhi.id'), nullable=False)
    padya_number = db.Column(db.Integer, nullable=False)
    pathantar = db.Column(db.Text, nullable=True)
    gadya = db.Column(db.Text, nullable=True)
    tippani = db.Column(db.Text, nullable=True)
    artha = db.Column(db.Text, nullable=True)
    suchane = db.Column(db.Text, nullable=True)  # New column added
    padya = db.Column(db.Text, nullable=True)  # New column added
    sandhi = db.relationship('Sandhi', backref=db.backref('padyas', lazy=True))


class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(255), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False)
    phone_number = db.Column(db.String(20), nullable=True)
    email = db.Column(db.String(255), nullable=True)

    def set_password(self, password):
        self.password = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password, password)
