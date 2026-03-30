from model.models import GamakaVachana, db
from utils.audio_file_handler import AudioFileHandler


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

    # -------------------------------------------------------
    # AUDIO FILE MAPPING
    # -------------------------------------------------------
    @staticmethod
    def parse_and_map_audio_file(filename):
        """
        Parse an audio filename and map to gamaka vachana entry.
        """
        return AudioFileHandler.parse_and_map(filename)

    @staticmethod
    def get_by_audio_filename(filename):
        """
        Get gamaka vachana entry by parsing audio filename.
        """
        result = AudioFileHandler.parse_and_map(filename)
        return result.get('padya_entry')

    @staticmethod
    def process_audio_directory(directory_path):
        """
        Process all audio files in a directory.
        """
        return AudioFileHandler.process_audio_directory(directory_path)

    @staticmethod
    def get_audio_with_filesystem_check(parva_id, sandhi_id, padya_number, audio_dir=None):
        """
        Get gamaka vachana entry and audio path with filesystem fallback.
        
        If database audio_path is null, searches filesystem and updates database.
        """
        return AudioFileHandler.map_to_padya_with_fs_check(
            parva_id, sandhi_id, padya_number, audio_dir
        )

    @staticmethod
    def find_audio_file(parva_id, sandhi_id, padya_number, audio_dir=None):
        """
        Find audio file in filesystem with padding-aware search.
        """
        return AudioFileHandler.find_audio_file_in_filesystem(
            parva_id, sandhi_id, padya_number, audio_dir
        )

    @staticmethod
    def update_audio_path(entry_id, audio_path):
        """
        Update audio path for a gamaka vachana entry.
        """
        return AudioFileHandler.update_audio_path_in_database(entry_id, audio_path)

