from flask import Blueprint, request, jsonify

from model.models import *

parvya_bp = Blueprint('parvya', __name__)

# Parva API endpoints
@parvya_bp.route('/parva', methods=['GET'])
def get_parva():
    parvas = Parva.query.all()
    return jsonify([{'id': p.id, 'name': p.name} for p in parvas])

@parvya_bp.route('/parva/<int:id>', methods=['GET'])
def get_parva_by_id(id):
    parva = Parva.query.get(id)
    if parva:
        return jsonify({'id': parva.id, 'name': parva.name})
    return jsonify({'error': 'Parva not found'}), 404

@parvya_bp.route('/parva', methods=['POST'])
def create_parva():
    data = request.json
    new_parva = Parva(name=data['name'])
    db.session.add(new_parva)
    db.session.commit()
    return jsonify({'id': new_parva.id, 'name': new_parva.name}), 201

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
    new_sandhi = Sandhi(parva_id=data['parva_id'], name=data['name'])
    db.session.add(new_sandhi)
    db.session.commit()
    return jsonify({'id': new_sandhi.id, 'parva_id': new_sandhi.parva_id, 'name': new_sandhi.name}), 201

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
        'artha': p.artha
    } for p in padyas])

@parvya_bp.route('/padya/<int:id>', methods=['GET'])
def get_padya_by_id(id):
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
    return jsonify({'error': 'Padya not found'}), 404

@parvya_bp.route('/padya', methods=['POST'])
def create_padya():
    data = request.json
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

@parvya_bp.route('/padya/<int:id>', methods=['PUT'])
def update_padya(id):
    data = request.json
    padya = Padya.query.get(id)
    if padya:
        padya.sandhi_id = data['sandhi_id']
        padya.name = data['name']
        padya.padya_number = data['padya_number']
        padya.pathantar = data.get('pathantar')
        padya.gadya = data.get('gadya')
        padya.tippani = data.get('tippani')
        padya.artha = data.get('artha')
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
    return jsonify({'error': 'Padya not found'}), 404

@parvya_bp.route('/padya/<int:id>', methods=['DELETE'])
def delete_padya(id):
    padya = Padya.query.get(id)
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
        'name': p.name,
        'padya_number': p.padya_number
    } for p in padyas])
