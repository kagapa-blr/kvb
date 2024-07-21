# from flask import Blueprint, request, jsonify
# from app import db
# from model.models import Parva, Sandhi, Padya
#
# # Create a Blueprint for the 'kavya' routes
# kavya = Blueprint('kavya', __name__)
#
#
# # --- Parva Routes ---
# @kavya.route('/parva', methods=['GET'])
# def get_parva():
#     parvas = Parva.query.all()
#     return jsonify([{'id': p.id, 'name': p.name} for p in parvas])
#
#
# @kavya.route('/parva/<int:id>', methods=['GET'])
# def get_parva_by_id(id):
#     parva = Parva.query.get(id)
#     if parva:
#         return jsonify({'id': parva.id, 'name': parva.name})
#     return jsonify({'error': 'Parva not found'}), 404
#
#
# @kavya.route('/parva', methods=['POST'])
# def create_parva():
#     data = request.json
#     new_parva = Parva(name=data['name'])
#     db.session.add(new_parva)
#     db.session.commit()
#     return jsonify({'id': new_parva.id, 'name': new_parva.name}), 201
#
#
# @kavya.route('/parva/<int:id>', methods=['PUT'])
# def update_parva(id):
#     data = request.json
#     parva = Parva.query.get(id)
#     if parva:
#         parva.name = data['name']
#         db.session.commit()
#         return jsonify({'id': parva.id, 'name': parva.name})
#     return jsonify({'error': 'Parva not found'}), 404
#
#
# @kavya.route('/parva/<int:id>', methods=['DELETE'])
# def delete_parva(id):
#     parva = Parva.query.get(id)
#     if parva:
#         db.session.delete(parva)
#         db.session.commit()
#         return jsonify({'message': 'Parva deleted'})
#     return jsonify({'error': 'Parva not found'}), 404
#
#
# # --- Sandhi Routes ---
# @kavya.route('/sandhi', methods=['GET'])
# def get_sandhi():
#     sandhis = Sandhi.query.all()
#     return jsonify([{'id': s.id, 'parva_id': s.parva_id, 'name': s.name} for s in sandhis])
#
#
# @kavya.route('/sandhi/<int:id>', methods=['GET'])
# def get_sandhi_by_id(id):
#     sandhi = Sandhi.query.get(id)
#     if sandhi:
#         return jsonify({'id': sandhi.id, 'parva_id': sandhi.parva_id, 'name': sandhi.name})
#     return jsonify({'error': 'Sandhi not found'}), 404
#
#
# @kavya.route('/sandhi', methods=['POST'])
# def create_sandhi():
#     data = request.json
#     new_sandhi = Sandhi(parva_id=data['parva_id'], name=data['name'])
#     db.session.add(new_sandhi)
#     db.session.commit()
#     return jsonify({'id': new_sandhi.id, 'parva_id': new_sandhi.parva_id, 'name': new_sandhi.name}), 201
#
#
# @kavya.route('/sandhi/<int:id>', methods=['PUT'])
# def update_sandhi(id):
#     data = request.json
#     sandhi = Sandhi.query.get(id)
#     if sandhi:
#         sandhi.parva_id = data['parva_id']
#         sandhi.name = data['name']
#         db.session.commit()
#         return jsonify({'id': sandhi.id, 'parva_id': sandhi.parva_id, 'name': sandhi.name})
#     return jsonify({'error': 'Sandhi not found'}), 404
#
#
# @kavya.route('/sandhi/<int:id>', methods=['DELETE'])
# def delete_sandhi(id):
#     sandhi = Sandhi.query.get(id)
#     if sandhi:
#         db.session.delete(sandhi)
#         db.session.commit()
#         return jsonify({'message': 'Sandhi deleted'})
#     return jsonify({'error': 'Sandhi not found'}), 404
#
#
# # --- Padya Routes ---
# @kavya.route('/padya', methods=['GET'])
# def get_padya():
#     padyas = Padya.query.all()
#     return jsonify([{
#         'id': p.id,
#         'sandhi_id': p.sandhi_id,
#         'name': p.name,
#         'padya_number': p.padya_number,
#         'pathantar': p.pathantar,
#         'gadya': p.gadya,
#         'tippani': p.tippani,
#         'artha': p.artha
#     } for p in padyas])
#
#
# @kavya.route('/padya/<int:id>', methods=['GET'])
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
#             'artha': padya.artha
#         })
#     return jsonify({'error': 'Padya not found'}), 404
#
#
# @kavya.route('/padya', methods=['POST'])
# def create_padya():
#     data = request.json
#     new_padya = Padya(
#         sandhi_id=data['sandhi_id'],
#         name=data['name'],
#         padya_number=data['padya_number'],
#         pathantar=data.get('pathantar'),
#         gadya=data.get('gadya'),
#         tippani=data.get('tippani'),
#         artha=data.get('artha')
#     )
#     db.session.add(new_padya)
#     db.session.commit()
#     return jsonify({
#         'id': new_padya.id,
#         'sandhi_id': new_padya.sandhi_id,
#         'name': new_padya.name,
#         'padya_number': new_padya.padya_number,
#         'pathantar': new_padya.pathantar,
#         'gadya': new_padya.gadya,
#         'tippani': new_padya.tippani,
#         'artha': new_padya.artha
#     }), 201
#
#
# @kavya.route('/padya/<int:id>', methods=['PUT'])
# def update_padya(id):
#     data = request.json
#     padya = Padya.query.get(id)
#     if padya:
#         padya.sandhi_id = data['sandhi_id']
#         padya.name = data['name']
#         padya.padya_number = data['padya_number']
#         padya.pathantar = data.get('pathantar')
#         padya.gadya = data.get('gadya')
#         padya.tippani = data.get('tippani')
#         padya.artha = data.get('artha')
#         db.session.commit()
#         return jsonify({
#             'id': padya.id,
#             'sandhi_id': padya.sandhi_id,
#             'name': padya.name,
#             'padya_number': padya.padya_number,
#             'pathantar': padya.pathantar,
#             'gadya': padya.gadya,
#             'tippani': padya.tippani,
#             'artha': padya.artha
#         })
#     return jsonify({'error': 'Padya not found'}), 404
#
#
# @kavya.route('/padya/<int:id>', methods=['DELETE'])
# def delete_padya(id):
#     padya = Padya.query.get(id)
#     if padya:
#         db.session.delete(padya)
#         db.session.commit()
#         return jsonify({'message': 'Padya deleted'})
#     return jsonify({'error': 'Padya not found'}), 404


from flask import Blueprint, request, jsonify
from app import db
from model.models import Parva, Sandhi, Padya
from sqlalchemy.exc import SQLAlchemyError

# Create a Blueprint for the 'kavya' routes
kavya = Blueprint('kavya', __name__)


def handle_sqlalchemy_error(e):
    return jsonify({'error': str(e)}), 500


def handle_invalid_data_error():
    return jsonify({'error': 'Invalid data provided'}), 400


def handle_not_found_error():
    return jsonify({'error': 'Resource not found'}), 404


def handle_exception(e):
    return jsonify({'error': 'An unexpected error occurred'}), 500


# --- Parva Routes ---
@kavya.route('/parva', methods=['GET'])
def get_parva():
    try:
        parvas = Parva.query.all()
        return jsonify([{'id': p.id, 'name': p.name} for p in parvas])
    except SQLAlchemyError as e:
        return handle_sqlalchemy_error(e)


@kavya.route('/parva/<int:id>', methods=['GET'])
def get_parva_by_id(id):
    try:
        parva = Parva.query.get(id)
        if parva:
            return jsonify({'id': parva.id, 'name': parva.name})
        return handle_not_found_error()
    except SQLAlchemyError as e:
        return handle_sqlalchemy_error(e)


@kavya.route('/parva', methods=['POST'])
def create_parva():
    try:
        data = request.json
        if not data or 'name' not in data:
            return handle_invalid_data_error()

        new_parva = Parva(name=data['name'])
        db.session.add(new_parva)
        db.session.commit()
        return jsonify({'id': new_parva.id, 'name': new_parva.name}), 201
    except SQLAlchemyError as e:
        return handle_sqlalchemy_error(e)


@kavya.route('/parva/<int:id>', methods=['PUT'])
def update_parva(id):
    try:
        data = request.json
        parva = Parva.query.get(id)
        if not parva:
            return handle_not_found_error()

        if 'name' in data:
            parva.name = data['name']
        else:
            return handle_invalid_data_error()

        db.session.commit()
        return jsonify({'id': parva.id, 'name': parva.name})
    except SQLAlchemyError as e:
        return handle_sqlalchemy_error(e)


@kavya.route('/parva/<int:id>', methods=['DELETE'])
def delete_parva(id):
    try:
        parva = Parva.query.get(id)
        if not parva:
            return handle_not_found_error()

        db.session.delete(parva)
        db.session.commit()
        return jsonify({'message': 'Parva deleted'})
    except SQLAlchemyError as e:
        return handle_sqlalchemy_error(e)


# --- Sandhi Routes ---
@kavya.route('/sandhi', methods=['GET'])
def get_sandhi():
    try:
        sandhis = Sandhi.query.all()
        return jsonify([{'id': s.id, 'parva_id': s.parva_id, 'name': s.name} for s in sandhis])
    except SQLAlchemyError as e:
        return handle_sqlalchemy_error(e)


@kavya.route('/sandhi/<int:id>', methods=['GET'])
def get_sandhi_by_id(id):
    try:
        sandhi = Sandhi.query.get(id)
        if sandhi:
            return jsonify({'id': sandhi.id, 'parva_id': sandhi.parva_id, 'name': sandhi.name})
        return handle_not_found_error()
    except SQLAlchemyError as e:
        return handle_sqlalchemy_error(e)


@kavya.route('/sandhi', methods=['POST'])
def create_sandhi():
    try:
        data = request.json
        if not data or 'parva_id' not in data or 'name' not in data:
            return handle_invalid_data_error()

        new_sandhi = Sandhi(parva_id=data['parva_id'], name=data['name'])
        db.session.add(new_sandhi)
        db.session.commit()
        return jsonify({'id': new_sandhi.id, 'parva_id': new_sandhi.parva_id, 'name': new_sandhi.name}), 201
    except SQLAlchemyError as e:
        return handle_sqlalchemy_error(e)


@kavya.route('/sandhi/<int:id>', methods=['PUT'])
def update_sandhi(id):
    try:
        data = request.json
        sandhi = Sandhi.query.get(id)
        if not sandhi:
            return handle_not_found_error()

        if 'parva_id' in data:
            sandhi.parva_id = data['parva_id']
        if 'name' in data:
            sandhi.name = data['name']
        else:
            return handle_invalid_data_error()

        db.session.commit()
        return jsonify({'id': sandhi.id, 'parva_id': sandhi.parva_id, 'name': sandhi.name})
    except SQLAlchemyError as e:
        return handle_sqlalchemy_error(e)


@kavya.route('/sandhi/<int:id>', methods=['DELETE'])
def delete_sandhi(id):
    try:
        sandhi = Sandhi.query.get(id)
        if not sandhi:
            return handle_not_found_error()

        db.session.delete(sandhi)
        db.session.commit()
        return jsonify({'message': 'Sandhi deleted'})
    except SQLAlchemyError as e:
        return handle_sqlalchemy_error(e)


# --- Padya Routes ---
@kavya.route('/padya', methods=['GET'])
def get_padya():
    try:
        padyas = Padya.query.all()
        return jsonify([{
            'id': p.id,
            'sandhi_id': p.sandhi_id,
            'name': p.name,
            'padya_number': p.padya_number,
            'pathantar': p.pathantar,
            'gadya': p.gadya,
            'tippani': p.tippani,
            'artha': p.artha
        } for p in padyas])
    except SQLAlchemyError as e:
        return handle_sqlalchemy_error(e)


@kavya.route('/padya/<int:id>', methods=['GET'])
def get_padya_by_id(id):
    try:
        padya = Padya.query.get(id)
        if padya:
            return jsonify({
                'id': padya.id,
                'sandhi_id': padya.sandhi_id,
                'name': padya.name,
                'padya_number': padya.padya_number,
                'pathantar': padya.pathantar,
                'gadya': padya.gadya,
                'tippani': padya.tippani,
                'artha': padya.artha
            })
        return handle_not_found_error()
    except SQLAlchemyError as e:
        return handle_sqlalchemy_error(e)


@kavya.route('/padya', methods=['POST'])
def create_padya():
    try:
        data = request.json
        if not data or 'sandhi_id' not in data or 'name' not in data or 'padya_number' not in data:
            return handle_invalid_data_error()

        new_padya = Padya(
            sandhi_id=data['sandhi_id'],
            name=data['name'],
            padya_number=data['padya_number'],
            pathantar=data.get('pathantar'),
            gadya=data.get('gadya'),
            tippani=data.get('tippani'),
            artha=data.get('artha')
        )
        db.session.add(new_padya)
        db.session.commit()
        return jsonify({
            'id': new_padya.id,
            'sandhi_id': new_padya.sandhi_id,
            'name': new_padya.name,
            'padya_number': new_padya.padya_number,
            'pathantar': new_padya.pathantar,
            'gadya': new_padya.gadya,
            'tippani': new_padya.tippani,
            'artha': new_padya.artha
        }), 201
    except SQLAlchemyError as e:
        return handle_sqlalchemy_error(e)


@kavya.route('/padya/<int:id>', methods=['PUT'])
def update_padya(id):
    try:
        data = request.json
        padya = Padya.query.get(id)
        if not padya:
            return handle_not_found_error()

        if 'sandhi_id' in data:
            padya.sandhi_id = data['sandhi_id']
        if 'name' in data:
            padya.name = data['name']
        if 'padya_number' in data:
            padya.padya_number = data['padya_number']
        if 'pathantar' in data:
            padya.pathantar = data.get('pathantar')
        if 'gadya' in data:
            padya.gadya = data.get('gadya')
        if 'tippani' in data:
            padya.tippani = data.get('tippani')
        if 'artha' in data:
            padya.artha = data.get('artha')
        else:
            return handle_invalid_data_error()

        db.session.commit()
        return jsonify({
            'id': padya.id,
            'sandhi_id': padya.sandhi_id,
            'name': padya.name,
            'padya_number': padya.padya_number,
            'pathantar': padya.pathantar,
            'gadya': padya.gadya,
            'tippani': padya.tippani,
            'artha': padya.artha
        })
    except SQLAlchemyError as e:
        return handle_sqlalchemy_error(e)


@kavya.route('/padya/<int:id>', methods=['DELETE'])
def delete_padya(id):
    try:
        padya = Padya.query.get(id)
        if not padya:
            return handle_not_found_error()

        db.session.delete(padya)
        db.session.commit()
        return jsonify({'message': 'Padya deleted'})
    except SQLAlchemyError as e:
        return handle_sqlalchemy_error(e)


# Register custom error handlers
@kavya.errorhandler(400)
def bad_request_error(error):
    return handle_invalid_data_error()


@kavya.errorhandler(404)
def not_found_error(error):
    return handle_not_found_error()


@kavya.errorhandler(500)
def internal_error(error):
    return handle_exception(error)

