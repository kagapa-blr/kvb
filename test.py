# import csv
# import os
#
# input_file = "photos_filenames.txt"
# output_csv = "gamaka_vachana.csv"
# photos_dir = "static/photos"
#
# rows = []
#
# print("Reading filenames and preparing CSV...")
#
# with open(input_file, "r", encoding="utf-8") as f:
#     for line in f:
#         filename = line.strip()
#
#         if not filename:
#             continue
#
#         parts = filename.split("_")
#
#         if len(parts) < 6:
#             print("Skipping invalid line:", filename)
#             continue
#
#         raga = parts[0]
#         gamaka_vachakara_name = parts[1]
#         parva_id = parts[2]
#         sandhi_id = parts[3]
#         padya_number = parts[4]
#
#         gamaka_vachakar_photo_path = "_".join(parts[5:])
#         gamaka_vachakar_photo_path = gamaka_vachakar_photo_path.replace(" ", "_")
#
#         rows.append([
#             raga,
#             gamaka_vachakara_name,
#             parva_id,
#             sandhi_id,
#             padya_number,
#             gamaka_vachakar_photo_path
#         ])
#
# print("Writing CSV file...")
#
# with open(output_csv, "w", newline="", encoding="utf-8") as f:
#     writer = csv.writer(f)
#
#     writer.writerow([
#         "raga",
#         "gamaka_vachakara_name",
#         "parva_id",
#         "sandhi_id",
#         "padya_number",
#         "gamaka_vachakar_photo_path"
#     ])
#
#     writer.writerows(rows)
#
# print("CSV file created:", output_csv)
#
#
# # -------------------------------------------------------
# # Rename photos safely
# # -------------------------------------------------------
#
# print("\nChecking and fixing photo filenames...")
#
# existing_files = os.listdir(photos_dir)
#
# for row in rows:
#
#     expected_photo = row[5].lower()
#     expected_path = os.path.join(photos_dir, expected_photo)
#
#     # already correct
#     if os.path.exists(expected_path):
#         continue
#
#     name_parts = expected_photo.replace(".jpg", "").split("_")
#
#     if len(name_parts) < 2:
#         continue
#
#     first = name_parts[0]
#     last = name_parts[-1]
#
#     matched = False
#
#     for file in existing_files:
#
#         file_lower = file.lower()
#
#         if first in file_lower and last in file_lower:
#
#             old_path = os.path.join(photos_dir, file)
#
#             if not os.path.exists(old_path):
#                 continue
#
#             try:
#                 print(f"Renaming: {file} -> {expected_photo}")
#                 os.rename(old_path, expected_path)
#                 matched = True
#                 break
#             except Exception as e:
#                 print("Rename failed:", e)
#
#     if not matched:
#         print("No matching photo found for:", expected_photo)
#
# print("\nPhoto filename correction completed.")


import csv
import os


class GamakaDataProcessor:

    def __init__(self, input_file, photos_dir, output_csv):
        self.input_file = input_file
        self.photos_dir = photos_dir
        self.output_csv = output_csv
        self.rows = []

    # -------------------------------------------------------
    # Parse filenames
    # -------------------------------------------------------
    def parse_filenames(self):

        print("Reading filenames...")

        with open(self.input_file, "r", encoding="utf-8") as f:
            for line in f:

                filename = line.strip()

                if not filename:
                    continue

                parts = filename.split("_")

                if len(parts) < 6:
                    print("Skipping invalid line:", filename)
                    continue

                raga = parts[0]
                gamaka_vachakara_name = parts[1]
                parva_id = int(parts[2])
                sandhi_id = int(parts[3])
                padya_number = int(parts[4])

                photo = "_".join(parts[5:])
                photo = photo.replace(" ", "_")

                self.rows.append({
                    "raga": raga,
                    "gamaka_vachakara_name": gamaka_vachakara_name,
                    "parva_id": parva_id,
                    "sandhi_id": sandhi_id,
                    "padya_number": padya_number,
                    "gamaka_vachakar_photo_path": photo
                })

        print("Total rows parsed:", len(self.rows))


    # -------------------------------------------------------
    # Generate CSV
    # -------------------------------------------------------
    def generate_csv(self):

        print("Generating CSV...")

        with open(self.output_csv, "w", newline="", encoding="utf-8") as f:

            writer = csv.writer(f)

            writer.writerow([
                "raga",
                "gamaka_vachakara_name",
                "parva_id",
                "sandhi_id",
                "padya_number",
                "gamaka_vachakar_photo_path"
            ])

            for r in self.rows:
                writer.writerow([
                    r["raga"],
                    r["gamaka_vachakara_name"],
                    r["parva_id"],
                    r["sandhi_id"],
                    r["padya_number"],
                    r["gamaka_vachakar_photo_path"]
                ])

        print("CSV created:", self.output_csv)


    # -------------------------------------------------------
    # Rename photos
    # -------------------------------------------------------
    def fix_photo_names(self):

        print("\nFixing photo filenames...")

        existing_files = os.listdir(self.photos_dir)

        for r in self.rows:

            expected_photo = r["gamaka_vachakar_photo_path"].lower()
            expected_path = os.path.join(self.photos_dir, expected_photo)

            if os.path.exists(expected_path):
                continue

            name_parts = expected_photo.replace(".jpg", "").split("_")

            if len(name_parts) < 2:
                continue

            first = name_parts[0]
            last = name_parts[-1]

            matched = False

            for file in existing_files:

                file_lower = file.lower()

                if first in file_lower and last in file_lower:

                    old_path = os.path.join(self.photos_dir, file)

                    if not os.path.exists(old_path):
                        continue

                    try:
                        print(f"Renaming: {file} -> {expected_photo}")
                        os.rename(old_path, expected_path)
                        matched = True
                        break

                    except Exception as e:
                        print("Rename failed:", e)

            if not matched:
                print("No matching photo:", expected_photo)

        print("Photo renaming completed.")

import csv
import requests


class GamakaApiUploader:

    def __init__(self, api_url):
        self.api_url = api_url

    def upload_from_csv(self, csv_file):

        print("Uploading data from CSV:", csv_file)

        with open(csv_file, "r", encoding="utf-8") as f:

            reader = csv.DictReader(f)

            for row in reader:

                payload = {
                    "raga": row["raga"],
                    "gamaka_vachakara_name": row["gamaka_vachakara_name"],
                    "parva_id": int(row["parva_id"]),
                    "sandhi_id": int(row["sandhi_id"]),
                    "padya_number": int(row["padya_number"]),
                    "gamaka_vachakar_photo_path": row["gamaka_vachakar_photo_path"]
                }

                try:

                    response = requests.post(self.api_url, json=payload)

                    if response.status_code == 201:
                        print("Inserted:", payload["raga"], payload["gamaka_vachakara_name"])
                    else:
                        print("Failed:", payload, response.text)

                except Exception as e:
                    print("API Error:", e)

        print("Upload finished.")


processor = GamakaDataProcessor(
    input_file="photos_filenames.txt",
    photos_dir="static/photos",
    output_csv="gamaka_vachana.csv"
)

processor.parse_filenames()
processor.generate_csv()
processor.fix_photo_names()


uploader = GamakaApiUploader(
    api_url="http://127.0.0.1:8443/api/gamaka"
)

uploader.upload_from_csv("gamaka_vachana.csv")