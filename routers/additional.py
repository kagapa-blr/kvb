from flask import Blueprint, Response, render_template, jsonify

from model.models import db, Parva, Sandhi, Padya, AkaradiSuchi

additonal_bp = Blueprint('additional', __name__)


@additonal_bp.get('/akaradi-suchi/update')
def akaradi_suchi_update():
    try:
        # Query all Parva entries
        parvas = Parva.query.all()
        for parva in parvas:
            # For each Parva, get all Sandhis
            sandhis = Sandhi.query.filter_by(parva_id=parva.id).all()
            for sandhi in sandhis:
                # For each Sandhi, get all Padyas
                padyas = Padya.query.filter_by(sandhi_id=sandhi.id).all()
                for padya in padyas:
                    # Extract the first line from Padya
                    padyafirstline = padya.padya.split('\n')[0]
                    # Create or update the AkaradiSuchi entry
                    akaradi_suchi_entry = AkaradiSuchi.query.filter_by(
                        parva_id=parva.id,
                        sandhi_id=sandhi.id,
                        padya_number=padya.padya_number
                    ).first()
                    if akaradi_suchi_entry:
                        akaradi_suchi_entry.padyafirstline = padyafirstline
                    else:
                        akaradi_suchi_entry = AkaradiSuchi(
                            padyafirstline=padyafirstline,
                            parva_id=parva.id,
                            sandhi_id=sandhi.id,
                            padya_number=padya.padya_number
                        )

                    db.session.add(akaradi_suchi_entry)

        db.session.commit()
        return Response("Akaradi Suchi updated successfully", status=200)
    except Exception as e:
        db.session.rollback()
        return Response(f"An error occurred: {e}", status=500)


@additonal_bp.get("/akaradi-suchi")
def akaradi():
    return render_template('additional/akaradi-suchi.html')


@additonal_bp.get('/akaradi-suchi/data')
def akaradi_suchi_data():
    try:
        # Query all AkaradiSuchi entries
        akaradi_suchi_entries = AkaradiSuchi.query.all()
        # Convert the results to a list of dictionaries
        data = [
            {
                'padyafirstline': entry.padyafirstline,
                'parva_name': entry.parva.name,  # Fetch the name of the Parva
                'sandhi_name': entry.sandhi.name,  # Fetch the name of the Sandhi
                'padya_number': entry.padya_number,
                'parva_id': entry.parva.parva_number,  # Assuming you want the ID here
                'sandhi_id': entry.sandhi.sandhi_number,  # Assuming you want the ID here
            }
            for entry in akaradi_suchi_entries
        ]
        return jsonify(data)
    except Exception as e:
        return jsonify({'error': str(e)}), 500
