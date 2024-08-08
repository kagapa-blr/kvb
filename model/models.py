from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.schema import UniqueConstraint
from werkzeug.security import generate_password_hash, check_password_hash

db = SQLAlchemy()


class Parva(db.Model):
    __tablename__ = 'parva'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False, unique=True)


class Sandhi(db.Model):
    __tablename__ = 'sandhi'
    id = db.Column(db.Integer, primary_key=True)
    parva_id = db.Column(db.Integer, db.ForeignKey('parva.id'), nullable=False)
    name = db.Column(db.String(255), nullable=False)
    parva = db.relationship('Parva', backref=db.backref('sandhis', lazy=True))
    __table_args__ = (UniqueConstraint('parva_id', 'name', name='uix_1'),)


class Padya(db.Model):
    __tablename__ = 'padya'
    id = db.Column(db.Integer, primary_key=True)
    sandhi_id = db.Column(db.Integer, db.ForeignKey('sandhi.id'), nullable=False)
    padya_number = db.Column(db.Integer, nullable=False)
    pathantar = db.Column(db.Text, nullable=True)
    gadya = db.Column(db.Text, nullable=True)
    tippani = db.Column(db.Text, nullable=True)
    artha = db.Column(db.Text, nullable=True)
    padya = db.Column(db.Text, nullable=True)  # New column added
    sandhi = db.relationship('Sandhi', backref=db.backref('padyas', lazy=True))

    __table_args__ = (
        UniqueConstraint('sandhi_id', 'padya_number', name='uix_sandhi_padya_number'),
    )


class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False)
    phone_number = db.Column(db.String(20))
    email = db.Column(db.String(120))

    def set_password(self, password):
        self.password = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password, password)
