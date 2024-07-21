from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()


class Parva(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False)


class Sandhi(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    parva_id = db.Column(db.Integer, db.ForeignKey('parva.id'), nullable=False)
    name = db.Column(db.String(255), nullable=False)
    parva = db.relationship('Parva', backref=db.backref('sandhis', lazy=True))


class Padya(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    sandhi_id = db.Column(db.Integer, db.ForeignKey('sandhi.id'), nullable=False)
    name = db.Column(db.String(255), nullable=False)
    padya_number = db.Column(db.Integer, nullable=False)
    pathantar = db.Column(db.Text, nullable=True)
    gadya = db.Column(db.Text, nullable=True)
    tippani = db.Column(db.Text, nullable=True)
    artha = db.Column(db.Text, nullable=True)
    sandhi = db.relationship('Sandhi', backref=db.backref('padyas', lazy=True))
