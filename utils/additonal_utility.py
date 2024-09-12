import csv

from docx import Document
from flask import Blueprint

from model.models import db, Parva, GadeSuchigalu

# Define the blueprint
additional_bp = Blueprint('additional', __name__)

# Folder to save uploaded files
UPLOAD_FOLDER = 'uploadedfiles'  # Ensure this directory exists and is writable
ALLOWED_EXTENSIONS = {'docx', 'csv'}


def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


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
                    print(f"Error converting numbers: sandhi_number='{sandhi_number}', padya_number='{padya_number}'")
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
