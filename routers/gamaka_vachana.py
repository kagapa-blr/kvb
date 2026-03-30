from flask import Blueprint, request, jsonify
import os

from services.gamaka_vachana import GamakaVachanaService
from utils.statistics import Statistics
from utils.audio_file_handler import AudioFileHandler

gamaka_bp = Blueprint('gamaka', __name__)
stats = Statistics()


# -------------------------------------------------------
# CREATE GAMAKA VACHANA
# -------------------------------------------------------
@gamaka_bp.route("/gamaka", methods=["POST"])
def create_gamaka():
    data = request.get_json()

    gamaka = GamakaVachanaService.create_gamaka_vachana(
        parva_id=data.get("parva_id"),
        sandhi_id=data.get("sandhi_id"),
        padya_number=data.get("padya_number"),
        raga=data.get("raga"),
        gamaka_vachakara_name=data.get("gamaka_vachakara_name"),
        gamaka_vachakar_photo_path=data.get("gamaka_vachakar_photo_path")
    )

    return jsonify({
        "message": "Gamaka Vachana created",
        "id": gamaka.id
    }), 201


# -------------------------------------------------------
# GET ALL GAMAKA ENTRIES
# -------------------------------------------------------
@gamaka_bp.route("/gamaka", methods=["GET"])
def get_all_gamaka():
    gamakas = GamakaVachanaService.get_all()

    result = []

    for g in gamakas:
        result.append({
            "id": g.id,
            "parva_id": g.parva_id,
            "sandhi_id": g.sandhi_id,
            "padya_number": g.padya_number,
            "raga": g.raga,
            "gamaka_vachakara_name": g.gamaka_vachakara_name,
            "gamaka_vachakar_photo_path": g.gamaka_vachakar_photo_path
        })

    return jsonify(result)


# -------------------------------------------------------
# GET BY ID
# -------------------------------------------------------
@gamaka_bp.route("/gamaka/<int:gamaka_id>", methods=["GET"])
def get_gamaka(gamaka_id):
    g = GamakaVachanaService.get_by_id(gamaka_id)

    if not g:
        return jsonify({"error": "Gamaka entry not found"}), 404

    return jsonify({
        "id": g.id,
        "parva_id": g.parva_id,
        "sandhi_id": g.sandhi_id,
        "padya_number": g.padya_number,
        "raga": g.raga,
        "gamaka_vachakara_name": g.gamaka_vachakara_name,
        "gamaka_vachakar_photo_path": g.gamaka_vachakar_photo_path
    })


# -------------------------------------------------------
# GET BY PADYA
# -------------------------------------------------------
@gamaka_bp.route("/gamaka/padya", methods=["GET"])
def get_gamaka_by_padya():
    parva_id = request.args.get("parva_id")
    sandhi_id = request.args.get("sandhi_id")
    padya_number = request.args.get("padya_number")

    gamakas = GamakaVachanaService.get_by_padya(
        parva_id,
        sandhi_id,
        padya_number
    )

    result = []

    for g in gamakas:
        result.append({
            "id": g.id,
            "raga": g.raga,
            "gamaka_vachakara_name": g.gamaka_vachakara_name,
            "photo": g.gamaka_vachakar_photo_path
        })

    return jsonify(result)


# -------------------------------------------------------
# UPDATE
# -------------------------------------------------------
@gamaka_bp.route("/gamaka/<int:gamaka_id>", methods=["PUT"])
def update_gamaka(gamaka_id):
    data = request.get_json()

    gamaka = GamakaVachanaService.update(
        gamaka_id,
        raga=data.get("raga"),
        gamaka_vachakara_name=data.get("gamaka_vachakara_name"),
        gamaka_vachakar_photo_path=data.get("gamaka_vachakar_photo_path")
    )

    if not gamaka:
        return jsonify({"error": "Gamaka entry not found"}), 404

    return jsonify({"message": "Gamaka entry updated"})


# -------------------------------------------------------
# DELETE
# -------------------------------------------------------
@gamaka_bp.route("/gamaka/<int:gamaka_id>", methods=["DELETE"])
def delete_gamaka(gamaka_id):
    deleted = GamakaVachanaService.delete(gamaka_id)

    if not deleted:
        return jsonify({"error": "Gamaka entry not found"}), 404

    return jsonify({"message": "Gamaka entry deleted"})


# -------------------------------------------------------
# AUDIO FILE HANDLING - PARSE FILENAME
# -------------------------------------------------------
@gamaka_bp.route("/audio/parse-filename", methods=["POST"])
def parse_audio_filename():
    """
    Parse an audio filename to extract parva_id, sandhi_id, and padya_number.
    
    Expected format: filename like '1_1_1_testraga_sunita.mp3'
    Returns parsed components and mapped padya entry if found.
    """
    data = request.get_json()
    filename = data.get("filename")

    if not filename:
        return jsonify({"error": "Filename is required"}), 400

    result = AudioFileHandler.parse_and_map(filename)

    return jsonify(result), 200 if result['parse_result']['valid'] else 400


# -------------------------------------------------------
# AUDIO FILE HANDLING - MAP TO PADYA
# -------------------------------------------------------
@gamaka_bp.route("/audio/map-to-padya", methods=["GET"])
def map_audio_to_padya():
    """
    Map audio file identifiers to a padya entry.
    
    Query params:
    - filename: audio filename (e.g., '1_1_1_testraga_sunita.mp3')
    OR
    - parva_id: parva identifier (int)
    - sandhi_id: sandhi identifier (int)
    - padya_number: padya number (int)
    """
    filename = request.args.get("filename")

    if filename:
        # Parse filename
        result = AudioFileHandler.parse_and_map(filename)
        return jsonify(result), 200 if result['parse_result']['valid'] else 400
    else:
        # Use direct parameters
        try:
            parva_id = int(request.args.get("parva_id", 0))
            sandhi_id = int(request.args.get("sandhi_id", 0))
            padya_number = int(request.args.get("padya_number", 0))

            if not (parva_id and sandhi_id and padya_number):
                return jsonify({
                    "error": "parva_id, sandhi_id, and padya_number are required"
                }), 400

            entry = AudioFileHandler.map_to_padya_entry(
                parva_id, sandhi_id, padya_number
            )

            if entry:
                return jsonify({
                    'found': True,
                    'entry': {
                        'id': entry.id,
                        'parva_id': entry.parva_id,
                        'sandhi_id': entry.sandhi_id,
                        'padya_number': entry.padya_number,
                        'raga': entry.raga,
                        'gamaka_vachakara_name': entry.gamaka_vachakara_name,
                        'gamaka_vachakar_photo_path': entry.gamaka_vachakar_photo_path,
                        'gamaka_vachakar_audio_path': entry.gamaka_vachakar_audio_path
                    }
                }), 200
            else:
                return jsonify({
                    'found': False,
                    'message': f"No padya entry found for parva_id={parva_id}, "
                              f"sandhi_id={sandhi_id}, padya_number={padya_number}"
                }), 404

        except ValueError:
            return jsonify({
                "error": "parva_id, sandhi_id, and padya_number must be integers"
            }), 400


# -------------------------------------------------------
# AUDIO FILE HANDLING - PROCESS DIRECTORY
# -------------------------------------------------------
@gamaka_bp.route("/audio/process-directory", methods=["POST"])
def process_audio_directory():
    """
    Process all audio files in a directory and map them to padya entries.
    
    Request body: {
        "directory_path": "/path/to/audio/directory"
    }
    """
    data = request.get_json()
    directory_path = data.get("directory_path")

    if not directory_path:
        return jsonify({"error": "directory_path is required"}), 400

    results = AudioFileHandler.process_audio_directory(directory_path)

    return jsonify({
        'total_files': len(results),
        'results': results
    }), 200


# -------------------------------------------------------
# AUDIO FILE HANDLING - GET WITH FILESYSTEM FALLBACK
# -------------------------------------------------------
@gamaka_bp.route("/audio/get-with-fs-check", methods=["GET"])
def get_audio_with_filesystem_check():
    """
    Get gamaka vachana entry with filesystem fallback.
    
    If database audio_path is null/none, searches filesystem for the file.
    If found, updates database so next time it returns from DB.
    
    Supports padded and unpadded formats: 1_1_1 and 01_01_01 are treated as same.
    
    Query params:
    - parva_id: parva identifier (int) - required
    - sandhi_id: sandhi identifier (int) - required
    - padya_number: padya number (int) - required
    - audio_dir: optional custom audio directory path
    """
    try:
        parva_id = int(request.args.get("parva_id", 0))
        sandhi_id = int(request.args.get("sandhi_id", 0))
        padya_number = int(request.args.get("padya_number", 0))
        audio_dir = request.args.get("audio_dir", None)

        if not (parva_id and sandhi_id and padya_number):
            return jsonify({
                "error": "parva_id, sandhi_id, and padya_number are required"
            }), 400

        result = GamakaVachanaService.get_audio_with_filesystem_check(
            parva_id, sandhi_id, padya_number, audio_dir
        )

        if result['found']:
            return jsonify({
                'found': True,
                'audio_path': result['audio_path'],
                'audio_found_in': result['audio_found_in'],
                'entry': result['details']
            }), 200
        else:
            return jsonify({
                'found': False,
                'message': f"No padya entry found for parva_id={parva_id}, "
                          f"sandhi_id={sandhi_id}, padya_number={padya_number}"
            }), 404

    except ValueError:
        return jsonify({
            "error": "parva_id, sandhi_id, and padya_number must be integers"
        }), 400


# -------------------------------------------------------
# AUDIO FILE HANDLING - FIND IN FILESYSTEM
# -------------------------------------------------------
@gamaka_bp.route("/audio/find-in-filesystem", methods=["GET"])
def find_audio_in_filesystem():
    """
    Search for audio file in filesystem with padding-aware matching.
    
    Supports both padded and unpadded formats:
    - 1_1_1_*.mp3
    - 01_01_01_*.mp3
    - 001_001_001_*.mp3
    
    Query params:
    - parva_id: parva identifier (int) - required
    - sandhi_id: sandhi identifier (int) - required
    - padya_number: padya number (int) - required
    - audio_dir: optional custom audio directory path
    """
    try:
        parva_id = int(request.args.get("parva_id", 0))
        sandhi_id = int(request.args.get("sandhi_id", 0))
        padya_number = int(request.args.get("padya_number", 0))
        audio_dir = request.args.get("audio_dir", None)

        if not (parva_id and sandhi_id and padya_number):
            return jsonify({
                "error": "parva_id, sandhi_id, and padya_number are required"
            }), 400

        audio_path = GamakaVachanaService.find_audio_file(
            parva_id, sandhi_id, padya_number, audio_dir
        )

        if audio_path:
            return jsonify({
                'found': True,
                'audio_path': audio_path,
                'file_exists': os.path.isfile(audio_path),
                'parva_id': parva_id,
                'sandhi_id': sandhi_id,
                'padya_number': padya_number
            }), 200
        else:
            return jsonify({
                'found': False,
                'message': f"No audio file found for parva_id={parva_id}, "
                          f"sandhi_id={sandhi_id}, padya_number={padya_number}"
            }), 404

    except ValueError:
        return jsonify({
            "error": "parva_id, sandhi_id, and padya_number must be integers"
        }), 400


# -------------------------------------------------------
# AUDIO FILE HANDLING - UPDATE AUDIO PATH
# -------------------------------------------------------
@gamaka_bp.route("/audio/update-path", methods=["PUT"])
def update_audio_path_endpoint():
    """
    Manually update audio path for a gamaka vachana entry.
    
    Request body: {
        "entry_id": 123,
        "audio_path": "/full/path/to/audio/file.mp3"
    }
    """
    data = request.get_json()
    entry_id = data.get("entry_id")
    audio_path = data.get("audio_path")

    if not entry_id or not audio_path:
        return jsonify({
            "error": "entry_id and audio_path are required"
        }), 400

    success = GamakaVachanaService.update_audio_path(entry_id, audio_path)

    if success:
        return jsonify({
            'message': 'Audio path updated successfully',
            'entry_id': entry_id,
            'audio_path': audio_path
        }), 200
    else:
        return jsonify({
            'error': f'Failed to update audio path for entry {entry_id}'
        }), 400
