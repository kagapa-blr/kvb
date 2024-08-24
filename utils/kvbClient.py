import csv
import re

import requests

BASE_URL = 'http://127.0.0.1:8000'


# BASE_URL = 'https://kagapa.com/kvb'


class ParvaSandhiManager:
    def __init__(self, base_url):
        self.base_url = base_url
        self.all_parvs = self.get_all_parva()
        self.all_sandhi = self.get_all_sandhi()

    def extract_kannada_number(self, padya):
        # Define a regex pattern to match Kannada digits enclosed by |, ||, or |||
        pattern = r'\|\s*([೦-೯]+)\s*\|{1,3}'
        # Search for the pattern in the text
        match = re.search(pattern, padya)
        # Return the matched number if found, otherwise return None
        if match:
            return match.group(1)
        return None

    def get_all_parva(self):
        response = requests.get(self.base_url + '/api/parva')
        if response.status_code == 200:
            return response.json()
        else:
            print(f"Error fetching parva: {response.json().get('error', response.text)}")
            return None

    def get_all_sandhi(self):
        response = requests.get(self.base_url + '/api/sandhi')
        if response.status_code == 200:
            return response.json()
        else:
            print(f"Error fetching sandhi: {response.json().get('error', response.text)}")
            return None

    def save_parva(self, name):
        # Check if the parva already exists by name
        for parva in self.all_parvs:
            if parva['name'] == name.strip():
                print(f"Parva '{name}' already exists.")
                return parva

        # Determine the next available parva number
        existing_numbers = {parva['parva_number'] for parva in self.all_parvs}
        next_parva_number = 1
        while next_parva_number in existing_numbers:
            next_parva_number += 1

        # Make the POST request to save the parva
        response = requests.post(self.base_url + '/api/parva', json={'name': name, 'parva_number': next_parva_number})

        if response.status_code == 200:
            parva = response.json()
            self.all_parvs.append(parva)
            return parva
        else:
            print(f"Error saving parva '{name}': {response.json().get('error', response.text)}")
            return None

    def save_sandhi(self, parva_name, name):
        # Save the parva and get the parva_id
        parva = self.save_parva(name=parva_name)
        if parva is None:
            return None

        parva_id = parva['id']

        # Check if the sandhi already exists
        for sandhi in self.all_sandhi:
            if sandhi['name'] == name.strip() and sandhi['parva_id'] == parva_id:
                return sandhi

        # Extract the sandhi_number from the name
        sandhi_number_str = name.replace("ಸಂಧಿ", "").strip()
        try:
            sandhi_number = int(sandhi_number_str)
        except ValueError:
            print(f"Error: Invalid sandhi number in name '{name}'.")
            return None

        # Make the POST request to save the sandhi
        response = requests.post(self.base_url + '/api/sandhi',
                                 json={'parva_id': parva_id, 'name': name, 'sandhi_number': sandhi_number})

        if response.status_code == 200:
            sandhi = response.json()
            sandhi['parva_name'] = parva_name
            self.all_sandhi.append(sandhi)
            print(sandhi)
            return sandhi
        else:
            print(f"Error saving sandhi '{name}': {response.json().get('error', response.text)}")
            return None

    def save_padya(self, parvaname, sandhi, padya_number, pathantar, gadya, tippani, artha, padya):
        parva_id = None
        sandhi_id = None
        for parva in self.all_parvs:
            if parva['name'] == parvaname.strip():
                parva_id = parva['id']
                print(f'matching parva found in existing parvas {parva} and id {parva_id}')
                break
        for sandi in self.all_sandhi:
            if parva_id == sandi['parva_id'] and sandhi == sandi['name']:
                sandhi_id = sandi['id']
                print(f'matching sandhi found in existing sandhis {sandi}')
        if parva_id is None:
            print(f"Parva not found: '{parvaname}', '{sandhi}'")
            return None
        elif sandhi_id is None:
            print(f"Sandhi not found: '{parvaname}', '{sandhi}'")
            return None
        try:
            response = requests.post(self.base_url + '/api/padya', json={
                'sandhi_id': sandhi_id,
                'padya_number': padya_number,
                'pathantar': pathantar,
                'gadya': gadya,
                'tippani': tippani,
                'artha': artha,
                'padya': padya
            })
            if response.status_code == 201:
                print(f"Successfully inserted padya {padya_number} in sandhi: {sandhi_id}")
            return response.json()
        except Exception as e:
            print(f"Error saving padya '{padya}': error: {str(e)}")
            return None

    def process_parva_sandhi(self, file_path):
        with open(file_path, 'r') as file:
            reader = csv.DictReader(file)
            unique_sandhi = []
            unique_parva = []
            for row in reader:
                parva_name = row['parva']
                sandhi_name = row['sandhi']
                try:
                    if sandhi_name not in unique_sandhi:
                        self.save_sandhi(parva_name=parva_name, name=sandhi_name)
                        unique_sandhi.append(sandhi_name)
                        unique_parva.append(parva_name)
                except Exception as e:
                    print(f"Error processing parva/sandhi error: {str(e)}")
            print('Parva and sandhi insertion completed')

    def process_csv(self, file_path):
        entry = 0
        with open(file_path, 'r') as file:
            reader = csv.DictReader(file)
            padya_number = 1
            track_sandhi = []

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
                    if track_sandhi:
                        track_sandhi.pop()
                    track_sandhi.append(sandhi_name)
                    padya_number = 1
                else:
                    padya_number += 1

                try:
                    # pn = padya.strip().split('||')
                    # pn = [p for p in pn if p]
                    # padya_number = int(pn[-1])
                    padya_number = int(self.extract_kannada_number(padya))
                except Exception as e:
                    print(f"Error processing padya number: {padya} error: {str(e)}")

                self.save_padya(parvaname=parva_name,
                                sandhi=sandhi_name,
                                padya_number=padya_number,
                                pathantar=pathantar,
                                gadya=gadya,
                                tippani=tippani,
                                artha=artha,
                                padya=padya
                                )

    def add_user(self):
        user_data = {
            "username": "admin",
            "password": "pass@2024",
            "phone_number": 123243434,
            "email": "kagapa@gmail.com"
        }
        try:
            response = requests.post(self.base_url + '/api/users', json=user_data)
            print(response.json())
        except Exception as e:
            print(f"Error adding user: {str(e)}")
        return response


if __name__ == "__main__":
    manager = ParvaSandhiManager(BASE_URL)
    # file = "Parva.csv"
    file = "SabhaParva.csv"
    # First insert parva and sandhi
    # first run for parva
    # manager.process_parva_sandhi(file)
    # Then process padya entries
    manager.process_csv(file)
    manager.add_user()
