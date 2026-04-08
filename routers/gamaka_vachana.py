import os
from flask import Blueprint, request, jsonify
from sqlalchemy.exc import IntegrityError

from services.gamaka_vachana_service import GamakaVachanaService

gamaka_bp = Blueprint("gamaka", __name__)


def _json_error(message, status_code=400):
    return jsonify({"error": message}), status_code


def _get_json_body():
    data = request.get_json(silent=True)
    if data is None:
        return None, _json_error("Request body must be valid JSON", 400)
    return data, None


def _validate_required_fields(data, required_fields):
    missing = [field for field in required_fields if data.get(field) in (None, "")]
    if missing:
        return f"Missing required fields: {', '.join(missing)}"
    return None


def _serialize_gamaka(g):
    """Serialize GamakaVachana model to API response (maps model fields to API field names)."""
    return {
        "id": g.id,
        "parva_number": g.parva_number,
        "sandhi_number": g.sandhi_number,
        "padya_number": g.padya_number,
        "raga": g.raga,
        "gamaka_vachakara_name": g.gamaka_vachakara_name,
        "gamaka_vachakar_photo_path": g.gamaka_vachakar_photo_path,
        "gamaka_vachakar_audio_path": g.gamaka_vachakar_audio_path,
    }


# -------------------------------------------------------
# CREATE GAMAKA VACHANA
# -------------------------------------------------------
@gamaka_bp.route("/gamaka", methods=["POST"])
def create_gamaka():
    data, error = _get_json_body()
    if error:
        return error

    validation_error = _validate_required_fields(
        data,
        ["parva_number", "sandhi_number", "padya_number", "raga", "gamaka_vachakara_name"]
    )
    if validation_error:
        return _json_error(validation_error, 400)

    try:
        gamaka = GamakaVachanaService.create(
            parva_number=int(data.get("parva_number")),
            sandhi_number=int(data.get("sandhi_number")),
            padya_number=int(data.get("padya_number")),
            raga=data.get("raga"),
            gamaka_vachakara_name=data.get("gamaka_vachakara_name"),
            gamaka_vachakar_photo_path=data.get("gamaka_vachakar_photo_path"),
            gamaka_vachakar_audio_path=data.get("gamaka_vachakar_audio_path")
        )

        return jsonify({
            "message": "Gamaka Vachana created successfully",
            "entry": _serialize_gamaka(gamaka)
        }), 201

    except ValueError:
        return _json_error("parva_number, sandhi_number, and padya_number must be integers", 400)
    except IntegrityError:
        return _json_error("Duplicate gamaka vachana entry or invalid data", 409)
    except Exception as e:
        return _json_error(str(e), 500)


# -------------------------------------------------------
# GET ALL GAMAKA ENTRIES
# -------------------------------------------------------
@gamaka_bp.route("/gamaka", methods=["GET"])
def get_all_gamaka():
    try:
        gamakas = GamakaVachanaService.get_all()
        return jsonify([_serialize_gamaka(g) for g in gamakas]), 200
    except Exception as e:
        return _json_error(str(e), 500)


# -------------------------------------------------------
# GET BY ID
# -------------------------------------------------------
@gamaka_bp.route("/gamaka/<int:gamaka_id>", methods=["GET"])
def get_gamaka(gamaka_id):
    try:
        gamaka = GamakaVachanaService.get_by_id(gamaka_id)

        if not gamaka:
            return _json_error("Gamaka entry not found", 404)

        return jsonify(_serialize_gamaka(gamaka)), 200
    except Exception as e:
        return _json_error(str(e), 500)


# -------------------------------------------------------
# GET BY PADYA
# -------------------------------------------------------
@gamaka_bp.route("/gamaka/padya", methods=["GET"])
def get_gamaka_by_padya():
    try:
        parva_number = int(request.args.get("parva_number", 0))
        sandhi_number = int(request.args.get("sandhi_number", 0))
        padya_number = int(request.args.get("padya_number", 0))

        if not (parva_number and sandhi_number and padya_number):
            return _json_error("parva_number, sandhi_number, and padya_number are required", 400)

        gamakas = GamakaVachanaService.get_by_padya(parva_number, sandhi_number, padya_number)

        return jsonify([_serialize_gamaka(g) for g in gamakas]), 200

    except ValueError:
        return _json_error("parva_number, sandhi_number, and padya_number must be integers", 400)
    except Exception as e:
        return _json_error(str(e), 500)


# -------------------------------------------------------
# UPDATE
# -------------------------------------------------------
@gamaka_bp.route("/gamaka/<int:gamaka_id>", methods=["PUT"])
def update_gamaka(gamaka_id):
    data, error = _get_json_body()
    if error:
        return error

    try:
        gamaka = GamakaVachanaService.update(
            gamaka_id=gamaka_id,
            raga=data.get("raga"),
            gamaka_vachakara_name=data.get("gamaka_vachakara_name"),
            gamaka_vachakar_photo_path=data.get("gamaka_vachakar_photo_path"),
            gamaka_vachakar_audio_path=data.get("gamaka_vachakar_audio_path")
        )

        if not gamaka:
            return _json_error("Gamaka entry not found", 404)

        return jsonify({
            "message": "Gamaka entry updated successfully",
            "entry": _serialize_gamaka(gamaka)
        }), 200

    except IntegrityError:
        return _json_error("Duplicate gamaka vachana entry or invalid data", 409)
    except Exception as e:
        return _json_error(str(e), 500)


# -------------------------------------------------------
# PATCH - Partial Update (for gamaka_vachakara_name and raga)
# -------------------------------------------------------
@gamaka_bp.route("/gamaka/update-by-padya", methods=["PATCH"])
def partial_update_gamaka_by_padya():
    """
    Partial update for Gamaka entry by padya reference.
    Fetches the first entry matching parva_number, sandhi_number, padya_number
    and updates it with the provided raga and gamaka_vachakara_name.
    
    If no entry exists, creates a new entry with the provided details.
    
    Query parameters:
    - parva_number (required)
    - sandhi_number (required)
    - padya_number (required)
    
    Request body example:
    {
        "raga": "Bhairav",
        "gamaka_vachakara_name": "Singer Name"
    }
    """
    try:
        # Get query parameters
        parva_number = int(request.args.get("parva_number", 0))
        sandhi_number = int(request.args.get("sandhi_number", 0))
        padya_number = int(request.args.get("padya_number", 0))

        if not (parva_number and sandhi_number and padya_number):
            return _json_error("parva_number, sandhi_number, and padya_number are required", 400)

        # Get request body
        data, error = _get_json_body()
        if error:
            return error

        # Check if at least one field is provided
        has_raga = "raga" in data
        has_name = "gamaka_vachakara_name" in data
        
        if not has_raga and not has_name:
            return _json_error("At least one field (raga or gamaka_vachakara_name) must be provided", 400)

        # Fetch the first entry matching the padya reference
        gamakas = GamakaVachanaService.get_by_padya(parva_number, sandhi_number, padya_number)
        
        if not gamakas:
            # Create new entry if it doesn't exist
            raga = data.get("raga", "")
            gamaka_vachakara_name = data.get("gamaka_vachakara_name", "")
            
            if not raga or not gamaka_vachakara_name:
                return _json_error("Both raga and gamaka_vachakara_name are required to create a new entry", 400)
            
            gamaka = GamakaVachanaService.create(
                parva_number=parva_number,
                sandhi_number=sandhi_number,
                padya_number=padya_number,
                raga=raga,
                gamaka_vachakara_name=gamaka_vachakara_name
            )
            
            return jsonify({
                "message": "New Gamaka entry created successfully",
                "entry": _serialize_gamaka(gamaka)
            }), 201

        # Update the first entry
        gamaka_id = gamakas[0].id
        gamaka = GamakaVachanaService.update(
            gamaka_id=gamaka_id,
            raga=data.get("raga") if has_raga else None,
            gamaka_vachakara_name=data.get("gamaka_vachakara_name") if has_name else None
        )

        return jsonify({
            "message": "Gamaka entry partially updated successfully",
            "entry": _serialize_gamaka(gamaka)
        }), 200

    except ValueError:
        return _json_error("parva_number, sandhi_number, and padya_number must be integers", 400)
    except IntegrityError:
        return _json_error("Duplicate gamaka vachana entry or invalid data", 409)
    except Exception as e:
        return _json_error(str(e), 500)


# -------------------------------------------------------
# DELETE
# -------------------------------------------------------
@gamaka_bp.route("/gamaka/<int:gamaka_id>", methods=["DELETE"])
def delete_gamaka(gamaka_id):
    try:
        deleted = GamakaVachanaService.delete(gamaka_id)

        if not deleted:
            return _json_error("Gamaka entry not found", 404)

        return jsonify({"message": "Gamaka entry deleted successfully"}), 200

    except Exception as e:
        return _json_error(str(e), 500)


# -------------------------------------------------------
# AUDIO FILE HANDLING - PARSE FILENAME
# -------------------------------------------------------
@gamaka_bp.route("/audio/parse-filename", methods=["POST"])
def parse_audio_filename():
    data, error = _get_json_body()
    if error:
        return error

    filename = data.get("filename")
    if not filename:
        return _json_error("filename is required", 400)

    try:
        result = GamakaVachanaService.parse_and_map_audio_file(filename)
        return jsonify(result), 200 if result.get("parse_result", {}).get("valid") else 400
    except Exception as e:
        return _json_error(str(e), 500)


# -------------------------------------------------------
# AUDIO FILE HANDLING - MAP TO PADYA
# -------------------------------------------------------
@gamaka_bp.route("/audio/map-to-padya", methods=["GET"])
def map_audio_to_padya():
    filename = request.args.get("filename")

    try:
        if filename:
            result = GamakaVachanaService.parse_and_map_audio_file(filename)
            return jsonify(result), 200 if result.get("parse_result", {}).get("valid") else 400

        parva_number = int(request.args.get("parva_number", 0))
        sandhi_number = int(request.args.get("sandhi_number", 0))
        padya_number = int(request.args.get("padya_number", 0))

        if not (parva_number and sandhi_number and padya_number):
            return _json_error("parva_number, sandhi_number, and padya_number are required", 400)

        entries = GamakaVachanaService.get_by_padya(parva_number, sandhi_number, padya_number)

        if entries:
            return jsonify({
                "found": True,
                "entries": [_serialize_gamaka(entry) for entry in entries]
            }), 200

        return jsonify({
            "found": False,
            "message": f"No gamaka entry found for parva_number={parva_number}, sandhi_number={sandhi_number}, padya_number={padya_number}"
        }), 404

    except ValueError:
        return _json_error("parva_number, sandhi_number, and padya_number must be integers", 400)
    except Exception as e:
        return _json_error(str(e), 500)


# -------------------------------------------------------
# AUDIO FILE HANDLING - PROCESS DIRECTORY
# -------------------------------------------------------
@gamaka_bp.route("/audio/process-directory", methods=["POST"])
def process_audio_directory():
    data, error = _get_json_body()
    if error:
        return error

    directory_path = data.get("directory_path")
    if not directory_path:
        return _json_error("directory_path is required", 400)

    try:
        results = GamakaVachanaService.process_audio_directory(directory_path)
        return jsonify({
            "total_files": len(results),
            "results": results
        }), 200
    except Exception as e:
        return _json_error(str(e), 500)


# -------------------------------------------------------
# AUDIO FILE HANDLING - GET WITH FILESYSTEM FALLBACK
# -------------------------------------------------------
@gamaka_bp.route("/audio/get-with-fs-check", methods=["GET"])
def get_audio_with_filesystem_check():
    try:
        parva_number = int(request.args.get("parva_number", 0))
        sandhi_number = int(request.args.get("sandhi_number", 0))
        padya_number = int(request.args.get("padya_number", 0))
        audio_dir = request.args.get("audio_dir")

        if not (parva_number and sandhi_number and padya_number):
            return _json_error("parva_number, sandhi_number, and padya_number are required", 400)

        result = GamakaVachanaService.get_audio_with_filesystem_check(
            parva_number, sandhi_number, padya_number, audio_dir
        )

        if result and result.get("found"):
            return jsonify(result), 200

        return jsonify({
            "found": False,
            "message": f"No gamaka/audio entry found for parva_number={parva_number}, sandhi_number={sandhi_number}, padya_number={padya_number}"
        }), 404

    except ValueError:
        return _json_error("parva_number, sandhi_number, and padya_number must be integers", 400)
    except Exception as e:
        return _json_error(str(e), 500)


# -------------------------------------------------------
# AUDIO FILE HANDLING - FIND IN FILESYSTEM
# -------------------------------------------------------
@gamaka_bp.route("/audio/find-in-filesystem", methods=["GET"])
def find_audio_in_filesystem():
    try:
        parva_number = int(request.args.get("parva_number", 0))
        sandhi_number = int(request.args.get("sandhi_number", 0))
        padya_number = int(request.args.get("padya_number", 0))
        audio_dir = request.args.get("audio_dir")

        if not (parva_number and sandhi_number and padya_number):
            return _json_error("parva_number, sandhi_number, and padya_number are required", 400)

        audio_path = GamakaVachanaService.find_audio_file(
            parva_number, sandhi_number, padya_number, audio_dir
        )

        if audio_path:
            return jsonify({
                "found": True,
                "audio_path": audio_path,
                "file_exists": os.path.isfile(audio_path),
                "parva_number": parva_number,
                "sandhi_number": sandhi_number,
                "padya_number": padya_number
            }), 200

        return jsonify({
            "found": False,
            "message": f"No audio file found for parva_number={parva_number}, sandhi_number={sandhi_number}, padya_number={padya_number}"
        }), 404

    except ValueError:
        return _json_error("parva_number, sandhi_number, and padya_number must be integers", 400)
    except Exception as e:
        return _json_error(str(e), 500)


# -------------------------------------------------------
# AUDIO FILE HANDLING - UPDATE AUDIO PATH
# -------------------------------------------------------
@gamaka_bp.route("/audio/update-path", methods=["PUT"])
def update_audio_path_endpoint():
    data, error = _get_json_body()
    if error:
        return error

    entry_id = data.get("entry_id")
    audio_path = data.get("audio_path")

    if not entry_id or not audio_path:
        return _json_error("entry_id and audio_path are required", 400)

    try:
        success = GamakaVachanaService.update_audio_path(int(entry_id), audio_path)

        if success:
            return jsonify({
                "message": "Audio path updated successfully",
                "entry_id": int(entry_id),
                "audio_path": audio_path
            }), 200

        return _json_error(f"Failed to update audio path for entry {entry_id}", 400)

    except ValueError:
        return _json_error("entry_id must be an integer", 400)
    except Exception as e:
        return _json_error(str(e), 500)


# -------------------------------------------------------
# PHOTO FILE HANDLING - GET WITH FILESYSTEM FALLBACK
# -------------------------------------------------------
@gamaka_bp.route("/photo/get-with-fs-check", methods=["GET"])
def get_photo_with_filesystem_check():
    try:
        parva_number = int(request.args.get("parva_number", 0))
        sandhi_number = int(request.args.get("sandhi_number", 0))
        padya_number = int(request.args.get("padya_number", 0))
        photos_dir = request.args.get("photos_dir")

        if not (parva_number and sandhi_number and padya_number):
            return _json_error("parva_number, sandhi_number, and padya_number are required", 400)

        photo_path = GamakaVachanaService.get_photo_with_filesystem_check(
            parva_number, sandhi_number, padya_number, photos_dir
        )

        if photo_path:
            return jsonify({
                "found": True,
                "photo_path": photo_path,
                "file_exists": os.path.isfile(photo_path),
                "parva_number": parva_number,
                "sandhi_number": sandhi_number,
                "padya_number": padya_number
            }), 200

        return jsonify({
            "found": False,
            "message": f"No photo found for parva_number={parva_number}, sandhi_number={sandhi_number}, padya_number={padya_number}"
        }), 404

    except ValueError:
        return _json_error("parva_number, sandhi_number, and padya_number must be integers", 400)
    except Exception as e:
        return _json_error(str(e), 500)


# -------------------------------------------------------
# PHOTO FILE HANDLING - FIND IN FILESYSTEM
# -------------------------------------------------------
@gamaka_bp.route("/photo/find-in-filesystem", methods=["GET"])
def find_photo_in_filesystem():
    try:
        parva_number = int(request.args.get("parva_number", 0))
        sandhi_number = int(request.args.get("sandhi_number", 0))
        padya_number = int(request.args.get("padya_number", 0))
        photos_dir = request.args.get("photos_dir")

        if not (parva_number and sandhi_number and padya_number):
            return _json_error("parva_number, sandhi_number, and padya_number are required", 400)

        photo_path = GamakaVachanaService.find_photo_file(
            parva_number, sandhi_number, padya_number, photos_dir
        )

        if photo_path:
            return jsonify({
                "found": True,
                "photo_path": photo_path,
                "file_exists": os.path.isfile(photo_path),
                "parva_number": parva_number,
                "sandhi_number": sandhi_number,
                "padya_number": padya_number
            }), 200

        return jsonify({
            "found": False,
            "message": f"No photo file found for parva_number={parva_number}, sandhi_number={sandhi_number}, padya_number={padya_number}"
        }), 404

    except ValueError:
        return _json_error("parva_number, sandhi_number, and padya_number must be integers", 400)
    except Exception as e:
        return _json_error(str(e), 500)