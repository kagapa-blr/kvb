import csv
import requests
import os
import time
from collections import defaultdict

API_BASE = "https://kagapa.com/kvb/api"
CSV_FILE = "gakamaFinal.csv"
PHOTO_FOLDER = "photosofsingers"

success_count = 0
fail_count = 0

def find_photo(photo_filename):
    exact_path = os.path.join(PHOTO_FOLDER, photo_filename)
    if os.path.exists(exact_path):
        print(f"[INFO] Exact photo match found: {exact_path}")
        return exact_path

    prefix = photo_filename[:5]
    for f in os.listdir(PHOTO_FOLDER):
        if f.lower().startswith(prefix.lower()):
            fallback_path = os.path.join(PHOTO_FOLDER, f)
            print(f"[WARN] Exact photo not found, using fallback: {fallback_path}")
            return fallback_path

    print(f"[ERROR] No photo found for expected filename: {photo_filename}")
    return None

def bulk_update(parva_number, sandhi_number, padya_numbers, raga, singer, photo_filename, current, total):
    global success_count, fail_count

    data = {
        "raga": raga,
        "gamaka_vachakara_name": singer,
        "padya_numbers": padya_numbers,
    }

    files = {}
    photo_path = find_photo(photo_filename)
    if photo_path:
        files["photo"] = open(photo_path, "rb")

    url = f"{API_BASE}/gamaka/padya-list/{parva_number}/{sandhi_number}"
    print(f"\n[PROGRESS] {current}/{total}")
    print(f"[REQUEST] PUT {url}")
    print(f"          Singer: {singer}, Raga: {raga}, Padyas: {padya_numbers}, Photo: {photo_path or 'None'}")

    try:
        response = requests.put(url, data=data, files=files, timeout=60)
        print(f"[RESPONSE] Status {response.status_code} | {response.text[:200]}")
        if response.status_code == 200:
            success_count += 1
        else:
            fail_count += 1
    except requests.exceptions.RequestException as e:
        print(f"[ERROR] Request failed for Singer {singer}, Raga {raga}, Padyas {padya_numbers}: {e}")
        fail_count += 1
    finally:
        if "photo" in files:
            files["photo"].close()

    # Wait longer between requests to avoid server reset
    print("[INFO] Waiting 2 seconds before next request...")
    time.sleep(2)

def main():
    grouped = defaultdict(list)
    with open(CSV_FILE, newline="", encoding="utf-8") as csvfile:
        reader = csv.DictReader(csvfile)
        for row in reader:
            parva_number = 1
            sandhi_number = int(row["ಸಂಧಿ"])
            padya_number = int(row["ಪದ್ಯ"])
            raga = row["ರಾಗ"].strip()
            singer = row["ಹಾಡಿರುವವರು"].strip()
            photo_filename = row["filename"].strip()
            key = (singer, raga, sandhi_number, photo_filename)
            grouped[key].append(padya_number)

    total = len(grouped)
    print(f"[INFO] Prepared {total} grouped updates from CSV")

    for idx, ((singer, raga, sandhi_number, photo_filename), padya_numbers) in enumerate(grouped.items(), start=1):
        bulk_update(1, sandhi_number, padya_numbers, raga, singer, photo_filename, idx, total)

    print(f"\n[SUMMARY] Updates completed. Success: {success_count}, Failures: {fail_count}, Total: {total}")

if __name__ == "__main__":
    main()
