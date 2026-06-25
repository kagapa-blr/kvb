import os
import shutil
from io import BytesIO
from werkzeug.utils import secure_filename

from model.models import GamakaVachana, db
from utils.logger import get_logger
logger = get_logger(logger_name="gamaka_vachana_service")
class GamakaVachanaService:
    PHOTO_FOLDER = "static/photos/gamakaPhotos"
    AUDIO_FOLDER = "static/audio/gamakaAudio"

    PHOTO_EXTENSIONS = {"jpg", "jpeg", "png", "webp"}
    AUDIO_EXTENSIONS = {"mp3", "wav", "ogg"}
    # =======================================================
    # Folder Management
    # =======================================================
    @staticmethod
    def create_folders():
        os.makedirs(GamakaVachanaService.PHOTO_FOLDER, exist_ok=True)
        os.makedirs(GamakaVachanaService.AUDIO_FOLDER, exist_ok=True)
    # =======================================================
    # Validation Helpers
    # =======================================================
    @staticmethod
    def allowed_file(filename, allowed_extensions):
        return (
                filename is not None
                and "." in filename
                and filename.rsplit(".", 1)[1].lower() in allowed_extensions
        )
    @staticmethod
    def validate_required_numbers(parva_number, sandhi_number, padya_number):
        if parva_number is None or sandhi_number is None or padya_number is None:
            raise Exception("parva_number, sandhi_number and padya_number are required")
    @staticmethod
    def validate_create_data(data):
        required_fields = [
                "parva_number",
                "sandhi_number",
                "padya_number",
                "gamaka_vachakara_name",
                ]

        missing = [field for field in required_fields if data.get(field) in (None, "")]
        if missing:
            raise Exception(f"Missing required fields: {', '.join(missing)}")
    # =======================================================
    # Query Helpers
    # =======================================================
    @staticmethod
    def get_by_numbers(parva_number, sandhi_number, padya_number):
        return GamakaVachana.query.filter_by(
                parva_number=parva_number,
                sandhi_number=sandhi_number,
                padya_number=padya_number,
                ).first()
    @staticmethod
    def get(parva_number, sandhi_number, padya_number):
        return GamakaVachanaService.get_by_numbers(parva_number, sandhi_number, padya_number)
    @staticmethod
    def get_all():
        return GamakaVachana.query.order_by(
                GamakaVachana.parva_number,
                GamakaVachana.sandhi_number,
                GamakaVachana.padya_number,
                ).all()
    # =======================================================
    # File Helpers
    # =======================================================
    @staticmethod
    def get_file_extension(filename):
        if not filename or "." not in filename:
            raise Exception("Invalid filename")
        return filename.rsplit(".", 1)[1].lower()
    @staticmethod
    def get_target_folder_by_extension(extension):
        if extension in GamakaVachanaService.PHOTO_EXTENSIONS:
            return GamakaVachanaService.PHOTO_FOLDER
        if extension in GamakaVachanaService.AUDIO_EXTENSIONS:
            return GamakaVachanaService.AUDIO_FOLDER
        raise Exception("Unsupported file type")
    @staticmethod
    def delete_file_if_exists(filepath):
        if filepath and os.path.exists(filepath):
            os.remove(filepath)
    @staticmethod
    def build_filename(parva_number, sandhi_number, padya_number, extension):
        return secure_filename(f"{parva_number}_{sandhi_number}_{padya_number}.{extension}")
    @staticmethod
    def save_uploaded_file(file, parva_number, sandhi_number, padya_number):
        if not file or not getattr(file, "filename", None):
            return None

        if file.filename.strip() == "":
            return None

        GamakaVachanaService.create_folders()

        extension = GamakaVachanaService.get_file_extension(file.filename)
        folder = GamakaVachanaService.get_target_folder_by_extension(extension)
        filename = GamakaVachanaService.build_filename(
                parva_number, sandhi_number, padya_number, extension
                )
        filepath = os.path.join(folder, filename)

        file.save(filepath)
        return filepath.replace("\\", "/")
    @staticmethod
    def read_uploaded_file_bytes(file, allowed_extensions):
        if not file or not getattr(file, "filename", None):
            return None

        if file.filename.strip() == "":
            return None

        if not GamakaVachanaService.allowed_file(file.filename, allowed_extensions):
            raise Exception(f"Unsupported file type: {file.filename}")

        file.stream.seek(0)
        content = file.read()
        file.stream.seek(0)
        return content
    @staticmethod
    def save_bytes_file(content, original_filename, parva_number, sandhi_number, padya_number):
        if content is None:
            return None

        GamakaVachanaService.create_folders()

        extension = GamakaVachanaService.get_file_extension(original_filename)
        folder = GamakaVachanaService.get_target_folder_by_extension(extension)
        filename = GamakaVachanaService.build_filename(
                parva_number, sandhi_number, padya_number, extension
                )
        filepath = os.path.join(folder, filename)

        with open(filepath, "wb") as f:
            f.write(content)

        return filepath.replace("\\", "/")
    # =======================================================
    # CREATE
    # =======================================================
    @staticmethod
    def create(data, photo=None, audio=None):
        GamakaVachanaService.validate_create_data(data)

        parva_number = int(data["parva_number"])
        sandhi_number = int(data["sandhi_number"])
        padya_number = int(data["padya_number"])

        if GamakaVachanaService.get_by_numbers(parva_number, sandhi_number, padya_number):
            raise Exception("Gamaka already exists")

        try:
            photo_path = None
            audio_path = None

            if photo and photo.filename:
                if not GamakaVachanaService.allowed_file(
                        photo.filename, GamakaVachanaService.PHOTO_EXTENSIONS
                        ):
                    raise Exception("Unsupported photo file type")
                photo_path = GamakaVachanaService.save_uploaded_file(
                        photo, parva_number, sandhi_number, padya_number
                        )

            if audio and audio.filename:
                if not GamakaVachanaService.allowed_file(
                        audio.filename, GamakaVachanaService.AUDIO_EXTENSIONS
                        ):
                    raise Exception("Unsupported audio file type")
                audio_path = GamakaVachanaService.save_uploaded_file(
                        audio, parva_number, sandhi_number, padya_number
                        )

            gamaka = GamakaVachana(
                    parva_number=parva_number,
                    sandhi_number=sandhi_number,
                    padya_number=padya_number,
                    raga=data.get("raga"),
                    gamaka_vachakara_name=data["gamaka_vachakara_name"],
                    gamaka_vachakar_photo_path=photo_path,
                    gamaka_vachakar_audio_path=audio_path,
                    )

            db.session.add(gamaka)
            db.session.commit()
            return gamaka

        except Exception:
            db.session.rollback()
            raise
    # =======================================================
    # UPDATE SINGLE
    # =======================================================
    @staticmethod
    def update(parva_number, sandhi_number, padya_number, data, photo=None, audio=None):
        gamaka = GamakaVachanaService.get_by_numbers(parva_number, sandhi_number, padya_number)
        if not gamaka:
            raise Exception("Gamaka not found")

        try:
            if "raga" in data:
                gamaka.raga = data.get("raga") or gamaka.raga

            if "gamaka_vachakara_name" in data and data.get("gamaka_vachakara_name"):
                gamaka.gamaka_vachakara_name = data["gamaka_vachakara_name"]

            if photo and photo.filename:
                if not GamakaVachanaService.allowed_file(
                        photo.filename, GamakaVachanaService.PHOTO_EXTENSIONS
                        ):
                    raise Exception("Unsupported photo file type")

                old_photo = gamaka.gamaka_vachakar_photo_path
                new_photo_path = GamakaVachanaService.save_uploaded_file(
                        photo, parva_number, sandhi_number, padya_number
                        )
                gamaka.gamaka_vachakar_photo_path = new_photo_path
                if old_photo and old_photo != new_photo_path:
                    GamakaVachanaService.delete_file_if_exists(old_photo)

            if audio and audio.filename:
                if not GamakaVachanaService.allowed_file(
                        audio.filename, GamakaVachanaService.AUDIO_EXTENSIONS
                        ):
                    raise Exception("Unsupported audio file type")

                old_audio = gamaka.gamaka_vachakar_audio_path
                new_audio_path = GamakaVachanaService.save_uploaded_file(
                        audio, parva_number, sandhi_number, padya_number
                        )
                gamaka.gamaka_vachakar_audio_path = new_audio_path
                if old_audio and old_audio != new_audio_path:
                    GamakaVachanaService.delete_file_if_exists(old_audio)

            db.session.commit()
            return gamaka

        except Exception:
            db.session.rollback()
            raise
    # =======================================================
    # BULK UPDATE SANDHI
    # =======================================================
    @staticmethod
    def update_sandhi(parva_number, sandhi_number, data, photo=None, audio=None):
        from model.models import Padya, Sandhi, Parva
        # Get all padya numbers for this sandhi by joining through Sandhi and Parva
        padyas = (
                Padya.query.join(Sandhi).join(Parva)
                .filter(Parva.parva_number == parva_number, Sandhi.sandhi_number == sandhi_number)
                .all()
        )
        padya_numbers = data.get("padya_numbers") or sorted([p.padya_number for p in padyas])

        if not padya_numbers:
            raise Exception("No padya_numbers found for sandhi update")

        # Save single copy of photo/audio if provided
        photo_path = None
        audio_path = None

        if photo and photo.filename:
            if not GamakaVachanaService.allowed_file(photo.filename, GamakaVachanaService.PHOTO_EXTENSIONS):
                raise Exception("Unsupported photo file type")
            photo_path = GamakaVachanaService.save_uploaded_file(photo, parva_number, sandhi_number, padya_numbers[0])

        if audio and audio.filename:
            if not GamakaVachanaService.allowed_file(audio.filename, GamakaVachanaService.AUDIO_EXTENSIONS):
                raise Exception("Unsupported audio file type")
            audio_path = GamakaVachanaService.save_uploaded_file(audio, parva_number, sandhi_number, padya_numbers[0])

        updated_entries = []

        try:
            for padya_number in padya_numbers:
                gamaka = GamakaVachanaService.get_by_numbers(parva_number, sandhi_number, int(padya_number))

                # If gamaka doesn't exist, create new entry since padya exists
                if not gamaka:
                    gamaka = GamakaVachana(
                            parva_number=parva_number,
                            sandhi_number=sandhi_number,
                            padya_number=int(padya_number),
                            )
                    db.session.add(gamaka)

                # Update fields
                if "raga" in data:
                    gamaka.raga = data.get("raga") or gamaka.raga
                if "gamaka_vachakara_name" in data and data.get("gamaka_vachakara_name"):
                    gamaka.gamaka_vachakara_name = data.get("gamaka_vachakara_name")

                # Assign same DB path for all padyas
                if photo_path:
                    gamaka.gamaka_vachakar_photo_path = photo_path
                if audio_path:
                    gamaka.gamaka_vachakar_audio_path = audio_path

                updated_entries.append(gamaka)

            db.session.commit()
            return updated_entries

        except Exception:
            db.session.rollback()
            raise
    @staticmethod
    def update_parva(parva_number, data, photo=None, audio=None):
        from model.models import Padya, Sandhi, Parva
        # Get all (sandhi_number, padya_number) pairs for this parva
        padyas = (
                Padya.query.join(Sandhi).join(Parva)
                .filter(Parva.parva_number == parva_number)
                .all()
        )
        padya_list = data.get("padya_list") or [(p.sandhi.sandhi_number, p.padya_number) for p in padyas]

        if not padya_list:
            raise Exception("No padya_list found for parva update")

        # Save single copy of photo/audio if provided
        photo_path = None
        audio_path = None

        if photo and photo.filename:
            if not GamakaVachanaService.allowed_file(photo.filename, GamakaVachanaService.PHOTO_EXTENSIONS):
                raise Exception("Unsupported photo file type")
            first_sandhi, first_padya = padya_list[0]
            photo_path = GamakaVachanaService.save_uploaded_file(photo, parva_number, first_sandhi, first_padya)

        if audio and audio.filename:
            if not GamakaVachanaService.allowed_file(audio.filename, GamakaVachanaService.AUDIO_EXTENSIONS):
                raise Exception("Unsupported audio file type")
            first_sandhi, first_padya = padya_list[0]
            audio_path = GamakaVachanaService.save_uploaded_file(audio, parva_number, first_sandhi, first_padya)

        updated_entries = []

        try:
            for sandhi_number, padya_number in padya_list:
                gamaka = GamakaVachanaService.get_by_numbers(parva_number, int(sandhi_number), int(padya_number))

                # Create missing gamaka entry if padya exists
                if not gamaka:
                    gamaka = GamakaVachana(
                            parva_number=parva_number,
                            sandhi_number=int(sandhi_number),
                            padya_number=int(padya_number),
                            )
                    db.session.add(gamaka)

                if "raga" in data:
                    gamaka.raga = data.get("raga") or gamaka.raga
                if "gamaka_vachakara_name" in data and data.get("gamaka_vachakara_name"):
                    gamaka.gamaka_vachakara_name = data.get("gamaka_vachakara_name")

                # Assign same DB path for all padyas
                if photo_path:
                    gamaka.gamaka_vachakar_photo_path = photo_path
                if audio_path:
                    gamaka.gamaka_vachakar_audio_path = audio_path

                updated_entries.append(gamaka)

            db.session.commit()
            return updated_entries

        except Exception:
            db.session.rollback()
            raise
    @staticmethod
    def update_padya_list(parva_number, sandhi_number, padya_numbers, data, photo=None, audio=None):
        from model.models import Padya, Sandhi, Parva
        if not padya_numbers:
            # Auto-discover all padya numbers for this sandhi
            padyas = (
                    Padya.query.join(Sandhi).join(Parva)
                    .filter(Parva.parva_number == parva_number, Sandhi.sandhi_number == sandhi_number)
                    .all()
            )
            padya_numbers = [p.padya_number for p in padyas]

        if not padya_numbers:
            raise Exception("No padya_numbers found for padya list update")

        # Save single copy of photo/audio if provided
        photo_path = None
        audio_path = None

        if photo and photo.filename:
            if not GamakaVachanaService.allowed_file(photo.filename, GamakaVachanaService.PHOTO_EXTENSIONS):
                raise Exception("Unsupported photo file type")
            photo_path = GamakaVachanaService.save_uploaded_file(photo, parva_number, sandhi_number, padya_numbers[0])

        if audio and audio.filename:
            if not GamakaVachanaService.allowed_file(audio.filename, GamakaVachanaService.AUDIO_EXTENSIONS):
                raise Exception("Unsupported audio file type")
            audio_path = GamakaVachanaService.save_uploaded_file(audio, parva_number, sandhi_number, padya_numbers[0])

        updated_entries = []

        try:
            for padya_number in padya_numbers:
                gamaka = GamakaVachanaService.get_by_numbers(parva_number, sandhi_number, int(padya_number))

                # Create missing gamaka entry if padya exists
                if not gamaka:
                    gamaka = GamakaVachana(
                            parva_number=parva_number,
                            sandhi_number=sandhi_number,
                            padya_number=int(padya_number),
                            )
                    db.session.add(gamaka)

                if "raga" in data:
                    gamaka.raga = data.get("raga") or gamaka.raga
                if "gamaka_vachakara_name" in data and data.get("gamaka_vachakara_name"):
                    gamaka.gamaka_vachakara_name = data.get("gamaka_vachakara_name")

                # Assign same DB path for all padyas
                if photo_path:
                    gamaka.gamaka_vachakar_photo_path = photo_path
                if audio_path:
                    gamaka.gamaka_vachakar_audio_path = audio_path

                updated_entries.append(gamaka)

            db.session.commit()
            return updated_entries

        except Exception:
            db.session.rollback()
            raise


    # =======================================================
    # DELETE
    # =======================================================

    @staticmethod
    def delete(parva_number, sandhi_number, padya_number):
        gamaka = GamakaVachanaService.get_by_numbers(parva_number, sandhi_number, padya_number)
        if not gamaka:
            raise Exception("Gamaka not found")

        try:
            photo_path = gamaka.gamaka_vachakar_photo_path
            audio_path = gamaka.gamaka_vachakar_audio_path

            db.session.delete(gamaka)
            db.session.commit()

            GamakaVachanaService.delete_file_if_exists(photo_path)
            GamakaVachanaService.delete_file_if_exists(audio_path)

            return True

        except Exception:
            db.session.rollback()
            raise
    # =======================================================
    # SYNC FILES
    # =======================================================
    @staticmethod
    def sync_files():
        GamakaVachanaService.create_folders()

        folders = [
                (GamakaVachanaService.PHOTO_FOLDER, "photo"),
                (GamakaVachanaService.AUDIO_FOLDER, "audio"),
                ]

        updated = 0
        created = 0
        logger.info(f"Syncing files started: {folders}")

        try:
            for folder, file_type in folders:
                for filename in os.listdir(folder):
                    logger.info(f"Syncing {filename}")

                    name, ext = os.path.splitext(filename)

                    # Normalize separators: replace '-' with '_'
                    name = name.replace("-", "_")
                    parts = name.split("_")

                    if len(parts) < 3:
                        continue

                    try:
                        parva_number = int(parts[0].lstrip("0") or "0")
                        sandhi_number = int(parts[1].lstrip("0") or "0")
                        padya_number = int(parts[2].lstrip("0") or "0")
                    except ValueError:
                        continue

                    gamaka = GamakaVachanaService.get_by_numbers(
                            parva_number, sandhi_number, padya_number
                            )

                    # Always enforce underscore naming convention
                    correct_name = secure_filename(
                            f"{parva_number}_{sandhi_number}_{padya_number}{ext.lower()}"
                            )
                    old_path = os.path.join(folder, filename)
                    new_path = os.path.join(folder, correct_name)

                    # Rename file if needed
                    if filename != correct_name:
                        if os.path.exists(new_path):
                            os.remove(new_path)
                        shutil.move(old_path, new_path)
                        logger.info(f"Renamed {filename} -> {correct_name}")

                    db_path = new_path.replace("\\", "/")

                    # If DB entry exists, update it
                    if gamaka:
                        if not os.path.exists(new_path):
                            logger.warning(f"File missing in filesystem: {new_path}")
                            if file_type == "photo":
                                gamaka.gamaka_vachakar_photo_path = None
                            else:
                                gamaka.gamaka_vachakar_audio_path = None
                        else:
                            if file_type == "photo":
                                gamaka.gamaka_vachakar_photo_path = db_path
                            else:
                                gamaka.gamaka_vachakar_audio_path = db_path
                        updated += 1

                    # If DB entry does not exist, create a new one
                    else:
                        if os.path.exists(new_path):
                            from model.models import GamakaVachana
                            new_entry = GamakaVachana(
                                    parva_number=parva_number,
                                    sandhi_number=sandhi_number,
                                    padya_number=padya_number,
                                    gamaka_vachakara_name=None,
                                    raga=None,
                                    gamaka_vachakar_photo_path=db_path if file_type == "photo" else None,
                                    gamaka_vachakar_audio_path=db_path if file_type == "audio" else None,
                                    )
                            db.session.add(new_entry)
                            created += 1
                            logger.info(f"Created new DB entry for {correct_name}")

            db.session.commit()
            return {
                    "message": "Sync completed",
                    "updated": updated,
                    "created": created
                    }

        except Exception as e:
            db.session.rollback()
            logger.error(f"Sync failed: {e}")
            raise
