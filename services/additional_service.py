from sqlalchemy.exc import SQLAlchemyError
from datetime import datetime
from model.models import AkaradiSuchi, Padya, Sandhi, db, Parva


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
            raise e

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


class GadegalaSuchiService:
    def __init__(self):
        pass


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
    def __init__(self):
        pass
