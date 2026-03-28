import logging

from flask import Blueprint, jsonify, request, abort

from model.models import db as get_db
from services.sandhi_service import SandhiService

logger = logging.getLogger(__name__)

sandhi_api = Blueprint("sandhi_api", __name__)
sandhi_service = SandhiService()


def get_db_session():
    """Modern session factory."""
    session = get_db().session
    try:
        yield session
    finally:
        session.close()


@sandhi_api.route('/sandhis', methods=['POST'])
def create_sandhi():
    """Create new sandhi with auto-assigned number."""
    data = request.get_json()

    if not data:
        return jsonify({"error": "JSON data required"}), 400

    parva_identifier = data.get('parva')
    sandhi_name = data.get('name')

    if not parva_identifier or not sandhi_name:
        return jsonify({"error": "Required fields: parva (name/number), name"}), 400

    logger.info(f"Creating sandhi '{sandhi_name}' for parva '{parva_identifier}'")

    with get_db().session.begin():
        sandhi, message = sandhi_service.create_sandhi(get_db().session, parva_identifier, sandhi_name)

        if sandhi:
            logger.info(f"Sandhi created: ID={sandhi.id}, Number={sandhi.sandhi_number}")
            return jsonify({
                "success": True,
                "message": message,
                "sandhi": {
                    "id": sandhi.id,
                    "name": sandhi.name,
                    "sandhi_number": sandhi.sandhi_number,
                    "parva_id": sandhi.parva_id
                }
            }), 201
        else:
            logger.warning(f"Sandhi creation failed: {message}")
            return jsonify({"error": message}), 400


@sandhi_api.route('/sandhis/bulk', methods=['POST'])
def create_sandhis_bulk():
    """Bulk create multiple sandhis."""
    data = request.get_json()

    parva_identifier = data.get('parva')
    sandhi_names = data.get('sandhis', [])

    if not parva_identifier or not sandhi_names:
        return jsonify({"error": "Required: parva and sandhis list"}), 400

    logger.info(f"Bulk creating {len(sandhi_names)} sandhis for parva '{parva_identifier}'")

    with get_db().session.begin():
        result = sandhi_service.create_sandhi_bulk(get_db().session, parva_identifier, sandhi_names)

        return jsonify({
            "success": result['success_count'] > 0,
            "summary": {
                "created": result['success_count'],
                "failed": result['failed_count'],
                "total": len(sandhi_names)
            },
            "created_sandhis": result['created_sandhis'],
            "errors": result['errors']
        }), 201 if result['success_count'] > 0 else 400


@sandhi_api.route('/sandhis/<int:sandhi_id>', methods=['GET'])
def get_sandhi(sandhi_id: int):
    """Get single sandhi by ID."""
    logger.debug(f"Fetching sandhi ID: {sandhi_id}")

    with get_db().session.begin():
        sandhi = sandhi_service.get_sandhi_by_id(get_db().session, sandhi_id)

        if not sandhi:
            abort(404, description="Sandhi not found")

        return jsonify({
            "success": True,
            "sandhi": {
                "id": sandhi.id,
                "name": sandhi.name,
                "sandhi_number": sandhi.sandhi_number,
                "parva": {
                    "id": sandhi.parva.id,
                    "name": sandhi.parva.name,
                    "parva_number": sandhi.parva.parva_number
                }
            }
        })


@sandhi_api.route('/sandhis', methods=['GET'])
def list_sandhis():
    """List all sandhis with pagination and filters."""
    parva_id = request.args.get('parva_id')
    limit = request.args.get('limit', type=int, default=20)
    offset = request.args.get('offset', type=int, default=0)
    search = request.args.get('search')

    logger.debug(f"Listing sandhis: parva_id={parva_id}, limit={limit}, search='{search}'")

    with get_db().session.begin():
        if search:
            sandhis = sandhi_service.search_sandhis(get_db().session, search, parva_id, limit)
        else:
            sandhis = sandhi_service.get_all_sandhis_by_parva(
                get_db().session, int(parva_id), limit, offset
            ) if parva_id else []

        total = len(sandhis)  # For simplicity, use full count in production

        return jsonify({
            "success": True,
            "sandhis": [{
                "id": s.id,
                "name": s.name,
                "sandhi_number": s.sandhi_number,
                "parva_name": s.parva.name if s.parva else None
            } for s in sandhis],
            "pagination": {
                "limit": limit,
                "offset": offset,
                "total": total,
                "has_more": len(sandhis) == limit
            }
        })


@sandhi_api.route('/parvas/<parva_identifier>/sandhis', methods=['GET'])
def list_sandhis_by_parva(parva_identifier: str):
    """List sandhis for specific parva by name/number."""
    logger.debug(f"Fetching sandhis for parva: {parva_identifier}")

    with get_db().session.begin():
        sequence = sandhi_service.get_current_sandhi_sequence(get_db().session, parva_identifier)

        if 'error' in sequence:
            abort(404, description=sequence['error'])

        sandhis = sandhi_service.get_all_sandhis_by_parva(
            get_db().session, sequence['parva_id']
        )

        return jsonify({
            "success": True,
            "parva_id": sequence['parva_id'],
            "sandhi_count": sequence['sandhi_count'],
            "next_sandhi_number": sequence['next_sandhi_number'],
            "sandhis": [{
                "id": s.id,
                "name": s.name,
                "sandhi_number": s.sandhi_number
            } for s in sandhis]
        })


@sandhi_api.route('/sandhis/<int:sandhi_id>', methods=['PUT'])
def update_sandhi(sandhi_id: int):
    """Update sandhi name."""
    data = request.get_json()
    new_name = data.get('name')

    if not new_name:
        return jsonify({"error": "name required"}), 400

    logger.info(f"Updating sandhi {sandhi_id} to name: {new_name}")

    with get_db().session.begin():
        # Get sandhi first
        sandhi = sandhi_service.get_sandhi_by_id(get_db().session, sandhi_id)
        if not sandhi:
            abort(404)

        # Update
        sandhi.name = new_name
        get_db().session.commit()
        get_db().session.refresh(sandhi)

        return jsonify({
            "success": True,
            "message": "Sandhi updated successfully",
            "sandhi": {
                "id": sandhi.id,
                "name": sandhi.name,
                "sandhi_number": sandhi.sandhi_number
            }
        })


@sandhi_api.route('/sandhis/<int:sandhi_id>', methods=['DELETE'])
def delete_sandhi(sandhi_id: int):
    """Delete sandhi (cascade deletes related data)."""
    logger.info(f"Deleting sandhi ID: {sandhi_id}")

    with get_db().session.begin():
        success, message = sandhi_service.delete_sandhi(get_db().session, sandhi_id)

        if success:
            return jsonify({"success": True, "message": message})
        else:
            if "not found" in message.lower():
                abort(404, description=message)
            return jsonify({"error": message}), 500


@sandhi_api.route('/parvas/<parva_identifier>/sequence', methods=['GET'])
def get_parva_sequence(parva_identifier: str):
    """Get current sandhi sequence info for parva."""
    logger.debug(f"Getting sequence for parva: {parva_identifier}")

    with get_db().session.begin():
        sequence = sandhi_service.get_current_sandhi_sequence(get_db().session, parva_identifier)

        if 'error' in sequence:
            abort(404, description=sequence['error'])

        return jsonify({
            "success": True,
            "sequence": sequence
        })
