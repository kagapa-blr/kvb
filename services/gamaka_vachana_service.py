import os
from logging import getLogger

from sqlalchemy.exc import IntegrityError

from model.models import GamakaVachana, db
from utils.path_builder import GamakaPathBuilder

logger = getLogger(__name__)


class GamakaVachanaService:
    """Service layer for GamakaVachana with DB-first, filesystem-fallback path resolution."""

    @staticmethod
    def _serialize(gamaka):
        if not gamaka:
            return None

        return {
            "id": gamaka.id,
            "parva_number": gamaka.parva_number,
            "sandhi_number": gamaka.sandhi_number,
            "padya_number": gamaka.padya_number,
            "raga": gamaka.raga,
            "gamaka_vachakara_name": gamaka.gamaka_vachakara_name,
            "gamaka_vachakar_photo_path": gamaka.gamaka_vachakar_photo_path,
            "gamaka_vachakar_audio_path": gamaka.gamaka_vachakar_audio_path,
        }

    @staticmethod
    def create(
            parva_number,
            sandhi_number,
            padya_number,
            raga,
            gamaka_vachakara_name,
            gamaka_vachakar_photo_path=None,
            gamaka_vachakar_audio_path=None,
    ):
        photo_path = GamakaPathBuilder.normalize_path(gamaka_vachakar_photo_path)
        audio_path = GamakaPathBuilder.normalize_path(gamaka_vachakar_audio_path)

        gamaka = GamakaVachana(
            parva_number=parva_number,
            sandhi_number=sandhi_number,
            padya_number=padya_number,
            raga=raga,
            gamaka_vachakara_name=gamaka_vachakara_name,
            gamaka_vachakar_photo_path=photo_path,
            gamaka_vachakar_audio_path=audio_path,
        )

        try:
            db.session.add(gamaka)
            db.session.commit()
            logger.info(
                f"Created GamakaVachana id={gamaka.id} for "
                f"{parva_number}/{sandhi_number}/{padya_number}"
            )
            return gamaka
        except IntegrityError:
            db.session.rollback()
            logger.exception(
                f"IntegrityError while creating GamakaVachana for "
                f"{parva_number}/{sandhi_number}/{padya_number}, "
                f"name={gamaka_vachakara_name}"
            )
            raise

    @staticmethod
    def get_all():
        return (
            db.session.query(GamakaVachana)
            .order_by(
                GamakaVachana.parva_number.asc(),
                GamakaVachana.sandhi_number.asc(),
                GamakaVachana.padya_number.asc(),
                GamakaVachana.id.asc(),
            )
            .all()
        )

    @staticmethod
    def get_by_id(gamaka_id):
        return db.session.get(GamakaVachana, gamaka_id)

    @staticmethod
    def get_by_padya(parva_number, sandhi_number, padya_number):
        return (
            db.session.query(GamakaVachana)
            .filter_by(
                parva_number=parva_number,
                sandhi_number=sandhi_number,
                padya_number=padya_number,
            )
            .order_by(GamakaVachana.id.asc())
            .all()
        )

    @staticmethod
    def update(
            gamaka_id,
            raga=None,
            gamaka_vachakara_name=None,
            gamaka_vachakar_photo_path=None,
            gamaka_vachakar_audio_path=None,
    ):
        gamaka = db.session.get(GamakaVachana, gamaka_id)
        if not gamaka:
            return None

        if raga is not None:
            gamaka.raga = raga
        if gamaka_vachakara_name is not None:
            gamaka.gamaka_vachakara_name = gamaka_vachakara_name
        if gamaka_vachakar_photo_path is not None:
            gamaka.gamaka_vachakar_photo_path = GamakaPathBuilder.normalize_path(
                gamaka_vachakar_photo_path
            )
        if gamaka_vachakar_audio_path is not None:
            gamaka.gamaka_vachakar_audio_path = GamakaPathBuilder.normalize_path(
                gamaka_vachakar_audio_path
            )

        try:
            db.session.commit()
            logger.info(f"Updated GamakaVachana id={gamaka_id}")
            return gamaka
        except IntegrityError:
            db.session.rollback()
            logger.exception(f"IntegrityError while updating GamakaVachana id={gamaka_id}")
            raise

    @staticmethod
    def delete(gamaka_id):
        gamaka = db.session.get(GamakaVachana, gamaka_id)
        if not gamaka:
            return False

        try:
            db.session.delete(gamaka)
            db.session.commit()
            logger.info(f"Deleted GamakaVachana id={gamaka_id}")
            return True
        except Exception:
            db.session.rollback()
            logger.exception(f"Error while deleting GamakaVachana id={gamaka_id}")
            raise

    @staticmethod
    def _get_first_entry(parva_number, sandhi_number, padya_number):
        return (
            db.session.query(GamakaVachana)
            .filter_by(
                parva_number=parva_number,
                sandhi_number=sandhi_number,
                padya_number=padya_number,
            )
            .order_by(GamakaVachana.id.asc())
            .first()
        )

    @staticmethod
    def get_or_resolve_photo_path(parva_number, sandhi_number, padya_number, photos_dir=None):
        """
        Check DB first; if missing, search filesystem; if found, update DB and return path.
        """
        gamaka = GamakaVachanaService._get_first_entry(
            parva_number, sandhi_number, padya_number
        )
        if not gamaka:
            return None

        if gamaka.gamaka_vachakar_photo_path:
            normalized = GamakaPathBuilder.normalize_path(
                gamaka.gamaka_vachakar_photo_path
            )
            if normalized:
                return normalized

        if not photos_dir or not os.path.isdir(photos_dir):
            return None

        matches = GamakaPathBuilder.find_photos(
            photos_dir, parva_number, sandhi_number, padya_number
        )
        if not matches:
            return None

        relative_path = GamakaPathBuilder.construct_relative_photo_path(
            parva_number,
            sandhi_number,
            padya_number,
            matches[0],
        )

        try:
            gamaka.gamaka_vachakar_photo_path = relative_path
            db.session.commit()
            logger.info(
                f"Resolved and updated photo path for gamaka id={gamaka.id}: "
                f"{relative_path}"
            )
        except Exception:
            db.session.rollback()
            logger.exception(
                f"Failed updating photo path for gamaka id={gamaka.id}"
            )
            raise

        return relative_path

    @staticmethod
    def get_or_resolve_audio_path(parva_number, sandhi_number, padya_number, audio_dir=None):
        """
        Check DB first; if missing, search filesystem; if found, update DB and return path.
        """
        gamaka = GamakaVachanaService._get_first_entry(
            parva_number, sandhi_number, padya_number
        )
        if not gamaka:
            return None

        if gamaka.gamaka_vachakar_audio_path:
            normalized = GamakaPathBuilder.normalize_path(
                gamaka.gamaka_vachakar_audio_path
            )
            if normalized:
                return normalized

        if not audio_dir or not os.path.isdir(audio_dir):
            return None

        matches = GamakaPathBuilder.find_audios(
            audio_dir, parva_number, sandhi_number, padya_number
        )
        if not matches:
            return None

        relative_path = GamakaPathBuilder.construct_relative_audio_path(
            parva_number,
            sandhi_number,
            padya_number,
            matches[0],
        )

        try:
            gamaka.gamaka_vachakar_audio_path = relative_path
            db.session.commit()
            logger.info(
                f"Resolved and updated audio path for gamaka id={gamaka.id}: "
                f"{relative_path}"
            )
        except Exception:
            db.session.rollback()
            logger.exception(
                f"Failed updating audio path for gamaka id={gamaka.id}"
            )
            raise

        return relative_path
    # Alias methods for router compatibility
    @staticmethod
    def get_photo_with_filesystem_check(parva_number, sandhi_number, padya_number, photos_dir=None):
        """Alias for get_or_resolve_photo_path for router compatibility."""
        return GamakaVachanaService.get_or_resolve_photo_path(
            parva_number, sandhi_number, padya_number, photos_dir
        )

    @staticmethod
    def get_audio_with_filesystem_check(parva_number, sandhi_number, padya_number, audio_dir=None):
        """Alias for get_or_resolve_audio_path for router compatibility."""
        audio_path = GamakaVachanaService.get_or_resolve_audio_path(
            parva_number, sandhi_number, padya_number, audio_dir
        )
        
        if audio_path:
            return {
                "found": True,
                "audio_path": audio_path,
                "parva_number": parva_number,
                "sandhi_number": sandhi_number,
                "padya_number": padya_number
            }
        
        return {
            "found": False,
            "audio_path": None,
            "parva_number": parva_number,
            "sandhi_number": sandhi_number,
            "padya_number": padya_number
        }

    @staticmethod
    def find_photo_file(parva_number, sandhi_number, padya_number, photos_dir=None):
        """
        Find photo file in filesystem for given parva/sandhi/padya.
        Returns relative path if found, None otherwise. Does NOT update DB.
        """
        try:
            from flask import current_app
            if not photos_dir and current_app:
                static_folder = current_app.static_folder
                photos_dir = os.path.join(static_folder, 'photos', 'gamakaPhotos')
            
            if not os.path.isdir(photos_dir):
                return None
            
            matches = GamakaPathBuilder.find_photos(photos_dir, parva_number, sandhi_number, padya_number)
            if matches:
                return GamakaPathBuilder.construct_relative_photo_path(
                    parva_number, sandhi_number, padya_number, matches[0]
                )
        except Exception as e:
            logger.debug(f"Error finding photo file: {e}")
        
        return None

    @staticmethod
    def find_audio_file(parva_number, sandhi_number, padya_number, audio_dir=None):
        """
        Find audio file in filesystem for given parva/sandhi/padya.
        Returns relative path if found, None otherwise. Does NOT update DB.
        """
        try:
            from flask import current_app
            if not audio_dir and current_app:
                static_folder = current_app.static_folder
                audio_dir = os.path.join(static_folder, 'audio', 'gamakaAudio')
            
            if not os.path.isdir(audio_dir):
                return None
            
            matches = GamakaPathBuilder.find_audios(audio_dir, parva_number, sandhi_number, padya_number)
            if matches:
                return GamakaPathBuilder.construct_relative_audio_path(
                    parva_number, sandhi_number, padya_number, matches[0]
                )
        except Exception as e:
            logger.debug(f"Error finding audio file: {e}")
        
        return None

    @staticmethod
    def update_audio_path(gamaka_id, audio_path):
        """Update audio path for a gamaka vachana entry."""
        try:
            gamaka = db.session.get(GamakaVachana, gamaka_id)
            if not gamaka:
                logger.warning(f"GamakaVachana id={gamaka_id} not found")
                return False
            
            normalized = GamakaPathBuilder.normalize_path(audio_path)
            gamaka.gamaka_vachakar_audio_path = normalized
            db.session.commit()
            logger.info(f"Updated audio path for GamakaVachana id={gamaka_id}: {normalized}")
            return True
        except Exception as e:
            db.session.rollback()
            logger.exception(f"Error updating audio path for GamakaVachana id={gamaka_id}: {e}")
            return False

    @staticmethod
    def parse_and_map_audio_file(filename):
        """
        Parse an audio filename to extract parva/sandhi/padya numbers.
        Returns dict with parse_result and optionally found entries.
        """
        try:
            # Simple parser for formats: "1-1-1.mp3" or "01-01-01.mp3"
            name_without_ext = os.path.splitext(filename)[0]
            parts = name_without_ext.split('-')
            
            if len(parts) < 3:
                return {
                    "parse_result": {
                        "valid": False,
                        "message": f"Invalid audio filename format: {filename}. Expected: parva-sandhi-padya.ext"
                    }
                }
            
            try:
                parva_number = int(parts[0])
                sandhi_number = int(parts[1])
                padya_number = int(parts[2])
            except ValueError:
                return {
                    "parse_result": {
                        "valid": False,
                        "message": f"Could not parse numbers from filename: {filename}"
                    }
                }
            
            # Find matching entries
            entries = GamakaVachanaService.get_by_padya(parva_number, sandhi_number, padya_number)
            
            return {
                "parse_result": {
                    "valid": True,
                    "parva_number": parva_number,
                    "sandhi_number": sandhi_number,
                    "padya_number": padya_number,
                    "entries_found": len(entries)
                },
                "entries": [GamakaVachanaService._serialize(e) for e in entries] if entries else []
            }
        except Exception as e:
            logger.exception(f"Error parsing audio filename: {e}")
            return {
                "parse_result": {
                    "valid": False,
                    "message": str(e)
                }
            }

    @staticmethod
    def process_audio_directory(directory_path):
        """
        Process all audio files in a directory.
        Returns list of results for each file processed.
        """
        results = []
        try:
            if not os.path.isdir(directory_path):
                logger.warning(f"Directory not found: {directory_path}")
                return results
            
            for filename in os.listdir(directory_path):
                # Only process audio files
                if GamakaPathBuilder.AUDIO_EXTENSIONS and not any(filename.lower().endswith(ext) for ext in GamakaPathBuilder.AUDIO_EXTENSIONS):
                    continue
                
                result = GamakaVachanaService.parse_and_map_audio_file(filename)
                result['filename'] = filename
                results.append(result)
            
            logger.info(f"Processed {len(results)} audio files from directory: {directory_path}")
        except Exception as e:
            logger.exception(f"Error processing audio directory: {e}")
        
        return results