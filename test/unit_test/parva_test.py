import json
import unittest

import requests


class TestAPI(unittest.TestCase):
    BASE_URL = "http://localhost:8000"  # Replace with your actual base URL

    def test_fetch_parva(self):
        response = requests.get(f"{self.BASE_URL}/api/parva")
        self.assertEqual(response.status_code, 200)
        self.assertIsInstance(response.json(), list)

    def test_fetch_sandhi_by_parva(self):
        parva_id = 1  # Replace with a valid parva_id
        response = requests.get(f"{self.BASE_URL}/api/sandhi/by_parva/{parva_id}")
        self.assertEqual(response.status_code, 200)
        self.assertIsInstance(response.json(), list)

    def test_fetch_padya_by_sandhi(self):
        sandhi_id = 1  # Replace with a valid sandhi_id
        response = requests.get(f"{self.BASE_URL}/api/padya/by_sandhi/{sandhi_id}")
        self.assertEqual(response.status_code, 200)
        self.assertIsInstance(response.json(), list)

    def test_fetch_padya_content(self):
        sandhi_id = 1  # Replace with a valid sandhi_id
        padya_number = 1  # Replace with a valid padya_number
        response = requests.get(f"{self.BASE_URL}/api/padya/{sandhi_id}/{padya_number}")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn('padya', data)
        self.assertIn('pathantar', data)
        self.assertIn('gadya', data)
        self.assertIn('artha', data)
        self.assertIn('tippani', data)

    def test_insert_parva(self):
        new_parva = {"name": "New Parva"}
        response = requests.post(
            f"{self.BASE_URL}/api/parva",
            headers={'Content-Type': 'application/json'},
            data=json.dumps(new_parva)
        )
        self.assertEqual(response.status_code, 201)
        data = response.json()
        self.assertIn('id', data)
        self.assertEqual(data['name'], new_parva['name'])

    def test_insert_sandhi(self):
        new_sandhi = {"parva_id": 1, "name": "New Sandhi"}  # Replace with a valid parva_id
        response = requests.post(
            f"{self.BASE_URL}/api/sandhi",
            headers={'Content-Type': 'application/json'},
            data=json.dumps(new_sandhi)
        )
        self.assertEqual(response.status_code, 201)
        data = response.json()
        self.assertIn('id', data)
        self.assertEqual(data['name'], new_sandhi['name'])

    def test_insert_padya(self):
        new_padya = {
            "sandhi_id": 1,  # Replace with a valid sandhi_id
            "padya_number": 1,
            "padya": "New Padya",
            "pathantar": "New Pathantar",
            "gadya": "New Gadya",
            "tippani": "New Tippani",
            "artha": "New Artha"
        }
        response = requests.post(
            f"{self.BASE_URL}/api/padya",
            headers={'Content-Type': 'application/json'},
            data=json.dumps(new_padya)
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn('id', data)
        self.assertEqual(data['padya_number'], new_padya['padya_number'])

    def test_get_all_sandhi(self):
        response = requests.get(f"{self.BASE_URL}/api/sandhi")
        self.assertEqual(response.status_code, 200)
        self.assertIsInstance(response.json(), list)


if __name__ == "__main__":
    unittest.main()
