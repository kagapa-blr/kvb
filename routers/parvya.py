import logging

from flask import Blueprint, request, jsonify
from sqlalchemy.exc import IntegrityError, SQLAlchemyError

from model.models import db, Parva, Sandhi, Padya

parvya_bp = Blueprint('parvya', __name__)


# Parva API endpoints
@parvya_bp.route('/parva', methods=['GET'])
def get_parva():
    try:
        parvas = Parva.query.all()
        return jsonify([{'id': p.id, 'name': p.name} for p in parvas])
    except Exception as e:
        print(f"unable connect database, please check database server, {str(e)}")
        return jsonify({'error': str(e)}), 503


@parvya_bp.route('/parva/<int:id>', methods=['GET'])
def get_parva_by_id(id):
    parva = Parva.query.get(id)
    if parva:
        return jsonify({'id': parva.id, 'name': parva.name})
    return jsonify({'error': 'Parva not found'}), 404


@parvya_bp.route('/parva', methods=['POST'])
def create_parva():
    data = request.json
    if 'name' not in data or not data['name']:
        return jsonify({'error': 'Name is required'}), 400

    if Parva.query.filter_by(name=data['name']).first():
        return jsonify({'error': 'Parva with this name already exists'}), 409

    try:
        new_parva = Parva(name=data['name'])
        db.session.add(new_parva)
        db.session.commit()
        return jsonify({'id': new_parva.id, 'name': new_parva.name}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500



@parvya_bp.route('/parva/<int:id>', methods=['PUT'])
def update_parva(id):
    data = request.json
    parva = Parva.query.get(id)
    if parva:
        parva.name = data['name']
        db.session.commit()
        return jsonify({'id': parva.id, 'name': parva.name})
    return jsonify({'error': 'Parva not found'}), 404


@parvya_bp.route('/parva/<int:id>', methods=['DELETE'])
def delete_parva(id):
    parva = Parva.query.get(id)
    if parva:
        db.session.delete(parva)
        db.session.commit()
        return jsonify({'message': 'Parva deleted'})
    return jsonify({'error': 'Parva not found'}), 404


# Sandhi API endpoints
@parvya_bp.route('/sandhi', methods=['GET'])
def get_sandhi():
    sandhis = Sandhi.query.all()
    return jsonify([{'id': s.id, 'parva_id': s.parva_id, 'name': s.name} for s in sandhis])


@parvya_bp.route('/sandhi/<int:id>', methods=['GET'])
def get_sandhi_by_id(id):
    sandhi = Sandhi.query.get(id)
    if sandhi:
        return jsonify({'id': sandhi.id, 'parva_id': sandhi.parva_id, 'name': sandhi.name})
    return jsonify({'error': 'Sandhi not found'}), 404


@parvya_bp.route('/sandhi', methods=['POST'])
def create_sandhi():
    data = request.json
    if 'name' not in data or not data['name']:
        return jsonify({'error': 'Name is required'}), 400
    if 'parva_id' not in data or not data['parva_id']:
        return jsonify({'error': 'Parva ID is required'}), 400

    if Sandhi.query.filter_by(parva_id=data['parva_id'], name=data['name']).first():
        return jsonify({'error': 'Sandhi with this name already exists in the given Parva'}), 409

    try:
        new_sandhi = Sandhi(parva_id=data['parva_id'], name=data['name'])
        db.session.add(new_sandhi)
        db.session.commit()
        return jsonify({'id': new_sandhi.id, 'parva_id': new_sandhi.parva_id, 'name': new_sandhi.name}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500



@parvya_bp.route('/sandhi/<int:id>', methods=['PUT'])
def update_sandhi(id):
    data = request.json
    sandhi = Sandhi.query.get(id)
    if sandhi:
        sandhi.parva_id = data['parva_id']
        sandhi.name = data['name']
        db.session.commit()
        return jsonify({'id': sandhi.id, 'parva_id': sandhi.parva_id, 'name': sandhi.name})
    return jsonify({'error': 'Sandhi not found'}), 404


@parvya_bp.route('/sandhi/<int:id>', methods=['DELETE'])
def delete_sandhi(id):
    sandhi = Sandhi.query.get(id)
    if sandhi:
        db.session.delete(sandhi)
        db.session.commit()
        return jsonify({'message': 'Sandhi deleted'})
    return jsonify({'error': 'Sandhi not found'}), 404


# Padya API endpoints
@parvya_bp.route('/padya', methods=['GET'])
def get_padya():
    padyas = Padya.query.all()
    return jsonify([{
        'id': p.id,
        'sandhi_id': p.sandhi_id,
        'name': p.name,
        'padya_number': p.padya_number,
        'pathantar': p.pathantar,
        'gadya': p.gadya,
        'tippani': p.tippani,
        'artha': p.artha,
        'padya': p.padya  # Include the new column
    } for p in padyas])


# @parvya_bp.route('/padya/<int:id>', methods=['GET'])
# def get_padya_by_id(id):
#     padya = Padya.query.get(id)
#     if padya:
#         return jsonify({
#             'id': padya.id,
#             'sandhi_id': padya.sandhi_id,
#             'name': padya.name,
#             'padya_number': padya.padya_number,
#             'pathantar': padya.pathantar,
#             'gadya': padya.gadya,
#             'tippani': padya.tippani,
#             'artha': padya.artha,
#             'padya': padya.padya  # Include the new column
#         })
#     return jsonify({'error': 'Padya not found'}), 404

# @parvya_bp.route('/padya/<int:padya_number>', methods=['GET'])
# def get_padya_by_number(padya_number):
#     try:
#         logging.info(f"Fetching Padya with padya_number: {padya_number}")
#         padya = Padya.query.filter_by(padya_number=padya_number).first()
#         if padya:
#             return jsonify({
#                 'id': padya.id,
#                 'sandhi_id': padya.sandhi_id,
#                 'padya_number': padya.padya_number,
#                 'pathantar': padya.pathantar,
#                 'gadya': padya.gadya,
#                 'tippani': padya.tippani,
#                 'artha': padya.artha,
#                 'padya': padya.padya  # Include the new column
#             })
#         logging.info(f"Padya with padya_number {padya_number} not found.")
#         return jsonify({'error': 'Padya not found'}), 404
#     except Exception as e:
#         logging.error(f"Error occurred while fetching Padya: {str(e)}")
#         return jsonify({'error': 'An unexpected error occurred', 'details': str(e)}), 500
@parvya_bp.route('/padya/<int:sandhi_id>/<int:padya_number>', methods=['GET'])
def get_padya_by_sandhi_and_number(sandhi_id, padya_number):
    try:
        logging.info(f"Fetching Padya with sandhi_id: {sandhi_id} and padya_number: {padya_number}")
        padya = Padya.query.filter_by(sandhi_id=sandhi_id, padya_number=padya_number).first()
        if padya:
            return jsonify({
                'id': padya.id,
                'sandhi_id': padya.sandhi_id,
                'padya_number': padya.padya_number,
                'pathantar': padya.pathantar,
                'gadya': padya.gadya,
                'tippani': padya.tippani,
                'artha': padya.artha,
                'padya': padya.padya  # Include the new column
            })
        logging.info(f"Padya with sandhi_id {sandhi_id} and padya_number {padya_number} not found.")
        return jsonify({'error': 'Padya not found'}), 404
    except Exception as e:
        logging.error(f"Error occurred while fetching Padya: {str(e)}")
        return jsonify({'error': 'An unexpected error occurred', 'details': str(e)}), 500

@parvya_bp.route('/padya', methods=['POST'])
def create_padya():
    try:
        data = request.json
        # Validate required fields
        required_fields = ['sandhi_id', 'padya_number']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400

        # Check for existing padya with the same sandhi_id and padya_number
        existing_padya_number = Padya.query.filter_by(sandhi_id=data['sandhi_id'], padya_number=data['padya_number']).first()
        if existing_padya_number:
            return jsonify({'error': 'Padya number already exists for this Sandhi'}), 400

        new_padya = Padya(
            sandhi_id=data['sandhi_id'],
            padya_number=data['padya_number'],
            pathantar=data.get('pathantar'),
            gadya=data.get('gadya'),
            tippani=data.get('tippani'),
            artha=data.get('artha'),
            padya=data.get('padya')  # Include the new column
        )

        db.session.add(new_padya)
        db.session.commit()

        return jsonify({
            'id': new_padya.id,
            'sandhi_id': new_padya.sandhi_id,
            'padya_number': new_padya.padya_number,
            'pathantar': new_padya.pathantar,
            'gadya': new_padya.gadya,
            'tippani': new_padya.tippani,
            'artha': new_padya.artha,
            'padya': new_padya.padya  # Include the new column
        }), 201

    except IntegrityError as e:
        db.session.rollback()
        # Handle specific unique constraint violations here if needed
        return jsonify({'error': 'Database error', 'details': str(e)}), 500
    except KeyError as e:
        return jsonify({'error': f'Missing required field: {str(e)}'}), 400
    except SQLAlchemyError as e:
        db.session.rollback()
        return jsonify({'error': 'Database error', 'details': str(e)}), 500
    except Exception as e:
        return jsonify({'error': 'An unexpected error occurred', 'details': str(e)}), 500


@parvya_bp.route('/padya', methods=['PUT'])
def update_padya():
    data = request.json
    sandhi_id = data.get('sandhi_id')
    padya_number = data.get('padya_number')

    # Find the Padya record by both sandhi_id and padya_number
    padya = Padya.query.filter_by(sandhi_id=sandhi_id, padya_number=padya_number).first()

    if padya:
        padya.sandhi_id = sandhi_id
        padya.name = data.get('name', padya.name)
        padya.padya_number = padya_number
        padya.pathantar = data.get('pathantar', padya.pathantar)
        padya.gadya = data.get('gadya', padya.gadya)
        padya.tippani = data.get('tippani', padya.tippani)
        padya.artha = data.get('artha', padya.artha)
        padya.padya = data.get('padya', padya.padya)  # Include the new column

        db.session.commit()

        return jsonify({
            'id': padya.id,
            'sandhi_id': padya.sandhi_id,
            'name': padya.name,
            'padya_number': padya.padya_number,
            'pathantar': padya.pathantar,
            'gadya': padya.gadya,
            'tippani': padya.tippani,
            'artha': padya.artha,
            'padya': padya.padya  # Include the new column
        })

    return jsonify({'error': 'Padya not found'}), 404


@parvya_bp.route('/padya', methods=['DELETE'])
def delete_padya():
    data = request.json
    sandhi_id = data.get('sandhi_id')
    padya_number = data.get('padya_number')

    # Find the Padya record by both sandhi_id and padya_number
    padya = Padya.query.filter_by(sandhi_id=sandhi_id, padya_number=padya_number).first()

    if padya:
        db.session.delete(padya)
        db.session.commit()
        return jsonify({'message': 'Padya deleted'})

    return jsonify({'error': 'Padya not found'}), 404


@parvya_bp.route('/sandhi/by_parva/<int:parva_id>', methods=['GET'])
def get_sandhi_by_parva(parva_id):
    sandhis = Sandhi.query.filter_by(parva_id=parva_id).all()
    return jsonify([{'id': s.id, 'name': s.name} for s in sandhis])


@parvya_bp.route('/padya/by_sandhi/<int:sandhi_id>', methods=['GET'])
def get_padya_by_sandhi(sandhi_id):
    padyas = Padya.query.filter_by(sandhi_id=sandhi_id).all()
    return jsonify([{
        'id': p.id,
        'padya_number': p.padya_number
    } for p in padyas])
