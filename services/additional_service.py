from datetime import datetime

from sqlalchemy.exc import IntegrityError
from sqlalchemy.exc import SQLAlchemyError

from model.models import AkaradiSuchi, Padya, Sandhi, db, Parva, GadeSuchigalu, Tippani


class AkaradiSuchiService:
    """
    Service layer for managing AkaradiSuchi data.
    """

    def __init__(self):
        pass

    @staticmethod
    def _extract_first_line(text: str) -> str:
        """
        Safely extract the first line from padya text.
        """
        if not text:
            return ""

        # Split by newline and return first non-empty line
        lines = text.strip().splitlines()
        for line in lines:
            line = line.strip()
            if line:
                return line

        return ""

    # -------------------------------------------------------
    # FULL REFRESH
    # -------------------------------------------------------

    def refresh_akaradi_suchi(self):
        """
        Rebuild AkaradiSuchi table from Padya table.

        Steps:
        1. Delete existing AkaradiSuchi entries
        2. Read all Padya records
        3. Extract first line from padya text
        4. Bulk insert new AkaradiSuchi records
        """

        try:
            # 1. Clear existing entries
            AkaradiSuchi.query.delete()

            # 2. Fetch all padyas
            padyas = (
                db.session.query(
                    Sandhi.parva_id,
                    Padya.sandhi_id,
                    Padya.padya_number,
                    Padya.padya
                )
                .join(Sandhi, Padya.sandhi_id == Sandhi.id)
                .all()
            )

            records_to_insert = []

            for parva_id, sandhi_id, padya_number, padya_text in padyas:
                first_line = self._extract_first_line(
                    padya_text
                )

                if not first_line:
                    continue

                record = AkaradiSuchi(
                    padyafirstline=first_line,
                    parva_id=parva_id,
                    sandhi_id=sandhi_id,
                    padya_number=padya_number
                )

                records_to_insert.append(record)

            # 3. Bulk insert
            if records_to_insert:
                db.session.bulk_save_objects(records_to_insert)

            db.session.commit()

            return {
                "status": "success",
                "records_inserted": len(records_to_insert),
                "timestamp": datetime.now()
            }

        except SQLAlchemyError as e:
            db.session.rollback()
            return {
                "status": "Failed",
                "records_inserted": 0,
                "timestamp": datetime.now(),
                "error": str(e)
            }

    # -------------------------------------------------------
    # FETCH WITH SEARCH + PAGINATION + OPTIONAL PARVA FILTER
    # -------------------------------------------------------
    def get_akaradi_suchi(
            self,
            offset: int = 0,
            limit: int = 10,
            search: str = None,
            parva_number: int = None  # NEW OPTIONAL PARAM
    ):
        """
        Fetch AkaradiSuchi records.

        Rules:
        - Search matches starting text (Akaradi style)
        - If parva_number provided -> search only inside that Parva
        - If no search -> fetch all
        - Supports pagination
        """

        try:

            # -----------------------------
            # LIMIT handling
            # -----------------------------

            if limit is None or limit <= 0:
                limit = 10

            if limit > 100:
                limit = 100

            if offset is None or offset < 0:
                offset = 0

            # -----------------------------
            # BASE QUERY
            # -----------------------------

            query = (
                db.session.query(
                    AkaradiSuchi,
                    Parva.parva_number,
                    Sandhi.sandhi_number
                )
                .join(
                    Parva,
                    AkaradiSuchi.parva_id == Parva.id
                )
                .join(
                    Sandhi,
                    AkaradiSuchi.sandhi_id == Sandhi.id
                )
            )

            # -----------------------------
            # OPTIONAL PARVA FILTER
            # -----------------------------

            if parva_number is not None:

                if isinstance(parva_number, int):
                    query = query.filter(
                        Parva.parva_number == parva_number
                    )

            # -----------------------------
            # SEARCH (STARTS WITH)
            # -----------------------------

            if search:

                search = search.strip()

                if search:
                    search_pattern = f"{search}%"

                    query = query.filter(
                        AkaradiSuchi.padyafirstline.ilike(
                            search_pattern
                        )
                    )

            # -----------------------------
            # TOTAL COUNT (optimized)
            # -----------------------------

            total = query.order_by(None).count()

            # -----------------------------
            # DEFAULT ORDER (Akaradi order)
            # -----------------------------

            query = query.order_by(
                AkaradiSuchi.padyafirstline.asc()
            )

            # -----------------------------
            # PAGINATION
            # -----------------------------

            results = (
                query
                .offset(offset)
                .limit(limit)
                .all()
            )

            # -----------------------------
            # FORMAT RESPONSE
            # -----------------------------

            data = []

            for record, parva_number_val, sandhi_number in results:
                data.append({
                    "id": record.id,
                    "padyafirstline": record.padyafirstline,
                    "parva_id": record.parva_id,
                    "parva_number": parva_number_val,
                    "sandhi_id": record.sandhi_id,
                    "sandhi_number": sandhi_number,
                    "padya_number": record.padya_number
                })

            return {
                "status": "success",
                "data": data,
                "total": total,
                "limit": limit,
                "offset": offset
            }

        except SQLAlchemyError as e:
            raise e


class LekhanaSuchiService:
    def __init__(self):
        pass


class GadeSuchigaluService:

    # =========================
    # SERIALIZER
    # =========================
    @staticmethod
    def _serialize(record):
        if not record:
            return None

        return {
            "id": record.id,
            "gade_suchi": record.gade_suchi,
            "description": record.description,
            "parva_name": getattr(record, "parva_name", None),
            "parva_number": record.parva_number,
            "sandhi_name": getattr(record, "sandhi_name", None),
            "sandhi_number": record.sandhi_number,
            "padya_number": record.padya_number,
        }

    # =========================
    # INTERNAL NORMALIZATION
    # =========================
    @staticmethod
    def _normalize_string(value):
        if value is None:
            return None
        if not isinstance(value, str):
            value = str(value)
        value = value.strip()
        return value if value != "" else None

    @staticmethod
    def _normalize_int(value, field_name):
        if value is None or value == "":
            return None, None

        try:
            value = int(value)
        except (TypeError, ValueError):
            return None, f"{field_name} must be an integer"

        if value <= 0:
            return None, f"{field_name} must be greater than 0"

        return value, None

    # =========================
    # INTERNAL VALIDATION
    # =========================
    @staticmethod
    def _validate_required_text(gade_suchi):
        if not gade_suchi:
            return False, "gade_suchi is required"
        return True, None

    @staticmethod
    def _validate_location_numbers(parva_number=None, sandhi_number=None, padya_number=None):
        fields = {
            "parva_number": parva_number,
            "sandhi_number": sandhi_number,
            "padya_number": padya_number,
        }

        for field_name, value in fields.items():
            if value is None:
                return False, f"{field_name} is required"
            if not isinstance(value, int):
                return False, f"{field_name} must be an integer"
            if value <= 0:
                return False, f"{field_name} must be greater than 0"

        return True, None

    # =========================
    # CREATE
    # =========================
    @staticmethod
    def create(**kwargs):
        try:
            kwargs["gade_suchi"] = GadeSuchigaluService._normalize_string(kwargs.get("gade_suchi"))
            kwargs["description"] = GadeSuchigaluService._normalize_string(kwargs.get("description"))

            kwargs["parva_number"], error = GadeSuchigaluService._normalize_int(
                kwargs.get("parva_number"), "parva_number"
            )
            if error:
                return {"status": "error", "message": error}

            kwargs["sandhi_number"], error = GadeSuchigaluService._normalize_int(
                kwargs.get("sandhi_number"), "sandhi_number"
            )
            if error:
                return {"status": "error", "message": error}

            kwargs["padya_number"], error = GadeSuchigaluService._normalize_int(
                kwargs.get("padya_number"), "padya_number"
            )
            if error:
                return {"status": "error", "message": error}

            is_valid, error = GadeSuchigaluService._validate_required_text(kwargs.get("gade_suchi"))
            if not is_valid:
                return {"status": "error", "message": error}

            is_valid, error = GadeSuchigaluService._validate_location_numbers(
                kwargs.get("parva_number"),
                kwargs.get("sandhi_number"),
                kwargs.get("padya_number")
            )
            if not is_valid:
                return {"status": "error", "message": error}

            record = GadeSuchigalu(
                gade_suchi=kwargs.get("gade_suchi"),
                description=kwargs.get("description"),
                parva_number=kwargs.get("parva_number"),
                sandhi_number=kwargs.get("sandhi_number"),
                padya_number=kwargs.get("padya_number"),
            )

            db.session.add(record)
            db.session.commit()
            db.session.refresh(record)

            return {
                "status": "success",
                "message": "GadeSuchigalu created successfully",
                "data": GadeSuchigaluService._serialize(record)
            }

        except IntegrityError:
            db.session.rollback()
            return {"status": "error", "message": "Duplicate entry detected"}
        except Exception as e:
            db.session.rollback()
            return {"status": "error", "message": str(e)}

    # =========================
    # GET BY ID
    # =========================
    @staticmethod
    def get_by_id(record_id: int):
        try:
            record = db.session.get(GadeSuchigalu, record_id)
            if record is None:
                return {"status": "error", "message": "Record not found", "data": None}

            return {
                "status": "success",
                "data": GadeSuchigaluService._serialize(record)
            }
        except Exception as e:
            return {"status": "error", "message": str(e), "data": None}

    # =========================
    # SEARCH + LIST
    # =========================
    @staticmethod
    def get_gade_suchigalu(offset=0, limit=10, search=None, parva_number=None):
        try:
            if limit <= 0:
                limit = 10
            if limit > 100:
                limit = 100
            if offset < 0:
                offset = 0

            query = db.session.query(GadeSuchigalu)

            if parva_number is not None:
                query = query.filter(GadeSuchigalu.parva_number == parva_number)

            if search:
                search = search.strip()
                query = query.filter(GadeSuchigalu.gade_suchi.ilike(f"{search}%"))

            total = query.order_by(None).count()

            results = query.order_by(
                GadeSuchigalu.parva_number.asc(),
                GadeSuchigalu.sandhi_number.asc(),
                GadeSuchigalu.padya_number.asc(),
                GadeSuchigalu.gade_suchi.asc()
            ).offset(offset).limit(limit).all()

            data = [GadeSuchigaluService._serialize(r) for r in results]

            return {
                "status": "success",
                "data": data,
                "total": total,
                "limit": limit,
                "offset": offset
            }

        except Exception as e:
            return {"status": "error", "message": str(e), "data": []}

    # =========================
    # UPDATE
    # =========================
    @staticmethod
    def update(record_id: int, **kwargs):
        try:
            record = db.session.get(GadeSuchigalu, record_id)
            if not record:
                return {"status": "error", "message": "Record not found"}

            if "gade_suchi" in kwargs:
                kwargs["gade_suchi"] = GadeSuchigaluService._normalize_string(kwargs.get("gade_suchi"))
            if "description" in kwargs:
                kwargs["description"] = GadeSuchigaluService._normalize_string(kwargs.get("description"))

            if "parva_number" in kwargs:
                kwargs["parva_number"], error = GadeSuchigaluService._normalize_int(
                    kwargs.get("parva_number"), "parva_number"
                )
                if error:
                    return {"status": "error", "message": error}

            if "sandhi_number" in kwargs:
                kwargs["sandhi_number"], error = GadeSuchigaluService._normalize_int(
                    kwargs.get("sandhi_number"), "sandhi_number"
                )
                if error:
                    return {"status": "error", "message": error}

            if "padya_number" in kwargs:
                kwargs["padya_number"], error = GadeSuchigaluService._normalize_int(
                    kwargs.get("padya_number"), "padya_number"
                )
                if error:
                    return {"status": "error", "message": error}

            final_gade_suchi = kwargs.get("gade_suchi", record.gade_suchi)
            final_parva_number = kwargs.get("parva_number", record.parva_number)
            final_sandhi_number = kwargs.get("sandhi_number", record.sandhi_number)
            final_padya_number = kwargs.get("padya_number", record.padya_number)

            is_valid, error = GadeSuchigaluService._validate_required_text(final_gade_suchi)
            if not is_valid:
                return {"status": "error", "message": error}

            is_valid, error = GadeSuchigaluService._validate_location_numbers(
                final_parva_number,
                final_sandhi_number,
                final_padya_number
            )
            if not is_valid:
                return {"status": "error", "message": error}

            for key, value in kwargs.items():
                if hasattr(record, key):
                    setattr(record, key, value)

            db.session.commit()
            db.session.refresh(record)

            return {
                "status": "success",
                "message": "GadeSuchigalu updated successfully",
                "data": GadeSuchigaluService._serialize(record)
            }

        except IntegrityError:
            db.session.rollback()
            return {"status": "error", "message": "Duplicate entry detected"}
        except Exception as e:
            db.session.rollback()
            return {"status": "error", "message": str(e)}

    # =========================
    # DELETE
    # =========================
    @staticmethod
    def delete(record_id: int):
        try:
            record = db.session.get(GadeSuchigalu, record_id)
            if not record:
                return {"status": "error", "message": "Record not found"}

            db.session.delete(record)
            db.session.commit()

            return {"status": "success", "message": "GadeSuchigalu deleted successfully"}
        except Exception as e:
            db.session.rollback()
            return {"status": "error", "message": str(e)}


class ArthakoshaService:
    def __init__(self):
        pass


class VishayaParividiService:
    def __init__(self):
        pass


class GamakaService:
    def __init__(self):
        pass


class AnubandhaService:
    def __init__(self):
        pass


class TippaniService:
    """
    Service layer for managing Tippani data.
    """

    def __init__(self):
        pass

    @staticmethod
    def _extract_tippani(text: str) -> str:
        """
        Safely extract tippani text from Padya.
        """
        if not text:
            return ""
        return text.strip()

    # -------------------------------------------------------
    # REFRESH TIPPNI TABLE
    # -------------------------------------------------------
    def refresh_tippani(self):
        """
        Rebuild Tippani table from Padya table.
        Skips empty or '-' tippani.
        """
        try:
            # 1. Clear existing entries
            db.session.query(Tippani).delete()
            db.session.commit()  # commit deletion first

            # 2. Fetch all Padya rows with Sandhi info
            padyas = (
                db.session.query(
                    Sandhi.parva_id,
                    Padya.sandhi_id,
                    Padya.padya_number,
                    Padya.tippani
                )
                .join(Sandhi, Padya.sandhi_id == Sandhi.id)
                .all()
            )

            records_to_insert = []

            for parva_id, sandhi_id, padya_number, tippani_text in padyas:
                tippani_value = self._extract_tippani(tippani_text)

                # Skip empty or '-' tippani
                if not tippani_value or tippani_value == "-":
                    continue

                record = Tippani(
                    tippani=tippani_value,
                    parva_id=parva_id,
                    sandhi_id=sandhi_id,
                    padya_number=padya_number
                )
                records_to_insert.append(record)

            # 3. Bulk insert
            if records_to_insert:
                db.session.bulk_save_objects(records_to_insert)
                db.session.commit()

            return {
                "status": "success",
                "records_inserted": len(records_to_insert),
                "timestamp": datetime.now()
            }

        except SQLAlchemyError as e:
            db.session.rollback()
            return {
                "status": "Failed",
                "records_inserted": 0,
                "timestamp": datetime.now(),
                "error": str(e)
            }

    # -------------------------------------------------------
    # FETCH TIPPNI WITH SEARCH + PAGINATION + PARVA FILTER
    # -------------------------------------------------------
    def get_tippani(self, offset: int = 0, limit: int = 10, search: str = None, parva_number: int = None):
        """
        Fetch Tippani records.
        Filters out empty or '-' tippani.
        """
        try:
            # Validate pagination
            if limit is None or limit <= 0:
                limit = 10
            if limit > 100:
                limit = 100
            if offset is None or offset < 0:
                offset = 0

            # Base query with joins
            query = (
                db.session.query(
                    Tippani,
                    Parva.parva_number,
                    Sandhi.sandhi_number
                )
                .join(Parva, Tippani.parva_id == Parva.id)
                .join(Sandhi, Tippani.sandhi_id == Sandhi.id)
            )

            # Filter out empty or '-' tippani
            query = query.filter(Tippani.tippani.isnot(None))
            query = query.filter(Tippani.tippani != "-")

            # Optional parva filter
            if parva_number is not None and isinstance(parva_number, int):
                query = query.filter(Parva.parva_number == parva_number)

            # Search by starting text
            if search:
                search = search.strip()
                if search:
                    query = query.filter(Tippani.tippani.ilike(f"{search}%"))

            # Total count
            total = query.order_by(None).count()

            # Order by Parva > Sandhi > Padya
            query = query.order_by(
                Parva.parva_number.asc(),
                Sandhi.sandhi_number.asc(),
                Tippani.padya_number.asc()
            )

            # Pagination
            results = query.offset(offset).limit(limit).all()

            # Format response
            data = []
            for record, parva_number_val, sandhi_number in results:
                data.append({
                    "id": record.id,
                    "tippani": record.tippani,
                    "parva_id": record.parva_id,
                    "parva_number": parva_number_val,
                    "sandhi_id": record.sandhi_id,
                    "sandhi_number": sandhi_number,
                    "padya_number": record.padya_number
                })

            return {
                "status": "success",
                "data": data,
                "total": total,
                "limit": limit,
                "offset": offset
            }

        except SQLAlchemyError as e:
            return {"status": "error", "message": str(e), "data": []}
