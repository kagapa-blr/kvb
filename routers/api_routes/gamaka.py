# gamaka_routes.py
from flask import Blueprint, request, jsonify
from sqlalchemy.exc import IntegrityError

from services.gamaka_vachana_service import GamakaVachanaService

gamaka_bp = Blueprint("gamaka", __name__)


def get_request_data():
    if request.content_type and "multipart/form-data" in request.content_type:
        data = request.form.to_dict()

        if "padya_numbers" in data and isinstance(data["padya_numbers"], str):
            data["padya_numbers"] = [
                int(x.strip())
                for x in data["padya_numbers"].split(",")
                if x.strip().isdigit()
            ]

        for key in ["parva_number", "sandhi_number", "padya_number"]:
            if key in data and str(data[key]).strip().isdigit():
                data[key] = int(data[key])

        return data

    return request.get_json(silent=True) or {}


def get_request_files():
    photo = request.files.get("photo")
    audio = request.files.get("audio")
    return photo, audio


# =======================================================
# CREATE
# =======================================================
@gamaka_bp.route("/gamaka", methods=["POST"])
def create_gamaka():
    data = get_request_data()
    photo, audio = get_request_files()

    try:
        gamaka = GamakaVachanaService.create(data, photo, audio)
        return jsonify({
            "message": "Gamaka created successfully",
            "id": gamaka.id
        }), 201
    except IntegrityError:
        return jsonify({"error": "Gamaka already exists"}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 400


# =======================================================
# READ SINGLE
# =======================================================
@gamaka_bp.route("/gamaka/<int:parva>/<int:sandhi>/<int:padya>", methods=["GET"])
def get_gamaka(parva, sandhi, padya):
    try:
        gamaka = GamakaVachanaService.get(parva, sandhi, padya)

        if not gamaka:
            return jsonify({"error": "Gamaka not found"}), 404

        return jsonify({
            "id": gamaka.id,
            "parva_number": gamaka.parva_number,
            "sandhi_number": gamaka.sandhi_number,
            "padya_number": gamaka.padya_number,
            "raga": gamaka.raga,
            "gamaka_vachakara_name": gamaka.gamaka_vachakara_name,
            "photo_path": gamaka.gamaka_vachakar_photo_path,
            "audio_path": gamaka.gamaka_vachakar_audio_path,
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 400


# =======================================================
# READ ALL
# =======================================================
@gamaka_bp.route("/gamaka", methods=["GET"])
def get_all_gamaka():
    try:
        gamakas = GamakaVachanaService.get_all()

        return jsonify([
            {
                "id": g.id,
                "parva_number": g.parva_number,
                "sandhi_number": g.sandhi_number,
                "padya_number": g.padya_number,
                "raga": g.raga,
                "gamaka_vachakara_name": g.gamaka_vachakara_name,
                "photo_path": g.gamaka_vachakar_photo_path,
                "audio_path": g.gamaka_vachakar_audio_path,
            }
            for g in gamakas
        ]), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 400


# =======================================================
# UPDATE SINGLE
# =======================================================
@gamaka_bp.route("/gamaka/<int:parva>/<int:sandhi>/<int:padya>", methods=["PUT"])
def update_gamaka(parva, sandhi, padya):
    data = get_request_data()
    photo, audio = get_request_files()

    try:
        gamaka = GamakaVachanaService.update(parva, sandhi, padya, data, photo, audio)
        return jsonify({
            "message": "Gamaka updated successfully",
            "id": gamaka.id
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 400


# =======================================================
# BULK UPDATE SANDHI
# =======================================================
@gamaka_bp.route("/gamaka/sandhi/<int:parva>/<int:sandhi>", methods=["PUT"])
def update_sandhi(parva, sandhi):

    data = get_request_data()
    photo, audio = get_request_files()

    try:
        gamakas = GamakaVachanaService.update_sandhi(parva, sandhi, data, photo, audio)
        return jsonify({
            "message": "Sandhi updated successfully",
            "count": len(gamakas)
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 400


# =======================================================
# BULK UPDATE PARVA
# =======================================================
@gamaka_bp.route("/gamaka/parva/<int:parva>", methods=["PUT"])
def update_parva(parva):
    data = get_request_data()
    photo, audio = get_request_files()

    try:
        gamakas = GamakaVachanaService.update_parva(parva, data, photo, audio)
        return jsonify({
            "message": "Parva updated successfully",
            "count": len(gamakas)
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 400


# =======================================================
# BULK UPDATE PADYA LIST
# =======================================================
@gamaka_bp.route("/gamaka/padya-list/<int:parva>/<int:sandhi>", methods=["PUT"])
def update_padya_list(parva, sandhi):
    data = get_request_data()
    photo, audio = get_request_files()

    padya_numbers = data.get("padya_numbers", [])
    if isinstance(padya_numbers, str):
        padya_numbers = [
            int(x.strip()) for x in padya_numbers.split(",") if x.strip().isdigit()
        ]

    try:
        gamakas = GamakaVachanaService.update_padya_list(
            parva, sandhi, padya_numbers, data, photo, audio
        )
        return jsonify({
            "message": "Padya list updated successfully",
            "count": len(gamakas)
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 400


# =======================================================
# DELETE
# =======================================================
@gamaka_bp.route("/gamaka/<int:parva>/<int:sandhi>/<int:padya>", methods=["DELETE"])
def delete_gamaka(parva, sandhi, padya):
    try:
        GamakaVachanaService.delete(parva, sandhi, padya)
        return jsonify({"message": "Gamaka deleted successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 400


# =======================================================
# SYNC FILES
# =======================================================
@gamaka_bp.route("/gamaka/sync", methods=["POST"])
def sync_files():
    try:
        result = GamakaVachanaService.sync_files()
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 400