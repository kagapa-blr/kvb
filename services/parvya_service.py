import logging

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import joinedload

from model.models import db, Parva, Sandhi, Padya

logger = logging.getLogger(__name__)


# ---------------------------------------------------------
# Safe commit helper
# ---------------------------------------------------------

def commit_session():
    try:
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        logger.error("Database commit failed: %s", e)
        raise


# Lazy-load Statistics instance
_stats_instance = None


def get_stats():
    global _stats_instance

    if _stats_instance is None:
        try:
            logger.info("Initializing Statistics module (lazy-load)...")
            from utils.statistics import Statistics

            _stats_instance = Statistics()
            logger.info("Statistics module initialized successfully")

        except Exception as e:
            logger.error("Failed to initialize Statistics module: %s", e)
            _stats_instance = None

    return _stats_instance


class ParvyaService:

    # ==================== PARVA METHODS ====================

    def get_all_parvas(self):
        try:
            parvas = Parva.query.all()

            return [
                {
                    "id": p.id,
                    "name": p.name,
                    "parva_number": p.parva_number,
                }
                for p in parvas
            ]

        except Exception as e:
            logger.error("Database error in get_all_parvas: %s", e)
            return {"error": "Unable to connect to database"}, 503

    def get_parva_by_id(self, id):

        parva = db.session.get(Parva, id)

        if not parva:
            return {"error": "Parva not found"}, 404

        return (
            {
                "id": parva.id,
                "name": parva.name,
                "parva_number": parva.parva_number,
            },
            200,
        )

    def create_parva(self, data):

        name = data.get("name")

        if not name:
            return {"error": "Name is required"}, 400

        if Parva.query.filter_by(name=name).first():
            return {"error": "Parva with this name already exists"}, 409

        try:
            max_number = db.session.query(
                db.func.max(Parva.parva_number)
            ).scalar()

            next_number = (max_number or 0) + 1

            new_parva = Parva(
                name=name,
                parva_number=next_number,
            )

            db.session.add(new_parva)
            commit_session()

            return (
                {
                    "id": new_parva.id,
                    "name": new_parva.name,
                    "parva_number": new_parva.parva_number,
                },
                201,
            )

        except Exception as e:
            logger.error("Error creating parva: %s", e)
            return {"error": str(e)}, 500

    def update_parva(self, id, data):

        parva = db.session.get(Parva, id)

        if not parva:
            return {"error": "Parva not found"}, 404

        try:
            parva.name = data.get("name", parva.name)
            parva.parva_number = data.get(
                "parva_number", parva.parva_number
            )

            commit_session()

            return (
                {
                    "id": parva.id,
                    "name": parva.name,
                    "parva_number": parva.parva_number,
                },
                200,
            )

        except Exception as e:
            logger.error("Update parva failed: %s", e)
            return {"error": "Update failed"}, 500

    def delete_parva_by_number(self, parva_number):

        if parva_number is None:
            return {"error": "Parva number is required"}, 400

        parva = Parva.query.filter_by(
            parva_number=parva_number
        ).first()

        if not parva:
            return {"error": "Parva not found"}, 404

        try:
            db.session.delete(parva)
            commit_session()

            return (
                {
                    "message": "Parva and related records deleted successfully"
                },
                200,
            )

        except Exception as e:
            logger.error("Delete parva failed: %s", e)
            return {"error": str(e)}, 500

    # ==================== SANDHI METHODS ====================

    def get_all_sandhis(self):

        sandhis = (
            Sandhi.query.options(
                joinedload(Sandhi.parva)
            ).all()
        )

        return [
            {
                "id": s.id,
                "parva_number": s.parva.parva_number,
                "name": s.name,
                "sandhi_number": s.sandhi_number,
            }
            for s in sandhis
        ]

    def create_sandhi(self, data):

        name = data.get("name")
        parva_number = data.get("parva_number")

        if not name:
            return {"error": "Name is required"}, 400

        if not parva_number:
            return {"error": "Parva Number is required"}, 400

        parva = Parva.query.filter_by(
            parva_number=parva_number
        ).first()

        if not parva:
            return {
                "error": "Parva with the given number does not exist"
            }, 404

        try:
            sandhi_number_str = name.replace(
                "ಸಂಧಿ", ""
            ).strip()

            sandhi_number = int(sandhi_number_str)

        except ValueError:
            return {"error": "Invalid sandhi number"}, 400

        if Sandhi.query.filter_by(
                parva_id=parva.id,
                sandhi_number=sandhi_number,
        ).first():
            return {
                "error": "Sandhi already exists in this Parva"
            }, 409

        try:
            new_sandhi = Sandhi(
                parva_id=parva.id,
                name=name,
                sandhi_number=sandhi_number,
            )

            db.session.add(new_sandhi)
            commit_session()

            return (
                {
                    "id": new_sandhi.id,
                    "parva_number": parva_number,
                    "name": new_sandhi.name,
                    "sandhi_number": new_sandhi.sandhi_number,
                },
                201,
            )

        except Exception as e:
            logger.error("Create sandhi failed: %s", e)
            return {"error": str(e)}, 500

    def delete_sandhi(self, parva_number, sandhi_number):

        try:
            parva = Parva.query.filter_by(
                parva_number=parva_number
            ).first()

            if not parva:
                return {
                    "error": "Parva does not exist"
                }, 404

            sandhi = Sandhi.query.filter_by(
                parva_id=parva.id,
                sandhi_number=sandhi_number,
            ).first()

            if not sandhi:
                return {
                    "error": "Sandhi does not exist"
                }, 404

            Padya.query.filter_by(
                sandhi_id=sandhi.id
            ).update({"sandhi_id": None})

            db.session.delete(sandhi)
            commit_session()

            return {"message": "Sandhi deleted"}, 200

        except IntegrityError as e:
            db.session.rollback()
            logger.error("Integrity error deleting sandhi: %s", e)
            return {
                "error": "Cannot delete sandhi due to related records"
            }, 400

        except Exception as e:
            db.session.rollback()
            logger.error("Unexpected error deleting sandhi: %s", e)
            return {"error": "Unexpected error"}, 500

    # ==================== PADYA METHODS ====================

    def get_padya_by_sandhi_and_number(
            self,
            sandhi_id,
            padya_number,
    ):

        try:
            padya = Padya.query.filter_by(
                sandhi_id=sandhi_id,
                padya_number=padya_number,
            ).first()

            if not padya:
                return {"error": "Padya not found"}, 404

            return (
                {
                    "id": padya.id,
                    "sandhi_id": padya.sandhi_id,
                    "padya_number": padya.padya_number,
                    "pathantar": padya.pathantar,
                    "gadya": padya.gadya,
                    "tippani": padya.tippani,
                    "artha": padya.artha,
                    "padya": padya.padya,
                },
                200,
            )

        except Exception as e:
            logger.error("Error fetching padya: %s", e)
            return {"error": "Unexpected error"}, 500

    def create_padya(self, data):

        required_fields = [
            "parva_number",
            "sandhi_number",
            "padya_number",
        ]

        missing = [
            f for f in required_fields if f not in data
        ]

        if missing:
            return {
                "error": f"Missing fields: {', '.join(missing)}"
            }, 400

        try:
            sandhi = (
                Sandhi.query.join(Parva)
                .filter(
                    Parva.parva_number
                    == data["parva_number"],
                    Sandhi.sandhi_number
                    == data["sandhi_number"],
                )
                .first()
            )

            if not sandhi:
                return {"error": "Sandhi not found"}, 404

            if Padya.query.filter_by(
                    sandhi_id=sandhi.id,
                    padya_number=data["padya_number"],
            ).first():
                return {
                    "error": "Padya already exists"
                }, 409

            new_padya = Padya(
                sandhi_id=sandhi.id,
                padya_number=data["padya_number"],
                pathantar=data.get("pathantar"),
                gadya=data.get("gadya"),
                tippani=data.get("tippani"),
                artha=data.get("artha"),
                padya=data.get("padya"),
            )

            db.session.add(new_padya)
            commit_session()

            return (
                {
                    "id": new_padya.id,
                    "sandhi_id": new_padya.sandhi_id,
                    "padya_number": new_padya.padya_number,
                },
                201,
            )

        except IntegrityError as e:
            db.session.rollback()
            logger.error("Integrity error creating padya: %s", e)
            return {"error": "Database error"}, 500

        except Exception as e:
            db.session.rollback()
            logger.error("Unexpected error creating padya: %s", e)
            return {"error": "Unexpected error"}, 500

    # ==================== STATISTICS ====================

    def get_statistics(self):

        try:
            stats = get_stats()

            if stats is None:
                return {
                    "error": "Statistics module not available",
                    "total_parva": 0,
                    "total_sandhi": 0,
                    "total_padya": 0,
                    "total_users": 0,
                }, 500

            data = stats.fetch_statistics()

            return data, 200

        except Exception as e:
            logger.error("Error fetching statistics: %s", e)

            return {
                "error": "Unable to fetch statistics",
                "total_parva": 0,
                "total_sandhi": 0,
                "total_padya": 0,
                "total_users": 0,
            }, 500
