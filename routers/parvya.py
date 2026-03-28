import logging
from flask import Blueprint, request, jsonify

from services.parvya_service import (
    parva_service,
    sandhi_service,
    padya_service,
)

logger = logging.getLogger(__name__)
parvya_bp = Blueprint("parvya", __name__)


# -------------------------------------------------------
# COMMON RESPONSE HANDLER
# -------------------------------------------------------

def handle_response(result):
    if isinstance(result, tuple):
        return jsonify(result[0]), result[1]
    return jsonify(result), 200


def get_offset_limit():
    """
    Standard helper for pagination using offset and limit.
    Example:
    /parva?offset=0&limit=20
    """
    try:
        offset = int(request.args.get("offset", 0))
        limit = int(request.args.get("limit", 20))
    except ValueError:
        offset = 0
        limit = 20

    return offset, limit


# =======================================================
# PARVA ROUTES
# =======================================================


@parvya_bp.route("/parva", methods=["GET"])
def get_all_parvas():
    offset, limit = get_offset_limit()
    return handle_response(
        parva_service.get_all(
            offset=offset,
            limit=limit,
        )
    )


@parvya_bp.route("/parva/<int:parva_number>", methods=["GET"])
def get_parva(parva_number):
    return handle_response(
        parva_service.get_by_number(parva_number)
    )


@parvya_bp.route("/parva/search", methods=["GET"])
def search_parva():
    """
    Search parva by name or number.
    
    Examples:
    /parva/search?query=ಆದಿಪರ್ವ     (search by name)
    /parva/search?query=1             (search by number)
    /parva/search?query=ಆದಿ           (partial name search)
    """
    query = request.args.get("query", "").strip()
    offset, limit = get_offset_limit()
    
    return handle_response(
        parva_service.search(
            query=query,
            offset=offset,
            limit=limit,
        )
    )


@parvya_bp.route("/parva", methods=["POST"])
def create_parva():
    try:
        data = request.get_json(silent=True) or {}
        return handle_response(
            parva_service.create(**data)
        )

    except Exception as e:
        logger.exception("Error in create_parva")
        return jsonify({"error": str(e)}), 500


@parvya_bp.route("/parva/<int:parva_number>", methods=["PUT"])
def update_parva(parva_number):
    try:
        data = request.get_json(silent=True) or {}
        return handle_response(
            parva_service.update(
                parva_number,
                **data,
            )
        )

    except Exception as e:
        logger.exception("Error in update_parva")
        return jsonify({"error": str(e)}), 500


@parvya_bp.route("/parva/<int:parva_number>", methods=["DELETE"])
def delete_parva(parva_number):
    return handle_response(
        parva_service.delete(parva_number)
    )


# =======================================================
# SANDHI ROUTES
# =======================================================


@parvya_bp.route(
    "/sandhi/by_parva/<int:parva_number>",
    methods=["GET"],
)
def get_sandhis_by_parva(parva_number):
    offset, limit = get_offset_limit()

    return handle_response(
        sandhi_service.get_by_parva(
            parva_number,
            offset=offset,
            limit=limit,
        )
    )


@parvya_bp.route(
    "/sandhi/<int:parva_number>/<int:sandhi_number>",
    methods=["GET"],
)
def get_sandhi(parva_number, sandhi_number):
    return handle_response(
        sandhi_service.get_unique(
            parva_number,
            sandhi_number,
        )
    )


@parvya_bp.route("/sandhi/search/<int:parva_number>", methods=["GET"])
def search_sandhi_by_parva(parva_number):
    """
    Search sandhi by name or number within a specific parva.
    
    Examples:
    /sandhi/search/1?query=ಸಂಭವ        (search by name in parva 1)
    /sandhi/search/1?query=1            (search by number in parva 1)
    /sandhi/search/1?query=ಸಂ            (partial name search in parva 1)
    """
    query = request.args.get("query", "").strip()
    offset, limit = get_offset_limit()
    
    return handle_response(
        sandhi_service.search(
            parva_number=parva_number,
            query=query,
            offset=offset,
            limit=limit,
        )
    )


@parvya_bp.route("/sandhi", methods=["POST"])
def create_sandhi():
    try:
        data = request.get_json(silent=True) or {}
        return handle_response(
            sandhi_service.create(**data)
        )

    except Exception as e:
        logger.exception("Error in create_sandhi")
        return jsonify({"error": str(e)}), 500


@parvya_bp.route(
    "/sandhi/<int:parva_number>/<int:sandhi_number>",
    methods=["PUT"],
)
def update_sandhi(parva_number, sandhi_number):
    try:
        data = request.get_json(silent=True) or {}
        return handle_response(
            sandhi_service.update(
                parva_number,
                sandhi_number,
                **data,
            )
        )

    except Exception as e:
        logger.exception("Error in update_sandhi")
        return jsonify({"error": str(e)}), 500


@parvya_bp.route(
    "/sandhi/<int:parva_number>/<int:sandhi_number>",
    methods=["DELETE"],
)
def delete_sandhi(parva_number, sandhi_number):
    return handle_response(
        sandhi_service.delete(
            parva_number,
            sandhi_number,
        )
    )


# =======================================================
# PADYA ROUTES
# =======================================================


@parvya_bp.route("/padya/search", methods=["GET"])
def search_padya():
    """
    Examples:

    /padya/search?keyword=ಧರ್ಮ
    /padya/search?parva_number=1
    /padya/search?parva_number=1&sandhi_number=2
    /padya/search?offset=0&limit=25
    """

    offset, limit = get_offset_limit()

    parva_number = request.args.get(
        "parva_number",
        type=int,
    )

    sandhi_number = request.args.get(
        "sandhi_number",
        type=int,
    )

    keyword = request.args.get("keyword")

    return handle_response(
        padya_service.search(
            parva_number=parva_number,
            sandhi_number=sandhi_number,
            keyword=keyword,
            offset=offset,
            limit=limit,
        )
    )


@parvya_bp.route(
    "/padya/<int:parva_number>/<int:sandhi_number>/<int:padya_number>",
    methods=["GET"],
)
def get_padya(parva_number, sandhi_number, padya_number):
    return handle_response(
        padya_service.get_unique(
            parva_number,
            sandhi_number,
            padya_number,
        )
    )


@parvya_bp.route("/padya", methods=["POST"])
def create_padya():
    try:
        data = request.get_json(silent=True) or {}

        return handle_response(
            padya_service.create(**data)
        )

    except Exception as e:
        logger.exception("Error in create_padya")
        return jsonify({"error": str(e)}), 500


@parvya_bp.route(
    "/padya/<int:parva_number>/<int:sandhi_number>/<int:padya_number>",
    methods=["PUT"],
)
def update_padya(
        parva_number,
        sandhi_number,
        padya_number,
):
    try:
        data = request.get_json(silent=True) or {}

        return handle_response(
            # Avoid passing parva/sandhi/padya identifiers twice: they are
            # provided positionally from the URL and may also be present
            # in the request body. Remove them from the kwargs to prevent
            # Python's "multiple values for argument" TypeError.
            padya_service.update(
                parva_number,
                sandhi_number,
                padya_number,
                **{k: v for k, v in data.items() if k not in (
                    'parva_number', 'sandhi_number', 'padya_number'
                )},
            )
        )

    except Exception as e:
        logger.exception("Error in update_padya")
        return jsonify({"error": str(e)}), 500


@parvya_bp.route(
    "/padya/<int:parva_number>/<int:sandhi_number>/<int:padya_number>",
    methods=["DELETE"],
)
def delete_padya(
        parva_number,
        sandhi_number,
        padya_number,
):
    return handle_response(
        padya_service.delete(
            parva_number,
            sandhi_number,
            padya_number,
        )
    )
