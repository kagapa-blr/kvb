import logging
import csv
import io
from flask import Blueprint, request, jsonify
from services.additional_service import GadeSuchigaluService

logger = logging.getLogger(__name__)
gadesuchi_api_routes = Blueprint("gade_api", __name__)
gade_service = GadeSuchigaluService()

INTEGER_FIELDS = ["parva_number", "sandhi_number", "padya_number"]


def _normalize_json_payload(data):
    if not isinstance(data, dict):
        return None, "Invalid JSON payload"

    normalized = dict(data)

    for key in INTEGER_FIELDS:
        value = normalized.get(key)
        if value in [None, ""]:
            normalized[key] = None
            continue
        try:
            normalized[key] = int(value)
        except (TypeError, ValueError):
            return None, f"{key} must be an integer"

    return normalized, None


# ================== GET /gade-suchigalu
@gadesuchi_api_routes.route("/", methods=["GET"])
def get_gade_suchigalu():
    try:
        draw = request.args.get("draw", type=int)
        start = request.args.get("start", default=0, type=int)
        length = request.args.get("length", default=10, type=int)

        search_value = request.args.get("search[value]", default=None, type=str)
        if search_value is None:
            search_value = request.args.get("search", default=None, type=str)

        parva_number = request.args.get("parva_number", default=None, type=int)

        offset = start
        limit = length

        result = gade_service.get_gade_suchigalu(
            offset=offset,
            limit=limit,
            search=search_value,
            parva_number=parva_number
        )

        if draw is not None:
            return jsonify({
                "draw": draw,
                "recordsTotal": result.get("total", 0),
                "recordsFiltered": result.get("total", 0),
                "data": result.get("data", [])
            }), 200

        return jsonify(result), 200

    except Exception as e:
        logger.exception("Error fetching GadeSuchigalu")
        return jsonify({"status": "error", "message": str(e)}), 500


# ================== GET /gade-suchigalu/<id>
@gadesuchi_api_routes.route("/<int:record_id>", methods=["GET"])
def get_gade_suchigalu_by_id(record_id):
    try:
        result = gade_service.get_by_id(record_id)
        status_code = 200 if result.get("status") == "success" else 404
        return jsonify(result), status_code

    except Exception as e:
        logger.exception("Error fetching GadeSuchigalu by ID")
        return jsonify({"status": "error", "message": str(e)}), 500


# ================== POST /gade-suchigalu
@gadesuchi_api_routes.route("/", methods=["POST"])
def create_gade_suchigalu():
    try:
        data = request.get_json(silent=True)
        if data is None:
            return jsonify({"status": "error", "message": "JSON body required"}), 400

        data, error = _normalize_json_payload(data)
        if error:
            return jsonify({"status": "error", "message": error}), 400

        result = gade_service.create(**data)
        status_code = 201 if result.get("status") == "success" else 400
        return jsonify(result), status_code

    except Exception as e:
        logger.exception("Error creating GadeSuchigalu")
        return jsonify({"status": "error", "message": str(e)}), 500


# ================== PUT /gade-suchigalu/<id>
@gadesuchi_api_routes.route("/<int:record_id>", methods=["PUT"])
def update_gade_suchigalu(record_id):
    try:
        data = request.get_json(silent=True)
        if data is None:
            return jsonify({"status": "error", "message": "JSON body required"}), 400

        data, error = _normalize_json_payload(data)
        if error:
            return jsonify({"status": "error", "message": error}), 400

        result = gade_service.update(record_id, **data)
        status_code = 200 if result.get("status") == "success" else 400
        return jsonify(result), status_code

    except Exception as e:
        logger.exception("Error updating GadeSuchigalu")
        return jsonify({"status": "error", "message": str(e)}), 500


# ================== DELETE /gade-suchigalu/<id>
@gadesuchi_api_routes.route("/<int:record_id>", methods=["DELETE"])
def delete_gade_suchigalu(record_id):
    try:
        result = gade_service.delete(record_id)
        status_code = 200 if result.get("status") == "success" else 404
        return jsonify(result), status_code

    except Exception as e:
        logger.exception("Error deleting GadeSuchigalu")
        return jsonify({"status": "error", "message": str(e)}), 500


# ================== POST /gade-suchigalu/bulk-upload
@gadesuchi_api_routes.route("/bulk-upload", methods=["POST"])
def bulk_upload_gade_suchigalu():
    try:
        if "file" not in request.files:
            return jsonify({"status": "error", "message": "CSV file required"}), 400

        file = request.files["file"]
        if not file or not file.filename:
            return jsonify({"status": "error", "message": "CSV file required"}), 400

        if not file.filename.lower().endswith(".csv"):
            return jsonify({"status": "error", "message": "Only CSV files allowed"}), 400

        stream = io.StringIO(file.stream.read().decode("UTF-8-sig"))
        reader = csv.DictReader(stream)

        if not reader.fieldnames:
            return jsonify({"status": "error", "message": "CSV header row is missing"}), 400

        required_headers = {"gade_suchi", "description", "parva_number", "sandhi_number", "padya_number"}
        missing_headers = required_headers - set(reader.fieldnames)

        if missing_headers:
            return jsonify({
                "status": "error",
                "message": f"Missing CSV columns: {', '.join(sorted(missing_headers))}"
            }), 400

        results = []
        success_count = 0
        error_count = 0

        for row_number, row in enumerate(reader, start=2):
            try:
                payload = {
                    "gade_suchi": (row.get("gade_suchi") or "").strip() or None,
                    "description": (row.get("description") or "").strip() or None,
                    "parva_number": int((row.get("parva_number") or "").strip()) if (row.get("parva_number") or "").strip() else None,
                    "sandhi_number": int((row.get("sandhi_number") or "").strip()) if (row.get("sandhi_number") or "").strip() else None,
                    "padya_number": int((row.get("padya_number") or "").strip()) if (row.get("padya_number") or "").strip() else None,
                }

                if not any(value is not None for value in payload.values()):
                    continue

                if not payload["gade_suchi"]:
                    results.append({
                        "row": row_number,
                        "status": "error",
                        "message": "gade_suchi is required"
                    })
                    error_count += 1
                    continue

                result = gade_service.create(**payload)

                if result.get("status") == "success":
                    success_count += 1
                else:
                    error_count += 1

                results.append({
                    "row": row_number,
                    **result
                })

            except ValueError:
                results.append({
                    "row": row_number,
                    "status": "error",
                    "message": "parva_number, sandhi_number, padya_number must be integers"
                })
                error_count += 1

        overall_status = "success"
        http_status = 201

        if success_count > 0 and error_count > 0:
            overall_status = "partial_success"
            http_status = 200
        elif success_count == 0 and error_count > 0:
            overall_status = "error"
            http_status = 400

        return jsonify({
            "status": overall_status,
            "message": f"Bulk upload completed. Success: {success_count}, Errors: {error_count}",
            "success_count": success_count,
            "error_count": error_count,
            "results": results
        }), http_status

    except Exception as e:
        logger.exception("Error bulk uploading GadeSuchigalu")
        return jsonify({"status": "error", "message": str(e)}), 500