from pydub import AudioSegment


def convert_swf_to_mp3(input_file, output_file):
    # Ensure ffmpeg is accessible
    if not shutil.which("ffmpeg"):
        raise EnvironmentError("ffmpeg not found, please install it and add to PATH")

    # Load the .swf file
    audio = AudioSegment.from_file(input_file, format="swf")

    # Export as .mp3
    audio.export(output_file, format="mp3")


def convert_all_swf_in_directory(directory):
    if not os.path.exists(directory):
        print(f"The directory {directory} does not exist.")
        return

    for filename in os.listdir(directory):
        if filename.endswith(".swf"):
            input_file = os.path.join(directory, filename)
            output_file = os.path.join(directory, filename.replace(".swf", ".mp3"))

            try:
                convert_swf_to_mp3(input_file, output_file)
                print(f"Converted {input_file} to {output_file}")
            except Exception as e:
                print(f"Failed to convert {input_file}: {e}")


import os
import shutil


def segregate_mp3_files(base_dir):
    # Ensure the base directory exists
    if not os.path.isdir(base_dir):
        raise FileNotFoundError(f"The directory {base_dir} does not exist.")

    # Initialize a dictionary to track directory prefixes and their corresponding directory numbers
    dir_counter = 1
    dir_mapping = {}

    # List all mp3 files in the base directory
    for filename in os.listdir(base_dir):
        if filename.endswith('.mp3'):
            # Extract the prefix and numbers from the filename
            parts = filename.split('_')
            if len(parts) < 3:
                print(f"Skipping file {filename} due to incorrect format.")
                continue
            prefix = parts[0]
            middle_number = parts[1]
            last_number = parts[2].split('.')[0]

            # Check if this prefix already has a directory assigned
            if prefix not in dir_mapping:
                # Create the directory name with incrementing number and 'parva' suffix
                directory_name = f"{str(dir_counter).zfill(2)}-{prefix.lower()}parva"
                target_dir = os.path.join(base_dir, directory_name)

                # Create the directory if it doesn't exist
                if not os.path.isdir(target_dir):
                    os.makedirs(target_dir)

                # Map this prefix to the directory number
                dir_mapping[prefix] = {
                    'dir_number': str(dir_counter).zfill(2),
                    'target_dir': target_dir
                }

                # Increment the directory counter for the next unique prefix
                dir_counter += 1

            # Get the directory info from the mapping
            dir_info = dir_mapping[prefix]
            dir_number = dir_info['dir_number']
            target_dir = dir_info['target_dir']

            # Create the new mp3 filename in the format XX-XX-XX.mp3
            new_filename = f"{dir_number}-{middle_number.zfill(2)}-{last_number.zfill(2)}.mp3"

            # Copy the mp3 file to the target directory with the new filename
            source_path = os.path.join(base_dir, filename)
            target_path = os.path.join(target_dir, new_filename)
            shutil.copy2(source_path, target_path)


if __name__ == "__main__":
    # audio_directory = "/home/rpawar/Downloads/kvb/Audio"  # Replace with your directory path
    #
    # convert_all_swf_in_directory(audio_directory)
    # Example usage
    base_audio_directory = '../static/audio'
    segregate_mp3_files(base_audio_directory)
