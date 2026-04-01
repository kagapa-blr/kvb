from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime

db = SQLAlchemy()

MYSQL_TABLE_ARGS = {
    "mysql_engine": "InnoDB",
    "mysql_charset": "utf8mb4",
    "mysql_collate": "utf8mb4_unicode_ci",
}


# -------------------------------------------------------
# PARVA
# -------------------------------------------------------

class Parva(db.Model):
    __tablename__ = "parva"
    __table_args__ = (
        db.UniqueConstraint("name", name="unique_parva_name"),
        db.UniqueConstraint("parva_number", name="unique_parva_number"),
        MYSQL_TABLE_ARGS
    )

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False)

    parva_number = db.Column(
        db.Integer,
        nullable=False,
        index=True
    )

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
    __table_args__ = (
        db.UniqueConstraint(
            "parva_id",
            "sandhi_number",
            name="unique_parva_sandhi_number"
        ),
        db.UniqueConstraint(
            "parva_id",
            "name",
            name="unique_parva_sandhi_name"
        ),
        db.Index("idx_parva_sandhi", "parva_id", "sandhi_number"),
        MYSQL_TABLE_ARGS
    )

    id = db.Column(db.Integer, primary_key=True)

    parva_id = db.Column(
        db.Integer,
        db.ForeignKey("parva.id", ondelete="CASCADE"),
        nullable=False
    )

    name = db.Column(db.String(255), nullable=False)

    sandhi_number = db.Column(
        db.Integer,
        nullable=False
    )

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
    __table_args__ = (
        db.UniqueConstraint(
            "sandhi_id",
            "padya_number",
            name="unique_sandhi_padya_number"
        ),
        db.Index("idx_padya_lookup", "sandhi_id", "padya_number"),
        MYSQL_TABLE_ARGS
    )

    id = db.Column(db.Integer, primary_key=True)

    sandhi_id = db.Column(
        db.Integer,
        db.ForeignKey("sandhi.id", ondelete="CASCADE"),
        nullable=False
    )

    padya_number = db.Column(
        db.Integer,
        nullable=False
    )

    pathantar = db.Column(db.Text)
    gadya = db.Column(db.Text)
    tippani = db.Column(db.Text)
    artha = db.Column(db.Text)
    suchane = db.Column(db.Text)
    padya = db.Column(db.Text)
    
    # Timestamp and audit fields
    created = db.Column(db.DateTime, nullable=False, default=datetime.now())
    updated = db.Column(db.DateTime, nullable=False, default=datetime.now(), onupdate=datetime.utcnow)
    updated_by = db.Column(db.String(255), nullable=True)  # Optional: username or user ID

    def __repr__(self):
        return f"<Padya {self.padya_number} (Sandhi {self.sandhi_id})>"


# -------------------------------------------------------
# GAMAKA VACHANA
# -------------------------------------------------------

class GamakaVachana(db.Model):
    __tablename__ = "gamaka_vachana"
    __table_args__ = (
        db.UniqueConstraint(
            "parva_id",
            "sandhi_id",
            "padya_number",
            "gamaka_vachakara_name",
            name="unique_gamaka_vachana"
        ),
        MYSQL_TABLE_ARGS
    )

    id = db.Column(db.Integer, primary_key=True)

    parva_id = db.Column(
        db.Integer,
        db.ForeignKey("parva.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    sandhi_id = db.Column(
        db.Integer,
        db.ForeignKey("sandhi.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    padya_number = db.Column(db.Integer, nullable=False, index=True)

    raga = db.Column(db.String(255), nullable=False)
    gamaka_vachakara_name = db.Column(db.String(255), nullable=False)
    gamaka_vachakar_photo_path = db.Column(db.String(500))
    gamaka_vachakar_audio_path = db.Column(db.String(500))  # Audio file path

    parva = db.relationship("Parva", backref="gamaka_vachana_entries")
    sandhi = db.relationship("Sandhi", backref="gamaka_vachana_entries")

    def __repr__(self):
        return f"<GamakaVachana {self.gamaka_vachakara_name} - {self.raga}>"


# -------------------------------------------------------
# USERS
# -------------------------------------------------------

class User(db.Model):
    __tablename__ = "users"
    __table_args__ = MYSQL_TABLE_ARGS

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
    __table_args__ = (
        db.UniqueConstraint(
            "parva_id",
            "sandhi_id",
            "padya_number",
            name="unique_parva_sandhi_padya"
        ),
        MYSQL_TABLE_ARGS
    )

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

    def __repr__(self):
        return f"<AkaradiSuchi Parva:{self.parva_id} Sandhi:{self.sandhi_id} Padya:{self.padya_number}>"


# -------------------------------------------------------
# GADE SUCHIGALU
# -------------------------------------------------------

class GadeSuchigalu(db.Model):
    __tablename__ = "gade_suchigalu"
    __table_args__ = (
        db.Index("idx_gade_lookup", "parva_number", "sandhi_number", "padya_number"),
        db.UniqueConstraint("gade_suchi", "parva_number", "sandhi_number", "padya_number"),
        MYSQL_TABLE_ARGS
    )

    id = db.Column(db.Integer, primary_key=True)
    gade_suchi = db.Column(db.String(500), nullable=False)

    parva_name = db.Column(db.String(255), nullable=True)  # Can be NULL
    sandhi_number = db.Column(db.Integer, nullable=False, index=True)
    parva_number = db.Column(db.Integer, nullable=False, index=True)
    padya_number = db.Column(db.Integer, nullable=False, index=True)

    def __repr__(self):
        return f"<GadeSuchigalu {self.gade_suchi[:30]}>"


# -------------------------------------------------------
# TIPPANI
# -------------------------------------------------------

class Tippani(db.Model):
    __tablename__ = "tippani"
    __table_args__ = (
        db.UniqueConstraint(
            "parva_id",
            "sandhi_id",
            "padya_number",
            name="unique_parva_sandhi_padya_tippani"
        ),
        MYSQL_TABLE_ARGS
    )

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

    def __repr__(self):
        return f"<Tippani Parva:{self.parva_id} Sandhi:{self.sandhi_id} Padya:{self.padya_number}>"
