from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash

db = SQLAlchemy()


# -------------------------------------------------------
# PARVA
# -------------------------------------------------------

class Parva(db.Model):
    __tablename__ = "parva"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    parva_number = db.Column(db.Integer, nullable=False, unique=True, index=True)
    parvantya = db.Column(db.Text)

    sandhis = db.relationship(
        "Sandhi",
        backref="parva",
        cascade="all, delete-orphan",
        passive_deletes=True
    )

    def __repr__(self):
        return f"<Parva {self.parva_number} - {self.name}>"



# -------------------------------------------------------
# SANDHI
# -------------------------------------------------------

class Sandhi(db.Model):
    __tablename__ = "sandhi"

    id = db.Column(db.Integer, primary_key=True)

    parva_id = db.Column(
        db.Integer,
        db.ForeignKey("parva.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    name = db.Column(db.String(255), nullable=False)
    sandhi_number = db.Column(db.Integer, nullable=False)

    padyas = db.relationship(
        "Padya",
        backref="sandhi",
        cascade="all, delete-orphan",
        passive_deletes=True
    )

    def __repr__(self):
        return f"<Sandhi {self.sandhi_number} (Parva {self.parva_id})>"


# -------------------------------------------------------
# PADYA
# -------------------------------------------------------

class Padya(db.Model):
    __tablename__ = "padya"

    id = db.Column(db.Integer, primary_key=True)

    sandhi_id = db.Column(
        db.Integer,
        db.ForeignKey("sandhi.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    padya_number = db.Column(db.Integer, nullable=False, index=True)

    pathantar = db.Column(db.Text)
    gadya = db.Column(db.Text)
    tippani = db.Column(db.Text)
    artha = db.Column(db.Text)
    suchane = db.Column(db.Text)
    padya = db.Column(db.Text)

    def __repr__(self):
        return f"<Padya {self.padya_number}>"


# -------------------------------------------------------
# USERS
# -------------------------------------------------------

class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)

    username = db.Column(db.String(255), unique=True, nullable=False, index=True)
    password = db.Column(db.String(255), nullable=False)

    phone_number = db.Column(db.String(20))
    email = db.Column(db.String(255))

    def set_password(self, password):
        self.password = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password, password)

    def __repr__(self):
        return f"<User {self.username}>"


# -------------------------------------------------------
# AKARADI SUCHI
# -------------------------------------------------------

class AkaradiSuchi(db.Model):
    __tablename__ = "akaradi_suchi"

    id = db.Column(db.Integer, primary_key=True)

    padyafirstline = db.Column(db.Text, nullable=False)

    parva_id = db.Column(
        db.Integer,
        db.ForeignKey("parva.id", ondelete="CASCADE"),
        nullable=False
    )

    sandhi_id = db.Column(
        db.Integer,
        db.ForeignKey("sandhi.id", ondelete="CASCADE"),
        nullable=False
    )

    padya_number = db.Column(db.Integer, nullable=False)

    parva = db.relationship("Parva", backref="akaradi_suchi_entries")
    sandhi = db.relationship("Sandhi", backref="akaradi_suchi_entries")

    __table_args__ = (
        db.UniqueConstraint(
            "parva_id",
            "sandhi_id",
            "padya_number",
            name="unique_parva_sandhi_padya"
        ),
    )

    def __repr__(self):
        return f"<AkaradiSuchi Parva:{self.parva_id} Sandhi:{self.sandhi_id} Padya:{self.padya_number}>"


# -------------------------------------------------------
# GADE SUCHIGALU
# -------------------------------------------------------

class GadeSuchigalu(db.Model):
    __tablename__ = "gade_suchigalu"

    id = db.Column(db.Integer, primary_key=True)

    gade_suchi = db.Column(db.String(500), nullable=False)

    parva_name = db.Column(db.String(255))
    sandhi_number = db.Column(db.Integer, nullable=False)
    parva_number = db.Column(db.Integer, nullable=False)
    padya_number = db.Column(db.Integer, nullable=False)

    __table_args__ = (
        db.UniqueConstraint(
            "gade_suchi",
            "parva_name",
            "sandhi_number",
            "padya_number",
            name="unique_gade_suchi_parva_sandhi_padya"
        ),
    )

    def __repr__(self):
        return f"<GadeSuchigalu {self.gade_suchi[:30]}>"


# -------------------------------------------------------
# TIPPANI
# -------------------------------------------------------

class Tippani(db.Model):
    __tablename__ = "tippani"

    id = db.Column(db.Integer, primary_key=True)

    tippani = db.Column(db.Text, nullable=False)

    parva_id = db.Column(
        db.Integer,
        db.ForeignKey("parva.id", ondelete="CASCADE"),
        nullable=False
    )

    sandhi_id = db.Column(
        db.Integer,
        db.ForeignKey("sandhi.id", ondelete="CASCADE"),
        nullable=False
    )

    padya_number = db.Column(db.Integer, nullable=False)

    parva = db.relationship("Parva", backref="tippani_entries")
    sandhi = db.relationship("Sandhi", backref="tippani_entries")

    __table_args__ = (
        db.UniqueConstraint(
            "parva_id",
            "sandhi_id",
            "padya_number",
            name="unique_parva_sandhi_padya_tippani"
        ),
    )

    def __repr__(self):
        return f"<Tippani Parva:{self.parva_id} Sandhi:{self.sandhi_id} Padya:{self.padya_number}>"