from flask import Blueprint
from flask import request, jsonify

from services.additional_service import AkaradiSuchiService, GadeSuchigaluService, TippaniService
from utils.logger import get_logger

logger = get_logger()
additional_api_routes = Blueprint("additional_api", __name__)

# ===========SERVICES Instances
akaradi_suchi_service = AkaradiSuchiService()

tippani_service = TippaniService()


@additional_api_routes.route("/akaradi-suchi", methods=["GET"])
def get_akaradi_suchi():
    try:
        # -----------------------------
        # READ QUERY PARAMETERS
        # -----------------------------
        offset = request.args.get(
            "offset",
            default=0,
            type=int
        )
        limit = request.args.get(
            "limit",
            default=10,
            type=int
        )
        search = request.args.get(
            "search",
            default=None,
            type=str
        )

        parva_number = request.args.get(
            "parva_number",
            default=None,
            type=int
        )
        # Optional cleanup (recommended)
        if search:
            search = search.strip()
            if search == "":
                search = None

        # -----------------------------
        # CALL SERVICE
        # -----------------------------

        result = (
            akaradi_suchi_service
            .get_akaradi_suchi(
                offset=offset,
                limit=limit,
                search=search,
                parva_number=parva_number
            )
        )
        return jsonify(result), 200
    except Exception as e:

        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500


@additional_api_routes.route("/akaradi-suchi/refresh", methods=["GET"])
def refresh_akaradi_suchi():
    try:
        return akaradi_suchi_service.refresh_akaradi_suchi()
    except Exception as e:

        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500


@additional_api_routes.route("/tippani", methods=["GET"])
def get_tippani():
    try:
        # -----------------------------
        # READ QUERY PARAMETERS
        # -----------------------------
        offset = request.args.get("offset", default=0, type=int)
        limit = request.args.get("limit", default=10, type=int)
        search = request.args.get("search", default=None, type=str)
        parva_number = request.args.get("parva_number", default=None, type=int)

        # Cleanup search
        if search:
            search = search.strip() or None

        # -----------------------------
        # CALL SERVICE
        # -----------------------------
        result = tippani_service.get_tippani(
            offset=offset,
            limit=limit,
            search=search,
            parva_number=parva_number
        )

        return jsonify(result), 200

    except Exception as e:
        logger.exception("Error fetching Tippani")  # Log full traceback
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500


@additional_api_routes.route("/tippani/refresh", methods=["GET"])
def refresh_tippani():
    try:
        return tippani_service.refresh_tippani()
    except Exception as e:
        logger.exception("Error Refreshing Tippani")  # Log full traceback
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500
