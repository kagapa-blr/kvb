from model.models import GamakaVachana, db


class GamakaVachanaService:

    # -------------------------------------------------------
    # CREATE
    # -------------------------------------------------------
    @staticmethod
    def create_gamaka_vachana(
            parva_id,
            sandhi_id,
            padya_number,
            raga,
            gamaka_vachakara_name,
            gamaka_vachakar_photo_path=None
    ):
        gamaka = GamakaVachana(
            parva_id=parva_id,
            sandhi_id=sandhi_id,
            padya_number=padya_number,
            raga=raga,
            gamaka_vachakara_name=gamaka_vachakara_name,
            gamaka_vachakar_photo_path=gamaka_vachakar_photo_path
        )

        db.session.add(gamaka)
        db.session.commit()

        return gamaka

    # -------------------------------------------------------
    # GET ALL
    # -------------------------------------------------------
    @staticmethod
    def get_all():
        return GamakaVachana.query.all()

    # -------------------------------------------------------
    # GET BY ID
    # -------------------------------------------------------
    @staticmethod
    def get_by_id(gamaka_id):
        return GamakaVachana.query.get(gamaka_id)

    # -------------------------------------------------------
    # GET BY PADYA
    # -------------------------------------------------------
    @staticmethod
    def get_by_padya(parva_id, sandhi_id, padya_number):
        return GamakaVachana.query.filter_by(
            parva_id=parva_id,
            sandhi_id=sandhi_id,
            padya_number=padya_number
        ).all()

    # -------------------------------------------------------
    # UPDATE
    # -------------------------------------------------------
    @staticmethod
    def update(
            gamaka_id,
            raga=None,
            gamaka_vachakara_name=None,
            gamaka_vachakar_photo_path=None
    ):
        gamaka = GamakaVachana.query.get(gamaka_id)

        if not gamaka:
            return None

        if raga is not None:
            gamaka.raga = raga

        if gamaka_vachakara_name is not None:
            gamaka.gamaka_vachakara_name = gamaka_vachakara_name

        if gamaka_vachakar_photo_path is not None:
            gamaka.gamaka_vachakar_photo_path = gamaka_vachakar_photo_path

        db.session.commit()

        return gamaka

    # -------------------------------------------------------
    # DELETE
    # -------------------------------------------------------
    @staticmethod
    def delete(gamaka_id):
        gamaka = GamakaVachana.query.get(gamaka_id)

        if not gamaka:
            return False

        db.session.delete(gamaka)
        db.session.commit()

        return True
