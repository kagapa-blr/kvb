import logging

from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import joinedload

from model.models import (
    db,
    Parva,
    Sandhi,
    Padya,
)

logger = logging.getLogger(__name__)


# -------------------------------------------------------
# COMMON UTILITIES
# -------------------------------------------------------

def commit_session():
    try:
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        logger.error("Database commit failed: %s", e)
        raise


def get_pagination(offset: int = 0, limit: int = 20):
    offset = max(offset, 0)
    limit = max(min(limit, 100), 1)
    # offset already provided directly
    return offset, limit


# -------------------------------------------------------
# PARVA SERVICE
# -------------------------------------------------------

class ParvaService:

    def get_all(self, offset=0, limit=20, **kwargs):
        try:
            offset, limit = get_pagination(offset, limit)

            query = Parva.query.order_by(Parva.parva_number)
            total = query.count()

            records = (
                query.offset(offset)
                .limit(limit)
                .all()
            )

            return {
                "offset": offset,
                "limit": limit,
                "total": total,
                "data": [
                    {
                        "id": p.id,
                        "name": p.name,
                        "parva_number": p.parva_number,
                        "sandhi_count": len(p.sandhis),
                        "parvantya": p.parvantya,
                    }
                    for p in records
                ],
            }, 200

        except Exception as e:
            logger.error("Error fetching parvas: %s", e)
            return {"error": "Database error"}, 500

    def get_by_number(self, parva_number, **kwargs):
        parva = Parva.query.filter_by(parva_number=parva_number).first()

        if not parva:
            return {"error": "Parva not found"}, 404

        return {
            "id": parva.id,
            "name": parva.name,
            "parva_number": parva.parva_number,
            "parvantya": parva.parvantya,
            "sandhi_count": len(parva.sandhis),
        }, 200

    def create(self, **kwargs):
        name = kwargs.get("name")

        if not name:
            return {"error": "Name required"}, 400

        try:
            max_number = db.session.query(
                func.max(Parva.parva_number)
            ).scalar()

            next_number = (max_number or 0) + 1

            record = Parva(
                name=name,
                parva_number=next_number,
                parvantya=kwargs.get("parvantya"),
            )

            db.session.add(record)
            commit_session()

            return {
                "id": record.id,
                "parva_number": record.parva_number,
                "name": record.name,
            }, 201

        except IntegrityError:
            return {"error": "Duplicate parva"}, 409

        except Exception as e:
            logger.error("Create parva failed: %s", e)
            return {"error": "Create failed"}, 500

    def update(self, parva_number, **kwargs):
        parva = Parva.query.filter_by(
            parva_number=parva_number
        ).first()

        if not parva:
            return {"error": "Parva not found"}, 404

        try:
            parva.name = kwargs.get("name", parva.name)
            parva.parvantya = kwargs.get(
                "parvantya", parva.parvantya
            )

            commit_session()

            return {"message": "Updated"}, 200

        except Exception as e:
            logger.error("Update parva failed: %s", e)
            return {"error": "Update failed"}, 500

    def delete(self, parva_number, **kwargs):
        parva = Parva.query.filter_by(
            parva_number=parva_number
        ).first()

        if not parva:
            return {"error": "Parva not found"}, 404

        try:
            db.session.delete(parva)
            commit_session()

            return {"message": "Deleted"}, 200

        except Exception as e:
            logger.error("Delete parva failed: %s", e)
            return {"error": "Delete failed"}, 500

    def search(self, query="", offset=0, limit=20, **kwargs):
        """
        Search parva by name or number.
        Handles both numeric (number) and text (name) queries.
        """
        try:
            offset, limit = get_pagination(offset, limit)
            
            # Check if query is numeric
            is_numeric = False
            search_number = None
            try:
                search_number = int(query)
                is_numeric = True
            except (ValueError, TypeError):
                pass
            
            # Build query
            base_query = Parva.query.order_by(Parva.parva_number)
            
            if is_numeric and search_number is not None:
                # Search by parva number (exact match)
                base_query = base_query.filter(Parva.parva_number == search_number)
            elif query:
                # Search by name (case-insensitive partial match)
                base_query = base_query.filter(
                    Parva.name.ilike(f"%{query}%")
                )
            
            total = base_query.count()
            records = base_query.offset(offset).limit(limit).all()
            
            return {
                "offset": offset,
                "limit": limit,
                "total": total,
                "data": [
                    {
                        "id": p.id,
                        "name": p.name,
                        "parva_number": p.parva_number,
                        "sandhi_count": len(p.sandhis),
                        "parvantya": p.parvantya,
                    }
                    for p in records
                ],
            }, 200
            
        except Exception as e:
            logger.error("Parva search failed: %s", e)
            return {"error": "Search failed"}, 500


# -------------------------------------------------------
# SANDHI SERVICE
# -------------------------------------------------------

class SandhiService:

    def get_by_parva(
        self,
        parva_number,
        offset=0,
        limit=20,
        **kwargs,
    ):
        offset, limit = get_pagination(offset, limit)

        parva = Parva.query.filter_by(
            parva_number=parva_number
        ).first()

        if not parva:
            return {"error": "Parva not found"}, 404

        query = (
            Sandhi.query.options(joinedload(Sandhi.parva))
            .filter_by(parva_id=parva.id)
            .order_by(Sandhi.sandhi_number)
        )

        total = query.count()

        records = (
            query.offset(offset)
            .limit(limit)
            .all()
        )

        return {
            "offset": offset,
            "limit": limit,
            "total": total,
            "data": [
                {
                    "parva_number": s.parva.parva_number,
                    "sandhi_number": s.sandhi_number,
                    "name": s.name,
                    "padya_count": len(s.padyas),
                }
                for s in records
            ],
        }, 200

    def get_unique(
        self,
        parva_number,
        sandhi_number,
        **kwargs,
    ):
        sandhi = (
            Sandhi.query.join(Parva)
            .filter(
                Parva.parva_number == parva_number,
                Sandhi.sandhi_number == sandhi_number,
            )
            .first()
        )

        if not sandhi:
            return {"error": "Sandhi not found"}, 404

        return {
            "parva_number": parva_number,
            "sandhi_number": sandhi.sandhi_number,
            "name": sandhi.name,
            "padya_count": len(sandhi.padyas),
        }, 200

    def create(self, **kwargs):
        parva_number = kwargs.get("parva_number")
        name = kwargs.get("name")

        if not parva_number:
            return {"error": "Parva number required"}, 400

        if not name:
            return {"error": "Name required"}, 400

        parva = Parva.query.filter_by(
            parva_number=parva_number
        ).first()

        if not parva:
            return {"error": "Parva not found"}, 404

        try:
            max_number = db.session.query(
                func.max(Sandhi.sandhi_number)
            ).filter_by(parva_id=parva.id).scalar()

            next_number = (max_number or 0) + 1

            record = Sandhi(
                parva_id=parva.id,
                name=name,
                sandhi_number=next_number,
            )

            db.session.add(record)
            commit_session()

            return {
                "parva_number": parva_number,
                "sandhi_number": record.sandhi_number,
            }, 201

        except IntegrityError:
            return {"error": "Duplicate sandhi"}, 409

        except Exception as e:
            logger.error("Create sandhi failed: %s", e)
            return {"error": "Create failed"}, 500

    def update(
        self,
        parva_number,
        sandhi_number,
        **kwargs,
    ):
        sandhi = (
            Sandhi.query.join(Parva)
            .filter(
                Parva.parva_number == parva_number,
                Sandhi.sandhi_number == sandhi_number,
            )
            .first()
        )

        if not sandhi:
            return {"error": "Sandhi not found"}, 404

        try:
            sandhi.name = kwargs.get(
                "name", sandhi.name
            )

            commit_session()

            return {"message": "Updated"}, 200

        except Exception as e:
            logger.error("Update sandhi failed: %s", e)
            return {"error": "Update failed"}, 500

    def delete(
        self,
        parva_number,
        sandhi_number,
        **kwargs,
    ):
        sandhi = (
            Sandhi.query.join(Parva)
            .filter(
                Parva.parva_number == parva_number,
                Sandhi.sandhi_number == sandhi_number,
            )
            .first()
        )

        if not sandhi:
            return {"error": "Sandhi not found"}, 404

        try:
            db.session.delete(sandhi)
            commit_session()

            return {"message": "Deleted"}, 200

        except Exception as e:
            logger.error("Delete sandhi failed: %s", e)
            return {"error": "Delete failed"}, 500

    def search(self, parva_number, query="", offset=0, limit=20, **kwargs):
        """
        Search sandhi by name or number within a specific parva.
        Handles both numeric (number) and text (name) queries.
        """
        try:
            offset, limit = get_pagination(offset, limit)
            
            # Check if parva exists
            parva = Parva.query.filter_by(parva_number=parva_number).first()
            if not parva:
                return {"error": "Parva not found"}, 404
            
            # Check if query is numeric
            is_numeric = False
            search_number = None
            try:
                search_number = int(query)
                is_numeric = True
            except (ValueError, TypeError):
                pass
            
            # Build query
            base_query = (
                Sandhi.query.options(joinedload(Sandhi.parva))
                .filter_by(parva_id=parva.id)
                .order_by(Sandhi.sandhi_number)
            )
            
            if is_numeric and search_number is not None:
                # Search by sandhi number (exact match)
                base_query = base_query.filter(Sandhi.sandhi_number == search_number)
            elif query:
                # Search by name (case-insensitive partial match)
                base_query = base_query.filter(Sandhi.name.ilike(f"%{query}%"))
            
            total = base_query.count()
            records = base_query.offset(offset).limit(limit).all()
            
            return {
                "offset": offset,
                "limit": limit,
                "total": total,
                "data": [
                    {
                        "parva_number": s.parva.parva_number,
                        "sandhi_number": s.sandhi_number,
                        "name": s.name,
                        "padya_count": len(s.padyas),
                    }
                    for s in records
                ],
            }, 200
            
        except Exception as e:
            logger.error("Sandhi search failed: %s", e)
            return {"error": "Search failed"}, 500


# -------------------------------------------------------
# PADYA SERVICE
# -------------------------------------------------------

class PadyaService:

    # ---------------------------------------------
    # SEARCH WITH PAGINATION
    # ---------------------------------------------

    def search(
        self,
        parva_number=None,
        sandhi_number=None,
        keyword=None,
        offset=0,
        limit=20,
        **kwargs,
    ):
        try:
            offset, limit = get_pagination(offset, limit)

            query = (
                Padya.query
                .join(Sandhi)
                .join(Parva)
            )

            if parva_number:
                query = query.filter(
                    Parva.parva_number == parva_number
                )

            if sandhi_number:
                query = query.filter(
                    Sandhi.sandhi_number == sandhi_number
                )

            if keyword:
                like = f"%{keyword}%"
                query = query.filter(
                    Padya.padya.ilike(like)
                )

            query = query.order_by(
                Padya.padya_number
            )

            total = query.count()

            records = (
                query.offset(offset)
                .limit(limit)
                .all()
            )

            return {
                "offset": offset,
                "limit": limit,
                "total": total,
                "data": [
                    {
                        "parva_number": r.sandhi.parva.parva_number,
                        "sandhi_number": r.sandhi.sandhi_number,
                        "padya_number": r.padya_number,
                        "preview": (
                            r.padya[:80] + "..."
                            if r.padya
                            else None
                        ),
                    }
                    for r in records
                ],
            }, 200

        except Exception as e:
            logger.error("Search padya failed: %s", e)
            return {"error": "Search failed"}, 500

    # ---------------------------------------------
    # FETCH UNIQUE PADYA
    # ---------------------------------------------

    def get_unique(
        self,
        parva_number,
        sandhi_number,
        padya_number,
        **kwargs,
    ):
        record = (
            Padya.query.join(Sandhi)
            .join(Parva)
            .filter(
                Parva.parva_number == parva_number,
                Sandhi.sandhi_number == sandhi_number,
                Padya.padya_number == padya_number,
            )
            .first()
        )

        if not record:
            return {"error": "Padya not found"}, 404

        # Get sandhi and parva objects for names
        sandhi = record.sandhi
        parva = sandhi.parva if sandhi else None

        return {
            "id": record.id,
            "parva_number": parva_number,
            "parva_name": parva.name if parva else "",
            "sandhi_number": sandhi_number,
            "sandhi_name": sandhi.name if sandhi else "",
            "padya_number": record.padya_number,
            "padya": record.padya,
            "artha": record.artha,
            "tippani": record.tippani,
            "gadya": record.gadya,
            "suchane": record.suchane,
            "pathantar": record.pathantar,
        }, 200

    # ---------------------------------------------
    # CREATE
    # ---------------------------------------------

    def create(self, **kwargs):
        try:
            parva_number = kwargs.get(
                "parva_number"
            )
            sandhi_number = kwargs.get(
                "sandhi_number"
            )

            padya_text = kwargs.get("padya")

            if not (
                parva_number
                and sandhi_number
                and padya_text
            ):
                return {"error": "Required fields missing"}, 400

            sandhi = (
                Sandhi.query.join(Parva)
                .filter(
                    Parva.parva_number
                    == parva_number,
                    Sandhi.sandhi_number
                    == sandhi_number,
                )
                .first()
            )

            if not sandhi:
                return {"error": "Sandhi not found"}, 404

            max_number = db.session.query(
                func.max(Padya.padya_number)
            ).filter_by(
                sandhi_id=sandhi.id
            ).scalar()

            next_number = (max_number or 0) + 1

            record = Padya(
                sandhi_id=sandhi.id,
                padya_number=next_number,
                padya=padya_text,
                artha=kwargs.get("artha"),
                tippani=kwargs.get("tippani"),
                gadya=kwargs.get("gadya"),
                suchane=kwargs.get("suchane"),
                pathantar=kwargs.get("pathantar"),
            )

            db.session.add(record)
            commit_session()

            return {
                "parva_number": parva_number,
                "sandhi_number": sandhi_number,
                "padya_number": record.padya_number,
            }, 201

        except IntegrityError:
            return {"error": "Duplicate padya"}, 409

        except Exception as e:
            logger.error("Create padya failed: %s", e)
            return {"error": "Create failed"}, 500

    # ---------------------------------------------
    # UPDATE
    # ---------------------------------------------

    def update(
        self,
        parva_number,
        sandhi_number,
        padya_number,
        **kwargs,
    ):
        record = (
            Padya.query.join(Sandhi)
            .join(Parva)
            .filter(
                Parva.parva_number == parva_number,
                Sandhi.sandhi_number == sandhi_number,
                Padya.padya_number == padya_number,
            )
            .first()
        )

        if not record:
            return {"error": "Padya not found"}, 404

        try:
            record.padya = kwargs.get(
                "padya", record.padya
            )
            record.artha = kwargs.get(
                "artha", record.artha
            )
            record.tippani = kwargs.get(
                "tippani", record.tippani
            )
            record.gadya = kwargs.get(
                "gadya", record.gadya
            )
            record.suchane = kwargs.get(
                "suchane", record.suchane
            )
            record.pathantar = kwargs.get(
                "pathantar", record.pathantar
            )

            commit_session()

            return {"message": "Updated"}, 200

        except Exception as e:
            logger.error("Update padya failed: %s", e)
            return {"error": "Update failed"}, 500

    # ---------------------------------------------
    # DELETE
    # ---------------------------------------------

    def delete(
        self,
        parva_number,
        sandhi_number,
        padya_number,
        **kwargs,
    ):
        record = (
            Padya.query.join(Sandhi)
            .join(Parva)
            .filter(
                Parva.parva_number == parva_number,
                Sandhi.sandhi_number == sandhi_number,
                Padya.padya_number == padya_number,
            )
            .first()
        )

        if not record:
            return {"error": "Padya not found"}, 404

        try:
            db.session.delete(record)
            commit_session()

            return {"message": "Deleted"}, 200

        except Exception as e:
            logger.error("Delete padya failed: %s", e)
            return {"error": "Delete failed"}, 500


# -------------------------------------------------------
# GLOBAL INSTANCES
# -------------------------------------------------------

parva_service = ParvaService()
sandhi_service = SandhiService()
padya_service = PadyaService()
