import re

import docx
import pandas as pd

KANNADA_DIGITS = {'೦', '೧', '೨', '೩', '೪', '೫', '೬', '೭', '೮', '೯'}


def starts_with_kannada_digit(text):
    return text and text[0] in KANNADA_DIGITS


def classify_paragraph(paragraph):
    """Classify the paragraph based on the given rules."""
    text = paragraph.strip()
    if text == "ಆದಿಪರ್ವ":
        return "parva"
    elif text.startswith("ಸಂಧಿ") or text.endswith("ಸಂಧי"):
        return "sandhi"
    elif text.endswith("||"):
        return "padya"
    elif starts_with_kannada_digit(text):
        return "gadya"
    elif text.startswith("ಪಾಠಾಂತರ"):
        return "patantar"
    elif text.startswith("ಟಿಪ್ಪಣಿ"):
        return "tippani"
    elif text.startswith("ಸೂಚನೆ"):
        return "suchane"
    elif text.startswith("ಅರ್ಥ"):
        return "artha"
    else:
        return "unknown"


def split_on_multiple_spaces(text):
    """Split the text on sequences of more than two spaces."""
    return re.split(r'\s{3,}', text)


def read_and_classify_paragraphs(docx_file):
    # Load the DOCX file
    doc = docx.Document(docx_file)

    # List to hold classified paragraphs
    classified_paragraphs = []

    current_paragraph = ""
    current_entry = {"parva": "", "sandhi": "", "padya": "", "gadya": "", "patantar": "", "tippani": "", "suchane": "",
                     "artha": ""}

    # Iterate through each paragraph in the document
    for paragraph in doc.paragraphs:
        text = paragraph.text.strip()

        if text:
            # Split on sequences of more than two spaces
            parts = split_on_multiple_spaces(text)

            for part in parts:
                if current_paragraph:
                    current_paragraph += "\n" + part
                else:
                    current_paragraph = part

                classification = classify_paragraph(current_paragraph)
                current_entry[classification] = current_paragraph
                current_paragraph = ""

                if classification == "artha" or classification == "unknown":
                    if any(current_entry.values()):
                        classified_paragraphs.append(current_entry)
                        current_entry = {"parva": "", "sandhi": "", "padya": "", "gadya": "", "patantar": "",
                                         "tippani": "", "suchane": "", "artha": ""}

        else:
            if current_paragraph:
                classification = classify_paragraph(current_paragraph)
                current_entry[classification] = current_paragraph
                current_paragraph = ""

                if classification == "artha" or classification == "unknown":
                    if any(current_entry.values()):
                        classified_paragraphs.append(current_entry)
                        current_entry = {"parva": "", "sandhi": "", "padya": "", "gadya": "", "patantar": "",
                                         "tippani": "", "suchane": "", "artha": ""}

    if current_paragraph:
        classification = classify_paragraph(current_paragraph)
        current_entry[classification] = current_paragraph
        if any(current_entry.values()):
            classified_paragraphs.append(current_entry)

    return classified_paragraphs


# Specify the path to your DOCX file
docx_file_path = '../docs/Adiparvarevised.docx'

# Call the function to read and classify paragraphs
classified_paragraphs = read_and_classify_paragraphs(docx_file_path)

# Convert the list of dictionaries to a DataFrame
df = pd.DataFrame(classified_paragraphs)

# Fill 'parva' column with the constant value 'parva' for all rows
df['parva'] = 'ಆದಿಪರ್ವ'

# Propagate the 'sandhi' value to subsequent rows if the current 'sandhi' is empty
df['sandhi'] = df['sandhi'].replace('', pd.NA).ffill()
df = df[df['padya'].notna() & df['padya'].str.strip().astype(bool)]

# Save the DataFrame to a CSV file
csv_file_path = 'ಆದಿಪರ್ವ.csv'
df.to_csv(csv_file_path, index=False, encoding='utf-8-sig')

print(f"Classified paragraphs have been saved to {csv_file_path}")
