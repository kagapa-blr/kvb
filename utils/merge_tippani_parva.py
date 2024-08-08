import pandas as pd

# Read the CSV files into DataFrames
parva_df = pd.read_csv('ಆದಿಪರ್ವ.csv')
tippani_df = pd.read_csv('ಟಿಪ್ಪಣಿಗಳು-ಆದಿಪರ್ವ.csv')

# Ensure padya columns are strings and handle NaN values
parva_df['padya'] = parva_df['padya'].astype(str).fillna('')
tippani_df['ಪದ್ಯ'] = tippani_df['ಪದ್ಯ'].astype(str).fillna('')

# Ensure tippani column in parva_df is a string type
parva_df['tippani'] = parva_df['tippani'].astype(str).fillna('')


# Function to check if Tippani padya is within the Parva padya ending with ||
def check_padya_ending(parva_padya, tippani_padya):
    return f'||{tippani_padya.strip()}||' in parva_padya


# Iterate over Tippani DataFrame and update Parva DataFrame
for tippani_index, tippani_row in tippani_df.iterrows():
    for parva_index, parva_row in parva_df.iterrows():
        if tippani_row['ಸಂಧಿ'] == parva_row['sandhi']:
            if check_padya_ending(parva_row['padya'], tippani_row['ಪದ್ಯ']):
                parva_df.at[parva_index, 'tippani'] = tippani_row['ಟಿಪ್ಪಣಿ']

# Save the updated DataFrame back to Parva.csv
parva_df.to_csv('Parva.csv', index=False)
