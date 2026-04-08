# import csv
# import os
# import shutil
# import re
#
#
# def txt_to_csv_and_duplicate_photos(input_txt_file, output_csv_file, photos_dir):
#     """
#     Reads a txt file with filenames like:
#     raga_authorname_parva_sandhi_padya_photo.jpg
#
#     Behavior:
#     - Creates CSV with gamaka, authorname, raga
#     - Duplicates the source photo multiple times if referenced multiple times
#     - Keeps original image unchanged during processing
#     - Replaces spaces with '-' in output filename
#     - Fixes padya 0 -> 1
#     - At the end: deletes all photos that do NOT start with numbers
#     """
#
#     rows = []
#
#     created_count = 0
#     skipped_count = 0
#     missing_count = 0
#     deleted_count = 0
#
#     with open(input_txt_file, "r", encoding="utf-8") as f:
#
#         for line_number, line in enumerate(f, start=1):
#
#             line = line.strip()
#
#             if not line:
#                 continue
#
#             parts = line.split("_")
#
#             if len(parts) < 6:
#                 print(f"Skipping malformed line {line_number}: {line}")
#                 skipped_count += 1
#                 continue
#
#             raga = parts[0]
#             authorname = parts[1]
#             parva = parts[2]
#             sandhi = parts[3]
#             padya = parts[4]
#
#             # Fix padya 0
#             try:
#                 if int(padya) == 0:
#                     padya = "1"
#             except ValueError:
#                 pass
#
#             original_filename = "_".join(parts[5:])
#             original_path = os.path.join(photos_dir, original_filename)
#
#             filename_rest = original_filename.replace(" ", "-")
#
#             gamaka = f"{1}_{sandhi}_{padya}_{filename_rest}"
#             gamaka_path = os.path.join(photos_dir, gamaka)
#
#             if os.path.exists(original_path):
#
#                 if not os.path.exists(gamaka_path):
#
#                     try:
#                         shutil.copy2(original_path, gamaka_path)
#                         created_count += 1
#                         print(f"Created: {gamaka}")
#
#                     except Exception as e:
#                         print(f"Error copying {original_filename}: {e}")
#                         skipped_count += 1
#
#                 else:
#                     print(f"Already exists: {gamaka}")
#                     skipped_count += 1
#
#             else:
#                 print(f"Missing source: {original_path}")
#                 missing_count += 1
#
#             rows.append([
#                 gamaka,
#                 authorname,
#                 raga
#             ])
#
#     # Write CSV
#     with open(output_csv_file, "w", newline="", encoding="utf-8") as csvfile:
#
#         writer = csv.writer(csvfile)
#
#         writer.writerow([
#             "gamaka",
#             "authorname",
#             "raga"
#         ])
#
#         writer.writerows(rows)
#
#     # ---------------------------------------
#     # FINAL CLEANUP STEP
#     # Delete files not starting with number
#     # ---------------------------------------
#
#     print("\nCleaning up non-number filenames...")
#
#     for filename in os.listdir(photos_dir):
#
#         file_path = os.path.join(photos_dir, filename)
#
#         if not os.path.isfile(file_path):
#             continue
#
#         # Check if filename starts with digit
#         if not re.match(r'^\d', filename):
#
#             try:
#                 os.remove(file_path)
#                 deleted_count += 1
#                 print(f"Deleted: {filename}")
#
#             except Exception as e:
#                 print(f"Error deleting {filename}: {e}")
#
#     # Summary
#     print("\nProcessing Summary")
#     print("------------------")
#     print(f"Images created : {created_count}")
#     print(f"Skipped        : {skipped_count}")
#     print(f"Missing source : {missing_count}")
#     print(f"Deleted files  : {deleted_count}")
#     print(f"Total rows     : {len(rows)}")
#
#
# # Example usage
# if __name__ == "__main__":
#
#     photos_directory = r"C:\Users\techk\Desktop\kagapa\kvb\static\photos\gamakaPhotos"
#
#     txt_to_csv_and_duplicate_photos(
#         input_txt_file="test.txt",
#         output_csv_file="output.csv",
#         photos_dir=photos_directory
#     )
import csv
import os
import shutil
import re
import asyncio
import httpx


class GamakaPhotoProcessor:

    def __init__(
        self,
        photos_dir: str,
        api_base_url: str = "http://localhost:8443",
        api_endpoint: str = "/api/gamaka/update-by-padya"
    ):
        self.photos_dir = photos_dir
        self.api_base_url = api_base_url
        self.api_endpoint = api_endpoint

        self.rows = []
        self.api_payloads = []

        # Counters
        self.created = 0
        self.skipped = 0
        self.missing = 0
        self.deleted = 0
        self.api_success = 0
        self.api_failed = 0

        # Concurrency control (IMPORTANT)
        self.semaphore = asyncio.Semaphore(10)

    # -------------------------------------------------------
    # STEP 1
    # Process file and duplicate images
    # -------------------------------------------------------

    def process_file(self, input_txt_file: str):

        with open(input_txt_file, "r", encoding="utf-8") as f:

            for line_number, line in enumerate(f, start=1):

                line = line.strip()

                if not line:
                    continue

                parts = line.split("_")

                if len(parts) < 6:

                    print(
                        f"Skipping malformed line "
                        f"{line_number}"
                    )

                    self.skipped += 1
                    continue

                raga = parts[0]
                authorname = parts[1]
                parva = 1
                sandhi = parts[3]
                padya = parts[4]

                try:
                    if int(padya) == 0:
                        padya = "1"
                except ValueError:
                    pass

                original_filename = "_".join(parts[5:])

                filename_rest = (
                    original_filename
                    .replace(" ", "-")
                )

                gamaka = (
                    f"{1}_{sandhi}_{padya}_{filename_rest}"
                )

                original_path = os.path.join(
                    self.photos_dir,
                    original_filename
                )

                gamaka_path = os.path.join(
                    self.photos_dir,
                    gamaka
                )

                # Duplicate image

                if os.path.exists(original_path):

                    if not os.path.exists(gamaka_path):

                        shutil.copy2(
                            original_path,
                            gamaka_path
                        )

                        self.created += 1

                        print(
                            f"Created: {gamaka}"
                        )

                    else:

                        self.skipped += 1

                else:

                    print(
                        f"Missing: {original_filename}"
                    )

                    self.missing += 1

                # Store CSV row

                self.rows.append([
                    gamaka,
                    authorname,
                    raga
                ])

                # Store API payload

                self.api_payloads.append({
                    "parva": parva,
                    "sandhi": sandhi,
                    "padya": padya,
                    "authorname": authorname,
                    "raga": raga
                })

    # -------------------------------------------------------
    # STEP 2
    # Write CSV
    # -------------------------------------------------------

    def write_csv(self, output_csv_file: str):

        with open(
            output_csv_file,
            "w",
            newline="",
            encoding="utf-8"
        ) as csvfile:

            writer = csv.writer(csvfile)

            writer.writerow([
                "gamaka",
                "authorname",
                "raga"
            ])

            writer.writerows(self.rows)

        print(
            f"CSV written: {output_csv_file}"
        )

    # -------------------------------------------------------
    # STEP 3
    # Async API Update
    # -------------------------------------------------------

    async def update_api_records(self):

        print("\nUpdating API records (async)...")

        url = (
            self.api_base_url +
            self.api_endpoint
        )

        timeout = httpx.Timeout(10.0)

        limits = httpx.Limits(
            max_connections=20,
            max_keepalive_connections=10
        )

        async with httpx.AsyncClient(
            timeout=timeout,
            limits=limits
        ) as client:

            tasks = [
                self._send_patch_request(
                    client,
                    url,
                    data
                )
                for data in self.api_payloads
            ]

            await asyncio.gather(
                *tasks,
                return_exceptions=True
            )

        print("API update completed")

    # -------------------------------------------------------
    # Async worker
    # -------------------------------------------------------

    async def _send_patch_request(
        self,
        client,
        url,
        data
    ):

        params = {
            "parva_number": data["parva"],
            "sandhi_number": data["sandhi"],
            "padya_number": data["padya"]
        }

        payload = {
            "raga": data["raga"],
            "gamaka_vachakara_name":
                data["authorname"]
        }

        try:

            async with self.semaphore:

                response = await client.patch(
                    url,
                    params=params,
                    json=payload
                )
            print(f"API Response : {response.text}")

            if response.status_code == 200:

                self.api_success += 1

            else:

                self.api_failed += 1

                print(
                    "API Failed:",
                    data["parva"],
                    data["sandhi"],
                    data["padya"],
                    response.status_code
                )

        except Exception as e:

            self.api_failed += 1

            print(
                "API Error:",
                e
            )

    # -------------------------------------------------------
    # STEP 4
    # Cleanup files
    # -------------------------------------------------------

    def cleanup_files(self):

        print(
            "\nCleaning up files not starting with numbers..."
        )

        for filename in os.listdir(
            self.photos_dir
        ):

            file_path = os.path.join(
                self.photos_dir,
                filename
            )

            if not os.path.isfile(file_path):
                continue

            if not re.match(
                r"^\d",
                filename
            ):

                try:

                    os.remove(file_path)

                    self.deleted += 1

                    print(
                        f"Deleted: {filename}"
                    )

                except Exception as e:

                    print(
                        f"Delete error: {e}"
                    )

        self.print_summary()

    # -------------------------------------------------------
    # SUMMARY
    # -------------------------------------------------------

    def print_summary(self):

        print("\nSummary")
        print("-------")

        print("Images created :", self.created)
        print("Skipped        :", self.skipped)
        print("Missing        :", self.missing)
        print("API success    :", self.api_success)
        print("API failed     :", self.api_failed)
        print("Deleted files  :", self.deleted)
        print("Total rows     :", len(self.rows))


# -------------------------------------------------------
# MAIN
# -------------------------------------------------------

if __name__ == "__main__":

    processor = GamakaPhotoProcessor(
        photos_dir=r"C:\Users\techk\Desktop\kagapa\kvb\static\photos\gamakaPhotos"
    )

    # STEP 1
    processor.process_file("test.txt")

    # STEP 2
    processor.write_csv("output.csv")

    # STEP 3 (ASYNC)
    asyncio.run(
        processor.update_api_records()
    )

    # STEP 4
    processor.cleanup_files()