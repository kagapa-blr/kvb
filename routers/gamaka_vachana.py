from flask import Blueprint, request, jsonify

from services.gamaka_vachana import GamakaVachanaService
from utils.statistics import Statistics

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
