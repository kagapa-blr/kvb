from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash

db = SQLAlchemy()


class Parva(db.Model):
    __tablename__ = 'parva'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    parva_number = db.Column(db.Integer, nullable=False, unique=True)  # Make parva_number unique
    parvantya = db.Column(db.Text, nullable=True)
    sandhis = db.relationship('Sandhi', backref='parva', cascade="all, delete-orphan")


class Sandhi(db.Model):
    __tablename__ = 'sandhi'
    id = db.Column(db.Integer, primary_key=True)
    parva_id = db.Column(db.Integer, db.ForeignKey('parva.id'), nullable=False)
    name = db.Column(db.String(255), nullable=False)
    sandhi_number = db.Column(db.Integer, nullable=False)  # New column
    padyas = db.relationship('Padya', backref='sandhi', cascade="all, delete-orphan")


class Padya(db.Model):
    __tablename__ = 'padya'
    id = db.Column(db.Integer, primary_key=True)
    sandhi_id = db.Column(db.Integer, db.ForeignKey('sandhi.id'), nullable=False)
    padya_number = db.Column(db.Integer, nullable=False)
    pathantar = db.Column(db.Text, nullable=True)
    gadya = db.Column(db.Text, nullable=True)
    tippani = db.Column(db.Text, nullable=True)
    artha = db.Column(db.Text, nullable=True)
    suchane = db.Column(db.Text, nullable=True)
    padya = db.Column(db.Text, nullable=True)


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


class AkaradiSuchi(db.Model):
    """
    A model representing the Akaradi Suchi entries in the database.

    Attributes:
    id (int): The primary key of the entry.
    padyafirstline (str): The first line of the padya.
    parva_id (int): The foreign key referencing the Parva model.
    sandhi_id (int): The foreign key referencing the Sandhi model.
    padya_number (int): The number of the padya within the Sandhi.

    Relationships:
    parva (Parva): The Parva associated with the Akaradi Suchi entry.
    sandhi (Sandhi): The Sandhi associated with the Akaradi Suchi entry.

    Constraints:
    UniqueConstraint: Ensures the combination of parva_id, sandhi_id, and padya_number is unique.
    """

    __tablename__ = 'akaradi_suchi'
    id = db.Column(db.Integer, primary_key=True)
    padyafirstline = db.Column(db.Text, nullable=False)
    parva_id = db.Column(db.Integer, db.ForeignKey('parva.id'), nullable=False)
    sandhi_id = db.Column(db.Integer, db.ForeignKey('sandhi.id'), nullable=False)
    padya_number = db.Column(db.Integer, nullable=False)

    # Relationships
    parva = db.relationship('Parva', backref='akaradi_suchi_entries')
    sandhi = db.relationship('Sandhi', backref='akaradi_suchi_entries')

    # Unique constraint to ensure the combination of parva_id, sandhi_id, and padya_number is unique
    __table_args__ = (
        db.UniqueConstraint('parva_id', 'sandhi_id', 'padya_number', name='unique_parva_sandhi_padya'),
    )


class GadeSuchigalu(db.Model):
    __tablename__ = 'gade_suchigalu'

    id = db.Column(db.Integer, primary_key=True)
    gade_suchi = db.Column(db.Text, nullable=False)
    parva_name = db.Column(db.String(255), nullable=True)  # Store parva name
    sandhi_number = db.Column(db.Integer, nullable=False)
    parva_number = db.Column(db.Integer, nullable=False)
    padya_number = db.Column(db.Integer, nullable=False)

    # Ensure uniqueness of the combination of parva_name, sandhi_number, and padya_number
    __table_args__ = (
        db.UniqueConstraint('gade_suchi', 'parva_name', 'sandhi_number', 'padya_number',
                            name='unique_gade_suchi_parva_sandhi_padya'),
    )


class Tippani(db.Model):
    """
    A model representing the Tippani entries in the database.

    Attributes:
    id (int): The primary key of the entry.
    tippani (str): The Tippani text.
    parva_id (int): The foreign key referencing the Parva model.
    sandhi_id (int): The foreign key referencing the Sandhi model.
    padya_number (int): The number of the padya within the Sandhi.

    Relationships:
    parva (Parva): The Parva associated with the Tippani entry.
    sandhi (Sandhi): The Sandhi associated with the Tippani entry.

    Constraints:
    UniqueConstraint: Ensures the combination of parva_id, sandhi_id, and padya_number is unique.
    """

    __tablename__ = 'tippani'
    id = db.Column(db.Integer, primary_key=True)
    tippani = db.Column(db.Text, nullable=False)
    parva_id = db.Column(db.Integer, db.ForeignKey('parva.id'), nullable=False)
    sandhi_id = db.Column(db.Integer, db.ForeignKey('sandhi.id'), nullable=False)
    padya_number = db.Column(db.Integer, nullable=False)

    # Relationships
    parva = db.relationship('Parva', backref='tippani_entries')
    sandhi = db.relationship('Sandhi', backref='tippani_entries')

    # Unique constraint to ensure the combination of parva_id, sandhi_id, and padya_number is unique
    __table_args__ = (
        db.UniqueConstraint('parva_id', 'sandhi_id', 'padya_number', name='unique_parva_sandhi_padya_tippani'),
    )
