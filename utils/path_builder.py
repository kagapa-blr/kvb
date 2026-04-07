import os

from utils.logger import get_logger

logger = get_logger()


class GamakaPathBuilder:
    """
    Builds file paths for gamaka vachana photos and audio files.

    Supported filename formats:
    - Photo: {parva}_{sandhi}_{padya}_anything.jpg
             Example: 1_1_1_rekha-prasad.jpg, 01_01_01_rekha-prasad.jpg
    - Audio: {parva}-{sandhi}-{padya}.mp3
             Example: 1-1-1.mp3, 01-01-01.mp3

    Leading zeros are ignored while matching parva/sandhi/padya numbers.
    """

    PHOTOS_SUBDIR = "photos/gamakaPhotos"
    AUDIO_SUBDIR = "audio/gamakaAudio"

    PHOTO_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".webp"}
    AUDIO_EXTENSIONS = {".mp3", ".wav", ".ogg", ".flac", ".m4a"}

    @staticmethod
    def _safe_int(value):
        """
        Convert a value to int safely.
        Returns None if conversion fails.
        """
        try:
            return int(str(value).strip())
        except (TypeError, ValueError):
            return None

    @staticmethod
    def _normalize_triplet(parva_number, sandhi_number, padya_number):
        """
        Normalize input triplet to integers for comparison.
        """
        p = GamakaPathBuilder._safe_int(parva_number)
        s = GamakaPathBuilder._safe_int(sandhi_number)
        pd = GamakaPathBuilder._safe_int(padya_number)

        if p is None or s is None or pd is None:
            logger.warning(
                "Invalid parva/sandhi/padya values: parva=%r, sandhi=%r, padya=%r",
                parva_number,
                sandhi_number,
                padya_number,
            )
            return None

        return p, s, pd

    @staticmethod
    def get_photo_filename_pattern(parva_number, sandhi_number, padya_number):
        """
        Get a human-readable filename pattern for photo files.

        Returns:
            str: Pattern like "1_1_1_"
        """
        return f"{int(parva_number)}_{int(sandhi_number)}_{int(padya_number)}_"

    @staticmethod
    def get_audio_filename_pattern(parva_number, sandhi_number, padya_number):
        """
        Get a human-readable filename pattern for audio files.

        Returns:
            str: Pattern like "1-1-1"
        """
        return f"{int(parva_number)}-{int(sandhi_number)}-{int(padya_number)}"

    @staticmethod
    def construct_relative_photo_path(parva_number, sandhi_number, padya_number, filename):
        """
        Construct a relative path for a photo file.

        Args:
            parva_number (int): Parva number
            sandhi_number (int): Sandhi number
            padya_number (int): Padya number
            filename (str): Actual filename

        Returns:
            str: Relative path like "photos/gamakaPhotos/1_1_1_artist.jpg"
        """
        if not filename:
            logger.warning(
                "Empty filename passed to construct_relative_photo_path for parva=%r, sandhi=%r, padya=%r",
                parva_number,
                sandhi_number,
                padya_number,
            )
            return None

        return f"{GamakaPathBuilder.PHOTOS_SUBDIR}/{filename}"

    @staticmethod
    def construct_relative_audio_path(parva_number, sandhi_number, padya_number, filename):
        """
        Construct a relative path for an audio file.

        Args:
            parva_number (int): Parva number
            sandhi_number (int): Sandhi number
            padya_number (int): Padya number
            filename (str): Actual filename

        Returns:
            str: Relative path like "audio/gamakaAudio/01-01-01.mp3"
        """
        if not filename:
            logger.warning(
                "Empty filename passed to construct_relative_audio_path for parva=%r, sandhi=%r, padya=%r",
                parva_number,
                sandhi_number,
                padya_number,
            )
            return None

        return f"{GamakaPathBuilder.AUDIO_SUBDIR}/{filename}"

    @staticmethod
    def normalize_path(file_path):
        """
        Normalize file paths - convert absolute paths to relative paths.

        Examples:
        - Input: "C:/Users/techk/Desktop/kagapa/kvb/static/photos/gamakaPhotos/file.jpg"
        - Output: "photos/gamakaPhotos/file.jpg"
        - Input: "photos/gamakaPhotos/file.jpg"
        - Output: "photos/gamakaPhotos/file.jpg"
        - Input: None or empty string
        - Output: None

        Returns relative path or None if invalid.
        """
        if not file_path or not isinstance(file_path, str):
            logger.debug("Invalid file_path passed to normalize_path: %r", file_path)
            return None

        normalized = file_path.replace("\\", "/")

        if "photos/gamakaPhotos/" in normalized:
            idx = normalized.find("photos/gamakaPhotos/")
            return normalized[idx:]

        if "audio/gamakaAudio/" in normalized:
            idx = normalized.find("audio/gamakaAudio/")
            return normalized[idx:]

        if not os.path.isabs(normalized):
            return normalized

        logger.debug("Could not normalize absolute path: %s", file_path)
        return None

    @staticmethod
    def _match_photo_file(filename, parva_number, sandhi_number, padya_number):
        """
        Match photo filenames like:
        - 1_1_1_rekha-prasad.jpg
        - 01_01_01_rekha-prasad.jpg

        The first 3 underscore-separated parts are treated as
        parva_number, sandhi_number, padya_number.
        Any remaining suffix is ignored.
        """
        expected = GamakaPathBuilder._normalize_triplet(
            parva_number, sandhi_number, padya_number
        )
        if expected is None:
            return False

        name, ext = os.path.splitext(filename)
        if ext.lower() not in GamakaPathBuilder.PHOTO_EXTENSIONS:
            return False

        parts = name.split("_")
        if len(parts) < 3:
            logger.debug("Photo filename does not have 3 underscore parts: %s", filename)
            return False

        p = GamakaPathBuilder._safe_int(parts[0])
        s = GamakaPathBuilder._safe_int(parts[1])
        pd = GamakaPathBuilder._safe_int(parts[2])

        if p is None or s is None or pd is None:
            logger.debug("Photo filename has non-numeric triplet: %s", filename)
            return False

        return (p, s, pd) == expected

    @staticmethod
    def _match_audio_file(filename, parva_number, sandhi_number, padya_number):
        """
        Match audio filenames like:
        - 1-1-1.mp3
        - 01-01-01.mp3

        The first 3 hyphen-separated parts are treated as
        parva_number, sandhi_number, padya_number.
        """
        expected = GamakaPathBuilder._normalize_triplet(
            parva_number, sandhi_number, padya_number
        )
        if expected is None:
            return False

        name, ext = os.path.splitext(filename)
        if ext.lower() not in GamakaPathBuilder.AUDIO_EXTENSIONS:
            return False

        parts = name.split("-")
        if len(parts) < 3:
            logger.debug("Audio filename does not have 3 hyphen parts: %s", filename)
            return False

        p = GamakaPathBuilder._safe_int(parts[0])
        s = GamakaPathBuilder._safe_int(parts[1])
        pd = GamakaPathBuilder._safe_int(parts[2])

        if p is None or s is None or pd is None:
            logger.debug("Audio filename has non-numeric triplet: %s", filename)
            return False

        return (p, s, pd) == expected

    @staticmethod
    def find_file_with_pattern(directory, pattern, extensions):
        """
        Find a file in a directory matching a simple startswith pattern and extension set.

        Args:
            directory (str): Directory to search in
            pattern (str): Filename prefix to match
            extensions (set): Allowed extensions

        Returns:
            str: Full path to first matching file or None
        """
        if not os.path.isdir(directory):
            logger.debug("Directory not found in find_file_with_pattern: %s", directory)
            return None

        try:
            for filename in os.listdir(directory):
                if filename.startswith(pattern):
                    _, ext = os.path.splitext(filename)
                    if ext.lower() in extensions:
                        return os.path.join(directory, filename)
        except OSError:
            logger.exception("OS error while searching in directory: %s", directory)
        except Exception:
            logger.exception("Unexpected error while searching in directory: %s", directory)

        return None

    @staticmethod
    def find_photos(directory, parva_number, sandhi_number, padya_number):
        """
        Find all photo files for a given parva/sandhi/padya.

        Supports:
        - 1_1_1_rekha-prasad.jpg
        - 01_01_01_rekha-prasad.jpg

        Returns:
            list: Sorted list of matching filenames
        """
        if not os.path.isdir(directory):
            logger.debug("Photos directory not found: %s", directory)
            return []

        matches = []
        try:
            for filename in os.listdir(directory):
                if GamakaPathBuilder._match_photo_file(
                    filename, parva_number, sandhi_number, padya_number
                ):
                    matches.append(filename)
        except OSError:
            logger.exception("OS error while finding photos in directory: %s", directory)
        except Exception:
            logger.exception("Unexpected error while finding photos in directory: %s", directory)

        return sorted(matches)

    @staticmethod
    def find_audios(directory, parva_number, sandhi_number, padya_number):
        """
        Find all audio files for a given parva/sandhi/padya.

        Supports:
        - 1-1-1.mp3
        - 01-01-01.mp3

        Returns:
            list: Sorted list of matching filenames
        """
        if not os.path.isdir(directory):
            logger.debug("Audio directory not found: %s", directory)
            return []

        matches = []
        try:
            for filename in os.listdir(directory):
                if GamakaPathBuilder._match_audio_file(
                    filename, parva_number, sandhi_number, padya_number
                ):
                    matches.append(filename)
        except OSError:
            logger.exception("OS error while finding audios in directory: %s", directory)
        except Exception:
            logger.exception("Unexpected error while finding audios in directory: %s", directory)

        return sorted(matches)