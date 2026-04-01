from sqlalchemy.exc import SQLAlchemyError
from datetime import datetime

from model.models import AkaradiSuchi, Padya, Sandhi, db


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
