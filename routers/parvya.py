import logging
from flask import Blueprint, request, jsonify
from services.parvya_service import ParvyaService

logger = logging.getLogger(__name__)
parvya_bp = Blueprint('parvya', __name__)
service = ParvyaService()


# Parva Routes
@parvya_bp.route('/parva', methods=['GET'])
def get_parva():
    try:
        result = service.get_all_parvas()
        return jsonify(result)
    except Exception as e:
        logger.error(f"Error in get_parva: {str(e)}")
        return jsonify({'error': str(e)}), 503


@parvya_bp.route('/parva/<int:id>', methods=['GET'])
def get_parva_by_id(id):
    result = service.get_parva_by_id(id)
    if isinstance(result, tuple):
        return jsonify(result[0]), result[1]
    return jsonify(result)


@parvya_bp.route('/get_parva_name/<int:sandhi_id>', methods=['GET'])
def get_parva_name_by_sandhi(sandhi_id):
    result = service.get_parva_name_by_sandhi(sandhi_id)
    if isinstance(result, tuple):
        return jsonify(result[0]), result[1]
    return jsonify(result)


@parvya_bp.route('/parva', methods=['POST'])
def create_parva():
    try:
        data = request.json
        result = service.create_parva(data)
        return jsonify(result[0]), result[1]
    except Exception as e:
        logger.error(f"Error in create_parva: {str(e)}")
        return jsonify({'error': str(e)}), 500


@parvya_bp.route('/parva/<int:id>', methods=['PUT'])
def update_parva(id):
    try:
        data = request.json
        result = service.update_parva(id, data)
        if isinstance(result, tuple):
            return jsonify(result[0]), result[1]
        return jsonify(result)
    except Exception as e:
        logger.error(f"Error in update_parva: {str(e)}")
        return jsonify({'error': str(e)}), 500


@parvya_bp.route('/delete/parva_number/<int:parva_number>', methods=['DELETE'])
def delete_parva_by_number(parva_number):
    result = service.delete_parva_by_number(parva_number)
    if isinstance(result, tuple):
        return jsonify(result[0]), result[1]
    return jsonify(result)


# Sandhi Routes
@parvya_bp.route('/sandhi', methods=['GET'])
def get_sandhi():
    try:
        result = service.get_all_sandhis()
        return jsonify(result)
    except Exception as e:
        logger.error(f"Error in get_sandhi: {str(e)}")
        return jsonify({'error': str(e)}), 503


@parvya_bp.route('/sandhi/<int:id>', methods=['GET'])
def get_sandhi_by_id(id):
    result = service.get_sandhi_by_id(id)
    if isinstance(result, tuple):
        return jsonify(result[0]), result[1]
    return jsonify(result)


@parvya_bp.route('/sandhi', methods=['POST'])
def create_sandhi():
    try:
        data = request.json
        result = service.create_sandhi(data)
        return jsonify(result[0]), result[1]
    except Exception as e:
        logger.error(f"Error in create_sandhi: {str(e)}")
        return jsonify({'error': str(e)}), 500


@parvya_bp.route('/sandhi/<int:id>', methods=['PUT'])
def update_sandhi(id):
    try:
        data = request.json
        result = service.update_sandhi(id, data)
        if isinstance(result, tuple):
            return jsonify(result[0]), result[1]
        return jsonify(result)
    except Exception as e:
        logger.error(f"Error in update_sandhi: {str(e)}")
        return jsonify({'error': str(e)}), 500


@parvya_bp.route('/sandhi/<int:parva_number>/<int:sandhi_number>', methods=['DELETE'])
def delete_sandhi(parva_number, sandhi_number):
    result = service.delete_sandhi(parva_number, sandhi_number)
    if isinstance(result, tuple):
        return jsonify(result[0]), result[1]
    return jsonify(result)


# Padya Routes
@parvya_bp.route('/padya', methods=['GET'])
def get_padya():
    result = service.get_all_padyas()
    return jsonify(result)


@parvya_bp.route('/padya/<int:sandhi_id>/<int:padya_number>', methods=['GET'])
def get_padya_by_sandhi_and_number(sandhi_id, padya_number):
    result = service.get_padya_by_sandhi_and_number(sandhi_id, padya_number)
    if isinstance(result, tuple):
        return jsonify(result[0]), result[1]
    return jsonify(result)


@parvya_bp.route('/padya', methods=['POST'])
def create_padya():
    try:
        data = request.json
        result = service.create_padya(data)
        return jsonify(result[0]), result[1]
    except Exception as e:
        logger.error(f"Error in create_padya: {str(e)}")
        return jsonify({'error': str(e)}), 500


@parvya_bp.route('/padya', methods=['PUT'])
def update_padya():
    try:
        data = request.json
        result = service.update_padya(data)
        if isinstance(result, tuple):
            return jsonify(result[0]), result[1]
        return jsonify(result)
    except Exception as e:
        logger.error(f"Error in update_padya: {str(e)}")
        return jsonify({'error': str(e)}), 500


@parvya_bp.route('/padya', methods=['PATCH'])
def update_padya_field():
    try:
        data = request.json
        result = service.update_padya_field(data)
        if isinstance(result, tuple):
            return jsonify(result[0]), result[1]
        return jsonify(result)
    except Exception as e:
        logger.error(f"Error in update_padya_field: {str(e)}")
        return jsonify({'error': str(e)}), 500


@parvya_bp.route('/padya/delete/<int:padya_number>/<int:sandhi_number>/<int:parva_number>', methods=['DELETE'])
def delete_padya(padya_number, sandhi_number, parva_number):
    result = service.delete_padya(padya_number, sandhi_number, parva_number)
    if isinstance(result, tuple):
        return jsonify(result[0]), result[1]
    return jsonify(result)


# Helper Routes
@parvya_bp.route('/sandhi/by_parva/<int:parva_id>', methods=['GET'])
def get_sandhi_by_parva(parva_id):
    result = service.get_sandhi_by_parva(parva_id)
    return jsonify(result)


@parvya_bp.route('/padya/by_sandhi/<int:sandhi_id>', methods=['GET'])
def get_padya_by_sandhi(sandhi_id):
    result = service.get_padya_by_sandhi(sandhi_id)
    return jsonify(result)


@parvya_bp.route('/sandhi/by_parva_sandhi/<int:parva_number>/<int:sandhi_number>', methods=['GET'])
def get_sandhi_by_parva_sandhi(parva_number, sandhi_number):
    result = service.get_sandhi_by_parva_sandhi(parva_number, sandhi_number)
    if isinstance(result, tuple):
        return jsonify(result[0]), result[1]
    return jsonify(result)


@parvya_bp.route('/padya/by_parva_sandhi_padya/<int:parva_number>/<int:sandhi_number>/<int:padya_number>',
                 methods=['GET'])
def get_padya_by_parva_sandhi_padya(parva_number, sandhi_number, padya_number):
    result = service.get_padya_by_parva_sandhi_padya(parva_number, sandhi_number, padya_number)
    if isinstance(result, tuple):
        return jsonify(result[0]), result[1]
    return jsonify(result)


@parvya_bp.route('/all_sandhi/by_parva/<int:parva_number>', methods=['GET'])
def get_all_sandhi_by_parva(parva_number):
    result = service.get_all_sandhi_by_parva(parva_number)
    if isinstance(result, tuple):
        return jsonify(result[0]), result[1]
    return jsonify(result)


# Stats Routes
@parvya_bp.route('/stats', methods=['GET'])
def statistics():
    result = service.get_statistics()
    if isinstance(result, tuple):
        return jsonify(result[0]), result[1]
    return jsonify(result)


@parvya_bp.route('/stats/search_word', methods=['POST'])
def search_padya_by_word():
    try:
        data = request.get_json()
        result = service.search_padya_by_word(data)
        if isinstance(result, tuple):
            return jsonify(result[0]), result[1]
        return jsonify(result)
    except Exception as e:
        logger.error(f"Error in search_padya_by_word: {str(e)}")
        return jsonify({'error': str(e)}), 500
