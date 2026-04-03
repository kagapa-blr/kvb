import logging

from flask import Blueprint
from flask import request, jsonify

from services.additional_service import AkaradiSuchiService, GadeSuchigaluService

logger = logging.getLogger(__name__)
additional_api_routes = Blueprint("additional_api", __name__)

# ===========SERVICES Instances
akaradi_suchi_service = AkaradiSuchiService()



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

