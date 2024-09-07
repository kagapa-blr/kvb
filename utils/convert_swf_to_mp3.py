from pydub import AudioSegment
import os
import shutil


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


if __name__ == "__main__":
    audio_directory = "/home/rpawar/Downloads/kvb/Audio"  # Replace with your directory path

    convert_all_swf_in_directory(audio_directory)
