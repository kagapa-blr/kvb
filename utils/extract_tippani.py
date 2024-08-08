import pandas as pd
from docx import Document


def read_docx(file_path):
    document = Document(file_path)
    data = []

    for table in document.tables:
        for row in table.rows:
            row_data = []
            for cell in row.cells:
                cell_text = cell.text.strip()
                row_data.append(cell_text)
            data.append(row_data)

    return data


def process_data(df):
    processed_data = []
    previous_sandhi = ""
    previous_padya = ""
    previous_tipanni = ""

    for index, row in df.iterrows():
        sandhi, padya, tipanni = row['ಸಂಧಿ'], row['ಪದ್ಯ'], row['ಟಿಪ್ಪಣಿ']
        if padya:
            if previous_tipanni:
                processed_data.append([previous_sandhi, previous_padya, previous_tipanni])
            previous_sandhi = sandhi
            previous_padya = padya
            previous_tipanni = tipanni
        else:
            previous_tipanni += "\n" + tipanni

    if previous_tipanni:
        processed_data.append([previous_sandhi, previous_padya, previous_tipanni])

    return pd.DataFrame(processed_data, columns=['ಸಂಧಿ', 'ಪದ್ಯ', 'ಟಿಪ್ಪಣಿ'])


file_path = '../docs/ಟಿಪ್ಪಣಿಗಳು-ಆದಿಪರ್ವ.docx'
data = read_docx(file_path)

# Filter rows to only include those with exactly 3 columns
filtered_data = [entry for entry in data if len(entry) == 3]

# Create a DataFrame
df = pd.DataFrame(filtered_data, columns=['ಸಂಧಿ', 'ಪದ್ಯ', 'ಟಿಪ್ಪಣಿ'])

# Forward fill the 'ಸಂಧಿ' column for any empty cells
df['ಸಂಧಿ'] = df['ಸಂಧಿ'].replace('', pd.NA).ffill()

# Process the DataFrame
processed_df = process_data(df)

# Save to CSV
csv_file_path = 'ಟಿಪ್ಪಣಿಗಳು-ಆದಿಪರ್ವ.csv'
processed_df.to_csv(csv_file_path, index=False, encoding='utf-8-sig')

print(f'Data successfully saved to {csv_file_path}')
