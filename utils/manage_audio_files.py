import os
import shutil

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


def organise_mp3_files():
    # Define the path to your audio files
    audio_directory = '../static/audio'

    # Get a list of all files in the audio directory
    files = [f for f in os.listdir(audio_directory) if os.path.isfile(os.path.join(audio_directory, f))]

    # Process each file
    for file in files:
        # Get the starting name of the file (e.g., "03" from "Aranya_10_31.mp3")
        starting_name = file.split('_')[0]

        # Define the new directory path
        new_directory = os.path.join(audio_directory, starting_name)

        # Create the directory if it doesn't exist
        if not os.path.exists(new_directory):
            os.makedirs(new_directory)

        # Define the source and destination paths
        src_path = os.path.join(audio_directory, file)
        dest_path = os.path.join(new_directory, file)

        # Move the file to the new directory
        shutil.move(src_path, dest_path)

    print("Files have been organized.")


def rename_mp3_files():
    # Define the path to your audio files
    audio_directory = '../static/audio'

    def format_number(number):
        """Format the number to ensure it's at least two digits."""
        number_str = str(number)
        if len(number_str) == 1:
            return f"0{number_str}"
        return number_str

    # Iterate over each directory in the audio directory
    for directory in os.listdir(audio_directory):
        dir_path = os.path.join(audio_directory, directory)

        if os.path.isdir(dir_path):
            # Iterate over each file in the directory
            for file in os.listdir(dir_path):
                file_path = os.path.join(dir_path, file)

                if os.path.isfile(file_path):
                    # Extract the filename without the extension
                    filename, ext = os.path.splitext(file)

                    # Split the filename by underscore
                    parts = filename.split('-')

                    # Construct the new filename
                    if len(parts) == 3:
                        formatted_parts = [format_number(part) for part in parts[1:3]]
                        new_filename = f"{directory}-{formatted_parts[0]}-{formatted_parts[1]}{ext}"
                        # Define the new file path
                        new_file_path = os.path.join(dir_path, new_filename)
                        # Rename the file
                        os.rename(file_path, new_file_path)

    print("Files have been renamed.")


if __name__ == "__main__":
    # audio_directory = "/home/rpawar/Downloads/kvb/Audio"  # Replace with your directory path
    #
    # convert_all_swf_in_directory(audio_directory)

    # base_audio_directory = '../static/audio'

    # organise_mp3_files()
    rename_mp3_files()
