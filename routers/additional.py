import csv
import os

from docx import Document
from flask import Blueprint, request, redirect, flash, render_template, jsonify
from werkzeug.utils import secure_filename

from model.models import db, Parva, Sandhi, Padya, AkaradiSuchi, GadeSuchigalu, Tippani, User
from utils.additonal_utility import allowed_file, UPLOAD_FOLDER, extract_and_save_data

additonal_bp = Blueprint('additional', __name__)


# -----------------------------------------------
# ADMIN DASHBOARD STATISTICS ENDPOINT
# -----------------------------------------------
@additonal_bp.route('/api/dashboard/stats', methods=['GET'])
def get_dashboard_stats():
    """
    Get dashboard statistics for admin panel.
    
    Returns:
        - total_users: Count of all admin users
        - total_padyas: Count of all padyas in database
        - total_parvas: Count of all parvas
        - total_sandhis: Count of all sandhis
        - total_gamaka_vachana: Count of all gamaka vachana entries
    """
    try:
        total_users = User.query.count()
        total_padyas = Padya.query.count()
        total_parvas = Parva.query.count()
        total_sandhis = Sandhi.query.count()
        total_gamaka_vachana = db.session.query(db.func.count(db.func.distinct(
            db.Concatenate(Parva.id, Sandhi.id)
        ))).join(Sandhi).scalar()
        
        return jsonify({
            'total_users': total_users,
            'total_padyas': total_padyas,
            'total_parvas': total_parvas,
            'total_sandhis': total_sandhis,
            'total_gamaka_vachana': total_gamaka_vachana or 0,
            'status': 'success'
        }), 200
    except Exception as e:
        return jsonify({
            'error': str(e),
            'status': 'error'
        }), 500


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
        # return Response("Akaradi Suchi updated successfully", status=200)
        akaradi_message = "Akaradi Suchi updated successfully"
    except Exception as e:
        db.session.rollback()
        # return Response(f"An error occurred: {e}", status=500)
        akaradi_message = f"An error occurred: {str(e)}"
    return render_template('admin.html', akaradi_message=akaradi_message)


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
                'parva_number': entry.parva.parva_number,  # Assuming you want the ID here
                'sandhi_number': entry.sandhi.sandhi_number,  # Assuming you want the ID here
            }
            for entry in akaradi_suchi_entries
        ]
        return jsonify(data)
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@additonal_bp.get('/lekhana-suchi')
def lekhana_suchi():
    return render_template('additional/lekhan-suchi.html')


@additonal_bp.get('/gadegal-suchi')
def gadegala_suchi():
    return render_template('additional/gadegala-suchi.html')


@additonal_bp.get('/artha-kosha')
def artha_kosha():
    return render_template('additional/artha-kosha.html')


@additonal_bp.get('/anuband-info')
def anuband():
    return render_template('additional/anuband.html')


@additonal_bp.get('/tippani-info')
def tippani():
    return render_template('additional/tippani.html')


@additonal_bp.get('/gade-suchi')
def gade_suchi():
    def extract_and_save_data(file_path, file_type):
        """
        Extract data from the DOCX or CSV file and save it to the GadeSuchigalu table.

        Parameters:
        file_path (str): The path to the DOCX or CSV file.
        file_type (str): The type of file ('docx' or 'csv').
        """
        data = []

        if file_type == 'docx':
            # Handle DOCX file
            document = Document(file_path)
            table = document.tables[0]  # Assuming the first table contains the relevant data

            for row in table.rows[1:]:  # Skip header row
                cells = row.cells
                gade_suchi = cells[0].text.strip()
                parva_name = cells[1].text.strip()
                sandhi_number = cells[2].text.strip()  # Convert to integer
                padya_number = cells[3].text.strip()  # Convert to integer
                if padya_number == '' or sandhi_number == '':
                    continue

                # Handle potential commas in numbers
                try:
                    sandhi_number = int(sandhi_number.replace(',', ''))
                    padya_number = int(padya_number.replace(',', ''))
                except ValueError:
                    print(f"Error converting numbers: sandhi_number='{sandhi_number}', padya_number='{padya_number}'")
                    continue

                parva_number = 123  # Default value if no match found
                # Fetch parva_number from the Parva table based on parva_name
                parva = Parva.query.filter_by(name=parva_name).first()
                if parva is not None:
                    parva_number = parva.parva_number

                data.append((gade_suchi, parva_name, parva_number, sandhi_number, padya_number))

        elif file_type == 'csv':
            # Handle CSV file
            with open(file_path, newline='', encoding='utf-8') as csvfile:
                reader = csv.reader(csvfile)
                next(reader)  # Skip header row

                for row in reader:
                    gade_suchi = row[0].strip()
                    parva_name = row[1].strip()
                    sandhi_number = row[2].strip()
                    padya_number = row[3].strip()

                    if padya_number == '' or sandhi_number == '':
                        continue

                    # Handle potential commas in numbers
                    try:
                        sandhi_number = int(sandhi_number.replace(',', ''))
                        padya_number = int(padya_number.replace(',', ''))
                    except ValueError:
                        print(
                            f"Error converting numbers: sandhi_number='{sandhi_number}', padya_number='{padya_number}'")
                        continue

                    parva_number = 123  # Default value if no match found
                    # Fetch parva_number from the Parva table based on parva_name
                    parva = Parva.query.filter_by(name=parva_name).first()
                    if parva is not None:
                        parva_number = parva.parva_number

                    data.append((gade_suchi, parva_name, parva_number, sandhi_number, padya_number))

        # Process and save data to the database
        for gade_suchi, parva_name, parva_number, sandhi_number, padya_number in data:
            # Create and save GadeSuchigalu entry
            gade_suchigalu_entry = GadeSuchigalu(
                gade_suchi=gade_suchi,
                parva_name=parva_name,  # Store the parva_name directly
                sandhi_number=sandhi_number,
                padya_number=padya_number,
                parva_number=parva_number
            )
            db.session.add(gade_suchigalu_entry)

        db.session.commit()
        print("Data successfully extracted and saved to the database.")
        return "Data successfully extracted and saved to the database."

    extract_and_save_data('docs/gaade_suchi.docx')


@additonal_bp.route('/gade-suchi/upload', methods=['GET', 'POST'])
def gade_suchi_upload():
    if request.method == 'POST':
        if 'file' not in request.files:
            flash('No file part')
            return redirect(request.url)

        file = request.files['file']

        if file.filename == '':
            flash('No selected file')
            return redirect(request.url)

        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            file_path = os.path.join(UPLOAD_FOLDER, filename)
            file.save(file_path)

            # Determine the file type based on the file extension
            file_type = filename.rsplit('.', 1)[1].lower()

            try:
                # Call the function to extract and save data
                result_message = extract_and_save_data(file_path, file_type)
                flash(result_message)
            except Exception as e:
                flash(f"Error processing file: {str(e)}")
                return redirect(request.url)

            # Optionally, remove the file after processing
            os.remove(file_path)

            return 'successfully processed file'

    # If GET request, render the upload form
    return render_template('admin.html')


@additonal_bp.route('/gade-suchi/data', methods=['GET'])
def get_gade_suchi_data():
    """
    Fetch all records from the GadeSuchigalu table and return as JSON.
    """
    # Query all records from the GadeSuchigalu table
    records = GadeSuchigalu.query.all()

    # Convert records to a list of dictionaries
    result = [
        {
            'id': record.id,
            'gade_suchi': record.gade_suchi,
            'parva_name': record.parva_name,
            'sandhi_number': record.sandhi_number,
            'parva_number': record.parva_number,
            'padya_number': record.padya_number
        }
        for record in records
    ]

    # Return JSON response
    return jsonify(result)


@additonal_bp.get('/tippani/update')
def tippani_update():
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
                    # Extract the Tippani from Padya
                    tippani_text = padya.tippani
                    # Create or update the Tippani entry
                    tippani_entry = Tippani.query.filter_by(
                        parva_id=parva.id,
                        sandhi_id=sandhi.id,
                        padya_number=padya.padya_number
                    ).first()
                    if tippani_entry:
                        tippani_entry.tippani = tippani_text
                    else:
                        tippani_entry = Tippani(
                            tippani=tippani_text,
                            parva_id=parva.id,
                            sandhi_id=sandhi.id,
                            padya_number=padya.padya_number
                        )

                    db.session.add(tippani_entry)

        db.session.commit()
        # return Response("Tippani updated successfully", status=200)
        tippani_message = "Tippani updated successfully"
    except Exception as e:
        db.session.rollback()
        # return Response(f"An error occurred: {e}", status=500)
        tippani_message = f"Error Occurred: {str(e)}"
    return render_template('admin.html', tippani_message=tippani_message)


@additonal_bp.get('/tippani/data')
def tippani_data():
    try:
        # Query all Tippani entries
        tippani_entries = Tippani.query.all()
        # Convert the results to a list of dictionaries
        data = [
            {
                'tippani': entry.tippani,
                'parva_name': entry.sandhi.parva.name,  # Fetch the name of the Parva
                'sandhi_name': entry.sandhi.name,  # Fetch the name of the Sandhi
                'padya_number': entry.padya_number,
                'parva_number': entry.sandhi.parva.parva_number,  # Fetch the Parva number
                'sandhi_number': entry.sandhi.sandhi_number,  # Fetch the Sandhi number
            }
            for entry in tippani_entries if len(entry.tippani) > 3
        ]
        return jsonify(data)
    except Exception as e:
        return jsonify({'error': str(e)}), 500
