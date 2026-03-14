import logging

import sqlalchemy
from flask import Blueprint, request, jsonify
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy.orm import joinedload

from model.models import db, Parva, Sandhi, Padya

# Set up logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

parvya_bp = Blueprint('parvya', __name__)

# Lazy-load Statistics instance (don't initialize at import time)
_stats_instance = None


def get_stats():
    """
    Lazy-load the Statistics instance on first use.
    
    This avoids initialization issues at module import time.
    Statistics is only created when first needed.
    
    Returns:
        Statistics: Instance of Statistics class, or None if initialization fails
    """
    global _stats_instance
    
    if _stats_instance is None:
        try:
            logger.info("Initializing Statistics module (lazy-load)...")
            from utils.statistics import Statistics
            _stats_instance = Statistics()
            logger.info("✓ Statistics module initialized successfully")
        except Exception as e:
            logger.error(f"✗ Failed to initialize Statistics module: {str(e)}", exc_info=True)
            _stats_instance = None
    
    return _stats_instance


# Parva API endpoints
@parvya_bp.route('/parva', methods=['GET'])
def get_parva():
    try:
        parvas = Parva.query.all()
        return jsonify([{'id': p.id, 'name': p.name, 'parva_number': p.parva_number} for p in parvas])
    except Exception as e:
        print(f"unable connect database, please check database server, {str(e)}")
        return jsonify({'error': str(e)}), 503


@parvya_bp.route('/parva/<int:id>', methods=['GET'])
def get_parva_by_id(id):
    parva = Parva.query.get(id)
    if parva:
        return jsonify({'id': parva.id, 'name': parva.name, 'parva_number': parva.parva_number})
    return jsonify({'error': 'Parva not found'}), 404


@parvya_bp.route('/get_parva_name/<int:sandhi_id>', methods=['GET'])
def get_parva_name_by_sandhi(sandhi_id):
    sandhi = Sandhi.query.get(sandhi_id)
    if sandhi:
        parva_name = sandhi.parva.name
        return jsonify({'parva_name': parva_name})
    else:
        return jsonify({'error': 'Sandhi not found'}), 404


@parvya_bp.route('/parva', methods=['POST'])
def create_parva():
    data = request.json

    # Validate input
    if 'name' not in data or not data['name']:
        return jsonify({'error': 'Name is required'}), 400

    # Check for existing Parva with the same name
    if Parva.query.filter_by(name=data['name']).first():
        return jsonify({'error': 'Parva with this name already exists'}), 409

    try:
        # Get the next parva_number
        max_parva_number = db.session.query(db.func.max(Parva.parva_number)).scalar()
        next_parva_number = (max_parva_number or 0) + 1

        # Create and add the new Parva
        new_parva = Parva(name=data['name'], parva_number=next_parva_number)
        db.session.add(new_parva)
        db.session.commit()

        # Return the new Parva details
        return jsonify({
            'id': new_parva.id,
            'name': new_parva.name,
            'parva_number': new_parva.parva_number
        }), 201

    except Exception as e:
        # Rollback in case of error
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@parvya_bp.route('/parva/<int:id>', methods=['PUT'])
def update_parva(id):
    data = request.json
    parva = Parva.query.get(id)
    if parva:
        parva.name = data['name']
        parva.parva_number = data['parva_number']
        db.session.commit()
        return jsonify({'id': parva.id, 'name': parva.name, 'parva_number': parva.parva})
    return jsonify({'error': 'Parva not found'}), 404


@parvya_bp.route('/delete/parva_number/<int:parva_number>', methods=['DELETE'])
def delete_parva_by_number(parva_number):
    try:
        if parva_number is None:
            return jsonify({"error": "Parva number is required"}), 400

        # Query the Parva record by parva_number
        parva = Parva.query.filter_by(parva_number=parva_number).first()
        if not parva:
            return jsonify({"error": "Parva not found"}), 404

        # Delete the Parva record
        db.session.delete(parva)
        db.session.commit()

        return jsonify({"message": "Parva and associated Sandhi and Padya records deleted successfully"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


# Sandhi API endpoints
@parvya_bp.route('/sandhi', methods=['GET'])
def get_sandhi():
    try:
        # Query to join Sandhi with Parva and fetch required details
        sandhis = Sandhi.query.options(joinedload(Sandhi.parva)).all()

        # Prepare the response data
        response_data = [{
            'id': s.id,
            'parva_number': s.parva.parva_number,  # Access the parva_number from the joined Parva
            'name': s.name,
            'sandhi_number': s.sandhi_number
        } for s in sandhis]

        return jsonify(response_data)
    except Exception as e:
        print(f"Unable to connect to the database, please check the database server: {str(e)}")
        return jsonify({'error': str(e)}), 503


@parvya_bp.route('/sandhi/<int:id>', methods=['GET'])
def get_sandhi_by_id(id):
    try:
        sandhi = Sandhi.query.get(id)
        if sandhi:
            return jsonify({'id': sandhi.id, 'parva_id': sandhi.parva_id, 'name': sandhi.name})
        return jsonify({'error': 'Sandhi not found'}), 404
    except Exception as e:
        print(f"Unable connect database, please check database server, {str(e)}")
        return jsonify({'error': str(e)}), 503


@parvya_bp.route('/sandhi', methods=['POST'])
def create_sandhi():
    data = request.json

    # Validate input data
    if 'name' not in data or not data['name']:
        return jsonify({'error': 'Name is required'}), 400
    if 'parva_number' not in data or not data['parva_number']:
        return jsonify({'error': 'Parva Number is required'}), 400

    # Get parva_id from parva_number
    parva = Parva.query.filter_by(parva_number=data['parva_number']).first()
    if not parva:
        return jsonify({'error': 'Parva with the given number does not exist'}), 404

    parva_id = parva.id

    # Extract sandhi_number from the name
    sandhi_number_str = data['name'].replace("ಸಂಧಿ", "").strip()
    try:
        sandhi_number = int(sandhi_number_str)
    except ValueError:
        return jsonify({'error': 'Invalid sandhi number in name'}), 400

    # Check if Sandhi already exists for the given parva_id and sandhi_number
    if Sandhi.query.filter_by(parva_id=parva_id, sandhi_number=sandhi_number).first():
        return jsonify({'error': 'Sandhi with this number already exists in the given Parva'}), 409

    try:
        # Create and save the new Sandhi record
        new_sandhi = Sandhi(parva_id=parva_id, name=data['name'], sandhi_number=sandhi_number)
        db.session.add(new_sandhi)
        db.session.commit()
        return jsonify({'id': new_sandhi.id, 'parva_number': data['parva_number'], 'name': new_sandhi.name,
                        'sandhi_number': new_sandhi.sandhi_number}), 201
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


@parvya_bp.route('/sandhi/<int:parva_number>/<int:sandhi_number>', methods=['DELETE'])
def delete_sandhi(parva_number, sandhi_number):
    try:
        # Fetch the Parva record to get the parva_id
        parva = Parva.query.filter_by(parva_number=parva_number).first()
        if not parva:
            return jsonify({'error': 'Parva with the given number does not exist'}), 404

        # Fetch the Sandhi record using parva_id and sandhi_number
        sandhi = Sandhi.query.filter_by(parva_id=parva.id, sandhi_number=sandhi_number).first()
        if not sandhi:
            return jsonify({'error': 'Sandhi with the given number does not exist in the specified Parva'}), 404

        # Handle related Padya records if applicable
        # Set sandhi_id to NULL for related Padya records, if schema allows
        Padya.query.filter_by(sandhi_id=sandhi.id).update({'sandhi_id': None})
        db.session.commit()

        # Delete the Sandhi record
        db.session.delete(sandhi)
        db.session.commit()

        return jsonify({'message': 'Sandhi deleted successfully'})

    except sqlalchemy.exc.IntegrityError as e:
        db.session.rollback()
        return jsonify(
            {'error': 'Cannot delete this Sandhi as related Padya records are present', 'details': str(e)}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'An unexpected error occurred', 'details': str(e)}), 500


# Padya API endpoints
@parvya_bp.route('/padya', methods=['GET'])
def get_padya():
    padyas = Padya.query.all()
    return jsonify([{
        'id': p.id,
        'sandhi_id': p.sandhi_id,
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
        required_fields = ['parva_number', 'sandhi_number', 'padya_number']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400

        # Get the sandhi_id from parva_number and sandhi_number
        sandhi = Sandhi.query.join(Parva).filter(
            Parva.parva_number == data['parva_number'],
            Sandhi.sandhi_number == data['sandhi_number']
        ).first()

        if not sandhi:
            return jsonify({'error': 'Sandhi not found for the given Parva number and Sandhi number'}), 404

        # Check for existing padya with the same sandhi_id and padya_number
        existing_padya = Padya.query.filter_by(
            sandhi_id=sandhi.id,
            padya_number=data['padya_number']
        ).first()

        if existing_padya:
            return jsonify({'error': 'Padya number already exists for this Sandhi'}), 400

        new_padya = Padya(
            sandhi_id=sandhi.id,
            padya_number=data['padya_number'],
            pathantar=data.get('pathantar'),
            gadya=data.get('gadya'),
            tippani=data.get('tippani'),
            artha=data.get('artha'),
            padya=data.get('padya')
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
            'padya': new_padya.padya
        }), 201

    except IntegrityError as e:
        db.session.rollback()
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
    parva_number = data.get('parva_number')
    sandhi_number = data.get('sandhi_number')
    padya_number = data.get('padya_number')

    if not all([parva_number, sandhi_number]):
        return jsonify({'error': 'parva_number, sandhi_number, and padya_number are required'}), 400

    # Get the sandhi_id from parva_number and sandhi_number
    sandhi = Sandhi.query.join(Parva).filter(
        Parva.parva_number == parva_number,
        Sandhi.sandhi_number == sandhi_number
    ).first()

    if not sandhi:
        return jsonify({'error': 'Sandhi not found for the given Parva number and Sandhi number'}), 404

    # Find the Padya record by both sandhi_id and padya_number
    padya = Padya.query.filter_by(sandhi_id=sandhi.id, padya_number=padya_number).first()

    if padya:
        # Update fields if present in the request, otherwise keep existing values
        padya.pathantar = data.get('pathantar', padya.pathantar)
        padya.gadya = data.get('gadya', padya.gadya)
        padya.tippani = data.get('tippani', padya.tippani)
        padya.artha = data.get('artha', padya.artha)
        padya.padya = data.get('padya', padya.padya)

        db.session.commit()

        return jsonify({
            'id': padya.id,
            'sandhi_id': padya.sandhi_id,
            'padya_number': padya.padya_number,
            'pathantar': padya.pathantar,
            'gadya': padya.gadya,
            'tippani': padya.tippani,
            'artha': padya.artha,
            'padya': padya.padya
        })

    return jsonify({'error': 'Padya not found'}), 404


@parvya_bp.route('/padya', methods=['PATCH'])
def update_padya_field():
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


@parvya_bp.route('/padya/delete/<int:padya_number>/<int:sandhi_number>/<int:parva_number>', methods=['DELETE'])
def delete_padya(padya_number, sandhi_number, parva_number):
    # Find the Padya record by padya_number, sandhi_number, and parva_number
    padya = db.session.query(Padya).join(Sandhi).join(Parva).filter(
        Padya.padya_number == padya_number,
        Sandhi.sandhi_number == sandhi_number,
        Parva.parva_number == parva_number
    ).first()

    if padya:
        try:
            db.session.delete(padya)
            db.session.commit()
            return jsonify({'message': 'Padya deleted'})
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': 'An error occurred while deleting the Padya', 'details': str(e)}), 500

    return jsonify({'error': 'Padya not found'}), 404


@parvya_bp.route('/sandhi/by_parva/<int:parva_id>', methods=['GET'])
def get_sandhi_by_parva(parva_id):
    sandhis = Sandhi.query.filter_by(parva_id=parva_id).all()
    return jsonify([{'id': s.id, 'name': s.name, 'sandhi_number': s.sandhi_number} for s in sandhis])


@parvya_bp.route('/padya/by_sandhi/<int:sandhi_id>', methods=['GET'])
def get_padya_by_sandhi(sandhi_id):
    padyas = Padya.query.filter_by(sandhi_id=sandhi_id).all()
    return jsonify([{
        'id': p.id,
        'padya_number': p.padya_number
    } for p in padyas])


@parvya_bp.route('/sandhi/by_parva_sandhi/<int:parva_number>/<int:sandhi_number>', methods=['GET'])
def get_sandhi_by_parva_sandhi(parva_number, sandhi_number):
    sandhi = db.session.query(Sandhi).join(Parva).filter(
        Parva.parva_number == parva_number,
        Sandhi.sandhi_number == sandhi_number,
        Sandhi.parva_id == Parva.id
    ).first()

    if sandhi:
        return jsonify({
            'id': sandhi.id,
            'name': sandhi.name,
            'sandhi_number': sandhi.sandhi_number,
            'parva_id': sandhi.parva_id
        })
    else:
        return jsonify({'message': 'Sandhi not found'}), 404


@parvya_bp.route('/padya/by_parva_sandhi_padya/<int:parva_number>/<int:sandhi_number>/<int:padya_number>',
                 methods=['GET'])
def get_padya_by_parva_sandhi_padya(parva_number, sandhi_number, padya_number):
    padya = db.session.query(Padya).join(Sandhi).join(Parva).filter(
        Parva.parva_number == parva_number,
        Sandhi.sandhi_number == sandhi_number,
        Padya.padya_number == padya_number,
        Padya.sandhi_id == Sandhi.id,
        Sandhi.parva_id == Parva.id
    ).first()

    if padya:
        return jsonify({
            'id': padya.id,
            'padya_number': padya.padya_number,
            'sandhi_id': padya.sandhi_id,
            'parva_id': padya.sandhi.parva_id,
            'pathantar': padya.pathantar,
            'gadya': padya.gadya,
            'tippani': padya.tippani,
            'artha': padya.artha,
            'suchane': padya.suchane,
            'padya': padya.padya
        })
    else:
        return jsonify({'message': 'Padya not found'}), 404


@parvya_bp.route('/all_sandhi/by_parva/<int:parva_number>', methods=['GET'])
def get_all_sandhi_by_parva(parva_number):
    try:
        # Query to check if the given parva_number exists
        parva = db.session.query(Parva).filter_by(parva_number=parva_number).first()
        if not parva:
            # Return 404 if the parva_number does not exist
            return jsonify({'message': 'Parva not found'}), 404

        # Query to get all sandhi records for the given parva number
        sandhis = db.session.query(Sandhi).filter_by(parva_id=parva.id).all()

        # If no sandhis found, return 404
        if not sandhis:
            return jsonify({'message': 'No Sandhi records found for the given Parva'}), 404

        # Format the data as a list of dictionaries
        sandhi_list = []
        for sandhi in sandhis:
            # Query to get all padya records for the current sandhi
            padyas = db.session.query(Padya).filter_by(sandhi_id=sandhi.id).all()

            # Create a sorted list of padya numbers for the current sandhi
            padya_numbers = sorted([padya.padya_number for padya in padyas])

            sandhi_list.append({
                'id': sandhi.id,
                'name': sandhi.name,
                'sandhi_number': sandhi.sandhi_number,
                'parva_id': sandhi.parva_id,
                'padya_numbers': padya_numbers  # Include padya_numbers in the response
            })

        return jsonify(sandhi_list), 200

    except Exception as e:
        # Log the exception (you can use a logging library)
        print(f"Error fetching sandhi records: {e}")

        # Return a generic error message with a 500 status code
        return jsonify({'message': 'Internal server error. Please try again later.'}), 500


################################################################
@parvya_bp.route('/stats', methods=['GET'])
def statistics():
    """
    Get dashboard statistics.
    
    This endpoint returns various statistics about the database:
    - Total counts of parva, sandhi, padya, users
    - Breakdown of sandhi per parva
    - Breakdown of padya per sandhi and parva
    """
    try:
        stats = get_stats()
        
        if stats is None:
            logger.error("Statistics module failed to initialize - returning empty stats")
            return jsonify({
                'error': 'Statistics module not available',
                'message': 'Database configuration error. Check server logs for details.',
                'total_parva': 0,
                'total_sandhi': 0,
                'total_padya': 0,
                'total_users': 0
            }), 500
        
        # Fetch statistics
        logger.debug("Fetching statistics...")
        data = stats.fetch_statistics()
        logger.info(f"✓ Statistics fetched successfully")
        return jsonify(data)
        
    except Exception as e:
        logger.error(f"Error fetching statistics: {str(e)}", exc_info=True)
        return jsonify({
            'error': 'Unable to fetch statistics',
            'details': str(e),
            'total_parva': 0,
            'total_sandhi': 0,
            'total_padya': 0,
            'total_users': 0
        }), 500


@parvya_bp.route('/stats/search_word', methods=['POST'])
def search_padya_by_word():
    """
    Search for padyas by word.
    
    POST request with JSON body:
    {
        "search_word": "search term"
    }
    
    Returns matching padyas with parva and sandhi information.
    """
    try:
        request_data = request.get_json()
        search_word = request_data.get('search_word', '').strip()

        if not search_word:
            return jsonify({'error': 'No search word provided'}), 400

        stats = get_stats()
        
        if stats is None:
            logger.error("Statistics module not available for search")
            return jsonify({
                'error': 'Search module not available',
                'message': 'Database configuration error. Check server logs.'
            }), 500

        logger.debug(f"Searching for word: {search_word}")
        data = stats.search_padya_by_word(search_word)
        logger.info(f"✓ Found {len(data)} matching padyas for: {search_word}")

        # Enrich results with parva and sandhi information
        for padya in data:
            sandhi = Sandhi.query.get(padya['sandhi_id'])
            if sandhi:
                parva_name = sandhi.parva.name
                padya['parva_name'] = parva_name
                padya['sandhi_number'] = sandhi.sandhi_number

        return jsonify(data)
        
    except Exception as e:
        logger.error(f"Error searching padyas: {str(e)}", exc_info=True)
        return jsonify({
            'error': 'Search failed',
            'details': str(e)
        }), 500
