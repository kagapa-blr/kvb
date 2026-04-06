import glob
import os

from flask import current_app
from model.models import GamakaVachana, db


class AudioFileHandler:
    """
    Handler for parsing and mapping audio filenames to GamakaVachana entries.

    Filename format:
        parva_id_sandhi_id_padya_number_[raga]_[artist].mp3

    Example:
        1_1_1_testraga_sunita.mp3

    Notes:
    - First 3 parts must be integers: parva_id, sandhi_id, padya_number
    - Remaining parts are optional
    - Supports padded and unpadded formats:
        1_1_1, 01_01_01, 001_001_001
    - Model fields are:
        parva_number, sandhi_number, padya_number
    """

    DEFAULT_AUDIO_DIR = os.path.join(
        os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
        "static",
        "audio",
        "gamakaAudio"
    )

    AUDIO_EXTENSIONS = {".mp3", ".wav", ".ogg", ".flac", ".m4a"}

    @staticmethod
    def parse_filename(filename):
        """
        Parse audio filename and extract parva_id, sandhi_id, padya_number.

        Args:
            filename (str): Audio filename, e.g. '1_1_1_testraga_sunita.mp3'

        Returns:
            dict
        """
        result = {
            "valid": False,
            "parva_id": None,
            "sandhi_id": None,
            "padya_number": None,
            "raga": None,
            "artist": None,
            "error": None
        }

        try:
            if not filename or not isinstance(filename, str):
                result["error"] = "Filename must be a non-empty string"
                return result

            name_without_ext = os.path.splitext(os.path.basename(filename))[0]
            parts = name_without_ext.split("_")

            if len(parts) < 3:
                result["error"] = (
                    f"Filename must have at least 3 underscore-separated parts, got {len(parts)}"
                )
                return result

            try:
                parva_id = int(parts[0])
                sandhi_id = int(parts[1])
                padya_number = int(parts[2])
            except ValueError as e:
                result["error"] = f"First 3 parts must be integers. Failed to parse: {str(e)}"
                return result

            raga = parts[3] if len(parts) > 3 else None
            artist = "_".join(parts[4:]) if len(parts) > 4 else None

            result.update({
                "valid": True,
                "parva_id": parva_id,
                "sandhi_id": sandhi_id,
                "padya_number": padya_number,
                "raga": raga,
                "artist": artist
            })

        except Exception as e:
            result["error"] = f"Error parsing filename: {str(e)}"

        return result

    @staticmethod
    def map_to_padya_entry(parva_id, sandhi_id, padya_number):
        """
        Map parva, sandhi, and padya numbers to a GamakaVachana entry.

        Model fields:
            parva_number, sandhi_number, padya_number
        """
        try:
            entry = GamakaVachana.query.filter_by(
                parva_number=parva_id,
                sandhi_number=sandhi_id,
                padya_number=padya_number
            ).first()
            return entry
        except Exception as e:
            print(f"Error mapping to padya entry: {str(e)}")
            return None

    @staticmethod
    def find_audio_file_in_filesystem(parva_id, sandhi_id, padya_number, audio_dir=None):
        """
        Find audio file in filesystem using padding-aware search.

        Supports:
        - 1_1_1_*.mp3
        - 01_01_01_*.mp3
        - 001_001_001_*.mp3
        - 1-1-1_*.mp3
        - 01-01-01-*.mp3
        - exact matches without suffix
        """
        if audio_dir is None:
            audio_dir = AudioFileHandler.DEFAULT_AUDIO_DIR

        if not os.path.isdir(audio_dir):
            return None

        try:
            search_patterns = [
                f"{parva_id}_{sandhi_id}_{padya_number}_*",
                f"{parva_id:02d}_{sandhi_id:02d}_{padya_number:02d}_*",
                f"{parva_id:03d}_{sandhi_id:03d}_{padya_number:03d}_*",

                f"{parva_id}-{sandhi_id}-{padya_number}_*",
                f"{parva_id}-{sandhi_id}-{padya_number}-*",
                f"{parva_id:02d}-{sandhi_id:02d}-{padya_number:02d}_*",
                f"{parva_id:02d}-{sandhi_id:02d}-{padya_number:02d}-*",
                f"{parva_id:03d}-{sandhi_id:03d}-{padya_number:03d}_*",
                f"{parva_id:03d}-{sandhi_id:03d}-{padya_number:03d}-*",
            ]

            exact_patterns = [
                f"{parva_id}_{sandhi_id}_{padya_number}",
                f"{parva_id:02d}_{sandhi_id:02d}_{padya_number:02d}",
                f"{parva_id:03d}_{sandhi_id:03d}_{padya_number:03d}",

                f"{parva_id}-{sandhi_id}-{padya_number}",
                f"{parva_id:02d}-{sandhi_id:02d}-{padya_number:02d}",
                f"{parva_id:03d}-{sandhi_id:03d}-{padya_number:03d}",
            ]

            for pattern in search_patterns:
                glob_pattern = os.path.join(audio_dir, f"{pattern}.*")
                matches = glob.glob(glob_pattern)

                for file_path in matches:
                    ext = os.path.splitext(file_path)[1].lower()
                    if ext in AudioFileHandler.AUDIO_EXTENSIONS and os.path.isfile(file_path):
                        return file_path

            for pattern in exact_patterns:
                for ext in AudioFileHandler.AUDIO_EXTENSIONS:
                    file_path = os.path.join(audio_dir, f"{pattern}{ext}")
                    if os.path.isfile(file_path):
                        return file_path

            return None

        except Exception as e:
            print(f"Error finding audio file in filesystem: {str(e)}")
            return None

    @staticmethod
    def update_audio_path_in_database(entry_id, audio_path):
        """
        Update audio path for a gamaka vachana entry in the database.
        """
        try:
            entry = db.session.get(GamakaVachana, entry_id)
            if not entry:
                return False

            entry.gamaka_vachakar_audio_path = audio_path
            db.session.commit()
            return True

        except Exception as e:
            print(f"Error updating audio path in database: {str(e)}")
            db.session.rollback()
            return False

    @staticmethod
    def convert_absolute_to_relative_path(absolute_path):
        """
        Convert absolute path to path relative to Flask static folder.
        Example:
            /app/static/audio/gamakaAudio/x.mp3
        becomes:
            audio/gamakaAudio/x.mp3
        """
        try:
            abs_path_normalized = os.path.normpath(absolute_path)

            if current_app:
                static_folder = current_app.static_folder
                if static_folder:
                    static_folder_normalized = os.path.normpath(static_folder)

                    if abs_path_normalized.startswith(static_folder_normalized):
                        relative_path = os.path.relpath(
                            abs_path_normalized,
                            static_folder_normalized
                        )
                        return relative_path.replace("\\", "/")

            parts = abs_path_normalized.split("static")
            if len(parts) >= 2:
                relative_part = parts[-1].lstrip("\\/").replace("\\", "/")
                return relative_part

            return absolute_path

        except Exception as e:
            print(f"Error converting path to relative: {str(e)}")
            return absolute_path

    @staticmethod
    def serialize_entry(entry):
        """
        Serialize a GamakaVachana entry for API response.
        Maps model field names to API field names.
        """
        if not entry:
            return None

        return {
            "id": entry.id,
            "parva_id": entry.parva_number,
            "sandhi_id": entry.sandhi_number,
            "padya_number": entry.padya_number,
            "raga": entry.raga,
            "gamaka_vachakara_name": entry.gamaka_vachakara_name,
            "gamaka_vachakar_photo_path": entry.gamaka_vachakar_photo_path,
            "gamaka_vachakar_audio_path": entry.gamaka_vachakar_audio_path
        }

    @staticmethod
    def map_to_padya_with_fs_check(parva_id, sandhi_id, padya_number, audio_dir=None):
        """
        Map to padya entry with filesystem fallback if database audio path is null.
        """
        result = {
            "found": False,
            "entry": None,
            "audio_path": None,
            "audio_found_in": None,
            "details": None
        }

        if audio_dir is None:
            audio_dir = AudioFileHandler.DEFAULT_AUDIO_DIR

        try:
            entry = AudioFileHandler.map_to_padya_entry(parva_id, sandhi_id, padya_number)

            if not entry:
                return result

            result["found"] = True
            result["entry"] = entry

            if entry.gamaka_vachakar_audio_path:
                result["audio_path"] = entry.gamaka_vachakar_audio_path
                result["audio_found_in"] = "database"
            else:
                audio_file_path = AudioFileHandler.find_audio_file_in_filesystem(
                    parva_id, sandhi_id, padya_number, audio_dir
                )

                if audio_file_path:
                    relative_audio_path = AudioFileHandler.convert_absolute_to_relative_path(
                        audio_file_path
                    )

                    if AudioFileHandler.update_audio_path_in_database(entry.id, relative_audio_path):
                        result["audio_path"] = relative_audio_path
                        result["audio_found_in"] = "filesystem"
                        db.session.refresh(entry)

            result["details"] = AudioFileHandler.serialize_entry(entry)

        except Exception as e:
            print(f"Error in map_to_padya_with_fs_check: {str(e)}")

        return result

    @staticmethod
    def parse_and_map(filename):
        """
        Parse filename and map to padya entry in one operation.
        """
        parse_result = AudioFileHandler.parse_filename(filename)

        result = {
            "filename": filename,
            "parse_result": parse_result,
            "padya_entry": None,
            "entry_details": None
        }

        if parse_result["valid"]:
            entry = AudioFileHandler.map_to_padya_entry(
                parse_result["parva_id"],
                parse_result["sandhi_id"],
                parse_result["padya_number"]
            )

            result["padya_entry"] = entry
            result["entry_details"] = AudioFileHandler.serialize_entry(entry)

        return result

    @staticmethod
    def process_audio_directory(directory_path):
        """
        Process all audio files in a directory and map them to padya entries.
        """
        results = []

        if not os.path.isdir(directory_path):
            return [{
                "error": f"Directory not found: {directory_path}"
            }]

        try:
            files = [
                f for f in os.listdir(directory_path)
                if os.path.splitext(f)[1].lower() in AudioFileHandler.AUDIO_EXTENSIONS
            ]

            for filename in sorted(files):
                file_result = AudioFileHandler.parse_and_map(filename)
                results.append(file_result)

        except Exception as e:
            results.append({
                "error": f"Error processing directory: {str(e)}"
            })

        return results
