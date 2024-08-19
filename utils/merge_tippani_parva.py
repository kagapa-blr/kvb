import re

import pandas as pd

# Read the CSV files into DataFrames
# parva_df = pd.read_csv('ಆದಿಪರ್ವ.csv')
# tippani_df = pd.read_csv('ಟಿಪ್ಪಣಿಗಳು-ಆದಿಪರ್ವ.csv')

parva_df = pd.read_csv('ಸಭಾಪರ್ವ.csv')
tippani_df = pd.read_csv('ಸಭಾಪರ್ವ-ಟಿಪ್ಪಣಿಗಳು.csv')

# Ensure padya columns are strings and handle NaN values
parva_df['padya'] = parva_df['padya'].astype(str).fillna('')
tippani_df['ಪದ್ಯ'] = tippani_df['ಪದ್ಯ'].astype(str).fillna('')

# Ensure tippani column in parva_df is a string type
parva_df['tippani'] = parva_df['tippani'].astype(str).fillna('')


def extract_kannada_number(text):
    # Define a regex pattern to match Kannada digits enclosed by |, ||, or |||
    pattern = r'\|\s*([೦-೯]+)\s*\|{1,3}'
    # Search for the pattern in the text
    match = re.search(pattern, text)
    # Return the matched number if found, otherwise return None
    if match:
        return match.group(1)
    return None


# Function to check if Tippani padya is within the Parva padya ending with ||
def check_padya_ending(parva_padya, tippani_padya):
    # Normalize spaces between || and the padya text
    normalized_parva_padya = parva_padya.replace(' ', '')
    normalized_tippani_padya = tippani_padya.strip().replace(' ', '')
    # Check if ||tippani_padya|| exists in the normalized padya text
    padya_number = extract_kannada_number(parva_padya)
    return padya_number == normalized_tippani_padya


# Iterate over Tippani DataFrame and update Parva DataFrame
for tippani_index, tippani_row in tippani_df.iterrows():
    for parva_index, parva_row in parva_df.iterrows():
        if tippani_row['ಸಂಧಿ'] == parva_row['sandhi']:
            if check_padya_ending(parva_row['padya'], tippani_row['ಪದ್ಯ']):
                parva_df.at[parva_index, 'tippani'] = tippani_row['ಟಿಪ್ಪಣಿ']

parva_df = parva_df.replace("nan", "-")

# Save the updated DataFrame back to Parva.csv
parva_df.to_csv('SabhaParva.csv', index=False, encoding='utf8')
