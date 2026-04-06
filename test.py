import csv
import csv
import csv
import os
import csv
import os

def txt_to_csv_and_rename_photos(input_txt_file, output_csv_file, photos_dir):
    """
    Reads a txt file with filenames like:
    raga_authorname_parva_sandhi_padya_photo.jpg
    Creates CSV with gamaka, authorname, raga.
    Renames the actual photo files in photos_dir to match gamaka (spaces -> '-')
    """
    rows = []

    with open(input_txt_file, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if not line:
                continue

            parts = line.split('_')
            if len(parts) < 6:
                print(f"Skipping malformed line: {line}")
                continue

            raga = parts[0]
            authorname = parts[1]
            parva = parts[2]
            sandhi = parts[3]
            padya = parts[4]

            # Reconstruct the original photo filename
            original_filename = "_".join(parts[5:])
            original_filename_path = os.path.join(photos_dir, original_filename)

            # Replace spaces with '-' in the photo filename
            filename_rest = original_filename.replace(' ', '-')

            # Final gamaka filename: parva_sandhi_padya_replaced-filename
            gamaka = f"{1}_{sandhi}_{padya}_{filename_rest}"
            gamaka_path = os.path.join(photos_dir, gamaka)

            # Rename the photo file if it exists
            if os.path.exists(original_filename_path):
                os.rename(original_filename_path, gamaka_path)
            else:
                print(f"Warning: {original_filename_path} does not exist. Skipping rename.")

            rows.append([gamaka, authorname, raga])

    # Write CSV
    with open(output_csv_file, 'w', newline='', encoding='utf-8') as csvfile:
        writer = csv.writer(csvfile)
        writer.writerow(['gamaka', 'authorname', 'raga'])
        writer.writerows(rows)


# Example usage:
photos_directory = r"C:\Users\techk\Desktop\kagapa\kvb\static\photos\gamakaPhotos"
txt_to_csv_and_rename_photos("test.txt", "output.csv", photos_directory)
