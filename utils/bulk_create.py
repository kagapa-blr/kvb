import csv

import requests

BASE_URL = 'http://127.0.0.1:8000'
BASE_URL = 'https://kagapa.com/kvb'


def get_all_parva():
    response = requests.get(BASE_URL + '/api/parva')
    if response.status_code == 200:
        return response.json()
    else:
        print(f"Error fetching parva: {response.json().get('error', response.text)}")
        return None


def get_all_sandhi():
    response = requests.get(BASE_URL + '/api/sandhi')
    if response.status_code == 200:
        return response.json()
    else:
        print(f"Error fetching sandhi: {response.json().get('error', response.text)}")
        return None


all_parvs = get_all_parva()
all_sandhi = get_all_sandhi()


# Function to make a POST request to the Parva API
def save_parva(name):
    for parva in all_parvs:
        if parva['name'] == name.strip():
            print(f"Parva '{name}' already exists.")
            return parva
    response = requests.post(BASE_URL + '/api/parva', json={'name': name})
    if response.status_code == 200:
        return response.json()
    else:
        print(f"Error saving parva '{name}': {response.json().get('error', response.text)}")
        return None


# Function to make a POST request to the Sandhi API
def save_sandhi(parva_name, name):
    try:
        parva_id = save_parva(name=parva_name)
        if parva_id is None:
            return None
        for sandhi in all_sandhi:
            if sandhi['name'] == name.strip():
                return sandhi
        response = requests.post(BASE_URL + '/api/sandhi', json={'parva_id': parva_id['id'], 'name': name})
        response = response.json()
        response['parva_name'] = parva_name
        print(response)
        return response
    except Exception as e:
        print(f"Error saving sandhi '{name}': error: {str(e)}")
        return None


# Function to make a POST request to the Padya API
def save_padya(parvaname, sandhi, padya_number, pathantar, gadya, tippani, artha, padya):
    parva_id = None
    sandhi_id = None
    for parva in all_parvs:
        if parva['name'] == parvaname.strip():
            parva_id = parva['id']
            print(f'matching parva found in existing parvas {parva} and id {parva_id}')
            break
    for sandi in all_sandhi:
        if parva_id == sandi['parva_id'] and sandhi == sandi['name']:
            sandhi_id = sandi['id']
            print(f'matching sandi found in existing sandhis {sandi}')
    if parva_id is None:
        print(f"Parva not found: '{parvaname}', '{sandhi}'")
        return None
    elif sandhi_id is None:
        print(f"Sandhi not found: '{parvaname}', '{sandhi}'")
        return None
    # Save the Padya in the Padya API and print success message
    try:
        response = requests.post(BASE_URL + '/api/padya', json={
            'sandhi_id': sandhi_id,
            'padya_number': padya_number,
            'pathantar': pathantar,
            'gadya': gadya,
            'tippani': tippani,
            'artha': artha,
            'padya': padya
        })
        if response.status_code == 201:
            print(f"Successfully inserted padya {padya_number} in sandhi : {sandhi_id}")
        return response.json()
    except Exception as e:
        print(f"Error saving padya '{padya}': error: {str(e)}")
        return None


# Function to process a CSV file and upload the data
def process_csv(file_path):
    entry = 0
    # Read the CSV file and collect unique parvas, sandhis, and padya entries
    with open(file_path, 'r') as file:
        reader = csv.DictReader(file)
        padya_number = 1
        track_sandhi = []

        # for row in reader:
        #     parva_name = row['parva']
        #     sandhi_name = row['sandhi']
        #     save_sandhi(parva_name=parva_name, name=sandhi_name)
        print('parva and sandhi insertion completed')

        for row in reader:
            entry += 1
            parva_name = row['parva']
            sandhi_name = row['sandhi']
            pathantar = row['patantar']
            gadya = row['gadya']
            tippani = row['tippani']
            artha = row['artha']
            padya = row['padya']
            if sandhi_name not in track_sandhi:
                if len(track_sandhi) != 0:
                    track_sandhi.pop()
                track_sandhi.append(sandhi_name)
                padya_number = 1
            else:
                padya_number += 1

            try:
                pn = padya.strip().split('||')
                pn = [p for p in pn if p]
                pn = int(pn[-1])
                padya_number = pn
            except Exception as e:
                print(f"Error processing padya number: {padya} error: {str(e)}")

            save_padya(parvaname=parva_name,
                       sandhi=sandhi_name,
                       padya_number=padya_number,
                       pathantar=pathantar,
                       gadya=gadya,
                       tippani=tippani,
                       padya=padya,
                       artha=artha
                       )


process_csv('Parva.csv')
