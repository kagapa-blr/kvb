from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.schema import UniqueConstraint

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
