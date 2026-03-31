import glob
import os

from model.models import GamakaVachana, db


class AudioFileHandler:
    """
    Handler for parsing and mapping audio filenames to padya entries.
    
    Filename format: parva_id_sandhi_id_padya_number_[raga]_[artist].mp3
    Example: 1_1_1_testraga_sunita.mp3
    
    Rules:
    - First 3 parts (split by _) must be integers: parva_id, sandhi_id, padya_number
    - Remaining parts are optional (raga, artist name, etc.)
    - Supports padded and unpadded formats: 1_1_1 and 01_01_01 are treated as same
    - If database path is null, checks filesystem and updates database
    """
    
    # Default audio directory
    DEFAULT_AUDIO_DIR = os.path.join(
        os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
        'static', 'audio', 'gamakaAudio'
    )

    @staticmethod
    def parse_filename(filename):
        """
        Parse audio filename and extract parva_id, sandhi_id, padya_number.
        
        Args:
            filename (str): Audio filename (e.g., '1_1_1_testraga_sunita.mp3')
            
        Returns:
            dict: {
                'valid': bool,
                'parva_id': int or None,
                'sandhi_id': int or None,
                'padya_number': int or None,
                'raga': str or None,
                'artist': str or None,
                'error': str or None
            }
        """
        result = {
            'valid': False,
            'parva_id': None,
            'sandhi_id': None,
            'padya_number': None,
            'raga': None,
            'artist': None,
            'error': None
        }

        try:
            # Remove file extension
            name_without_ext = os.path.splitext(filename)[0]
            
            # Split by underscore
            parts = name_without_ext.split('_')
            
            # Need at least 3 parts for the required identifiers
            if len(parts) < 3:
                result['error'] = f"Filename must have at least 3 underscore-separated parts, got {len(parts)}"
                return result
            
            # First 3 parts must be integers
            try:
                parva_id = int(parts[0])
                sandhi_id = int(parts[1])
                padya_number = int(parts[2])
            except ValueError as e:
                result['error'] = f"First 3 parts must be integers. Failed to parse: {str(e)}"
                return result
            
            # Optional parts
            raga = parts[3] if len(parts) > 3 else None
            artist = parts[4] if len(parts) > 4 else None
            
            result['valid'] = True
            result['parva_id'] = parva_id
            result['sandhi_id'] = sandhi_id
            result['padya_number'] = padya_number
            result['raga'] = raga
            result['artist'] = artist
            
        except Exception as e:
            result['error'] = f"Error parsing filename: {str(e)}"
        
        return result

    @staticmethod
    def map_to_padya_entry(parva_id, sandhi_id, padya_number):
        """
        Map parva, sandhi, and padya numbers to a GamakaVachana entry.
        
        Args:
            parva_id (int): Parva identifier
            sandhi_id (int): Sandhi identifier
            padya_number (int): Padya number
            
        Returns:
            GamakaVachana or None: The matching gamaka vachana entry
        """
        try:
            entry = GamakaVachana.query.filter_by(
                parva_id=parva_id,
                sandhi_id=sandhi_id,
                padya_number=padya_number
            ).first()
            return entry
        except Exception as e:
            print(f"Error mapping to padya entry: {str(e)}")
            return None

    @staticmethod
    def find_audio_file_in_filesystem(parva_id, sandhi_id, padya_number, 
                                     audio_dir=None):
        """
        Find audio file in filesystem using padding-aware search.
        
        Supports both padded and unpadded formats with multiple separators:
        - Underscore: 1_1_1_*.mp3, 01_01_01_*.mp3, 001_001_001_*.mp3
        - Hyphen: 1-1-1_*.mp3, 01-01-01_*.mp3, 001-001-001_*.mp3
        - Exact match: 1_1_1.mp3, 01-01-01.mp3, etc.
        
        Args:
            parva_id (int): Parva identifier
            sandhi_id (int): Sandhi identifier
            padya_number (int): Padya number
            audio_dir (str): Audio directory path (uses default if None)
            
        Returns:
            str: Full path to found audio file, or None if not found
        """
        if audio_dir is None:
            audio_dir = AudioFileHandler.DEFAULT_AUDIO_DIR
        
        if not os.path.isdir(audio_dir):
            return None
        
        try:
            audio_extensions = {'.mp3', '.wav', '.ogg', '.flac', '.m4a'}
            
            # Generate search patterns with different padding levels and separators
            search_patterns = []
            
            # Patterns with UNDERSCORE separator
            search_patterns.extend([
                # Unpadded: 1_1_1_*.mp3
                f"{parva_id}_{sandhi_id}_{padya_number}_*",
                # Zero-padded to 2 digits: 01_01_01_*.mp3
                f"{parva_id:02d}_{sandhi_id:02d}_{padya_number:02d}_*",
                # Zero-padded to 3 digits: 001_001_001_*.mp3
                f"{parva_id:03d}_{sandhi_id:03d}_{padya_number:03d}_*",
            ])
            
            # Patterns with HYPHEN separator
            search_patterns.extend([
                # Unpadded: 1-1-1_*.mp3 or 1-1-1-*.mp3
                f"{parva_id}-{sandhi_id}-{padya_number}_*",
                f"{parva_id}-{sandhi_id}-{padya_number}-*",
                # Zero-padded to 2 digits: 01-01-01_*.mp3 or 01-01-01-*.mp3
                f"{parva_id:02d}-{sandhi_id:02d}-{padya_number:02d}_*",
                f"{parva_id:02d}-{sandhi_id:02d}-{padya_number:02d}-*",
                # Zero-padded to 3 digits: 001-001-001_*.mp3 or 001-001-001-*.mp3
                f"{parva_id:03d}-{sandhi_id:03d}-{padya_number:03d}_*",
                f"{parva_id:03d}-{sandhi_id:03d}-{padya_number:03d}-*",
            ])
            
            # Also search without any suffix (just exact ID match)
            exact_patterns = []
            
            # Exact patterns with UNDERSCORE
            exact_patterns.extend([
                f"{parva_id}_{sandhi_id}_{padya_number}",
                f"{parva_id:02d}_{sandhi_id:02d}_{padya_number:02d}",
                f"{parva_id:03d}_{sandhi_id:03d}_{padya_number:03d}",
            ])
            
            # Exact patterns with HYPHEN
            exact_patterns.extend([
                f"{parva_id}-{sandhi_id}-{padya_number}",
                f"{parva_id:02d}-{sandhi_id:02d}-{padya_number:02d}",
                f"{parva_id:03d}-{sandhi_id:03d}-{padya_number:03d}",
            ])
            
            # Search with metadata patterns
            for pattern in search_patterns:
                glob_pattern = os.path.join(audio_dir, f"{pattern}.*")
                matches = glob.glob(glob_pattern)
                
                for file_path in matches:
                    ext = os.path.splitext(file_path)[1].lower()
                    if ext in audio_extensions:
                        return file_path
            
            # Search for exact matches without metadata
            for pattern in exact_patterns:
                for ext in audio_extensions:
                    file_path = os.path.join(audio_dir, f"{pattern}{ext}")
                    if os.path.isfile(file_path):
                        return file_path
            
            return None
            
        except Exception as e:
            print(f"Error finding audio file in filesystem: {str(e)}")
            return None

    @staticmethod
    def update_audio_path_in_database(entry_id, audio_path):
        """
        Update audio path for a gamaka vachana entry in the database.
        
        Args:
            entry_id (int): GamakaVachana entry ID
            audio_path (str): Full path to audio file
            
        Returns:
            bool: True if successful, False otherwise
        """
        try:
            entry = GamakaVachana.query.get(entry_id)
            if entry:
                entry.gamaka_vachakar_audio_path = audio_path
                db.session.commit()
                return True
            return False
        except Exception as e:
            print(f"Error updating audio path in database: {str(e)}")
            db.session.rollback()
            return False

    @staticmethod
    def convert_absolute_to_relative_path(absolute_path):
        """
        Convert absolute file path to relative path (relative to static folder).
        
        Args:
            absolute_path (str): Absolute file path
            
        Returns:
            str: Relative path (e.g., 'audio/gamakaAudio/filename.mp3') or original path if not convertible
        """
        try:
            import os
            from flask import current_app
            
            # Try to get static folder from Flask app
            if current_app:
                static_folder = current_app.static_folder
                
                # Normalize paths for comparison
                abs_path_normalized = os.path.normpath(absolute_path)
                static_folder_normalized = os.path.normpath(static_folder)
                
                # If path is within static folder, convert to relative
                if abs_path_normalized.startswith(static_folder_normalized):
                    # Get relative path from static folder
                    relative_path = os.path.relpath(abs_path_normalized, static_folder_normalized)
                    # Convert backslashes to forward slashes for web URLs
                    relative_path = relative_path.replace('\\', '/')
                    return relative_path
            
            # If current_app not available, try manual extraction for known pattern
            # Look for 'static' directory in path and extract from there
            if 'static' in absolute_path:
                parts = absolute_path.split('static')
                if len(parts) >= 2:
                    relative_part = parts[-1].lstrip('\\/').replace('\\', '/')
                    return relative_part
            
            # Return original if cannot convert
            return absolute_path
            
        except Exception as e:
            print(f"Error converting path to relative: {str(e)}")
            return absolute_path

    @staticmethod
    def map_to_padya_with_fs_check(parva_id, sandhi_id, padya_number, 
                                   audio_dir=None):
        """
        Map to padya entry with filesystem fallback if database path is null.
        
        This method:
        1. Finds the database entry
        2. If entry exists and audio_path is set, returns it
        3. If audio_path is null, searches filesystem
        4. If file found, updates database and returns path
        
        Args:
            parva_id (int): Parva identifier
            sandhi_id (int): Sandhi identifier
            padya_number (int): Padya number
            audio_dir (str): Audio directory path (uses default if None)
            
        Returns:
            dict: {
                'found': bool,
                'entry': GamakaVachana or None,
                'audio_path': str or None,
                'audio_found_in': 'database' or 'filesystem' or None,
                'details': dict
            }
        """
        result = {
            'found': False,
            'entry': None,
            'audio_path': None,
            'audio_found_in': None,
            'details': None
        }
        
        if audio_dir is None:
            audio_dir = AudioFileHandler.DEFAULT_AUDIO_DIR
        
        try:
            # Get database entry
            entry = AudioFileHandler.map_to_padya_entry(parva_id, sandhi_id, padya_number)
            
            if not entry:
                return result
            
            result['found'] = True
            result['entry'] = entry
            
            # Check if audio path is already in database
            if entry.gamaka_vachakar_audio_path:
                result['audio_path'] = entry.gamaka_vachakar_audio_path
                result['audio_found_in'] = 'database'
            else:
                # Try to find in filesystem
                audio_file_path = AudioFileHandler.find_audio_file_in_filesystem(
                    parva_id, sandhi_id, padya_number, audio_dir
                )
                
                if audio_file_path:
                    # Convert absolute path to relative path before saving
                    relative_audio_path = AudioFileHandler.convert_absolute_to_relative_path(audio_file_path)
                    
                    # Update database with relative path
                    if AudioFileHandler.update_audio_path_in_database(entry.id, relative_audio_path):
                        result['audio_path'] = relative_audio_path
                        result['audio_found_in'] = 'filesystem'
            
            # Prepare details
            result['details'] = {
                'id': entry.id,
                'parva_id': entry.parva_id,
                'sandhi_id': entry.sandhi_id,
                'padya_number': entry.padya_number,
                'raga': entry.raga,
                'gamaka_vachakara_name': entry.gamaka_vachakara_name,
                'gamaka_vachakar_photo_path': entry.gamaka_vachakar_photo_path,
                'gamaka_vachakar_audio_path': entry.gamaka_vachakar_audio_path
            }
            
        except Exception as e:
            print(f"Error in map_to_padya_with_fs_check: {str(e)}")
        
        return result

    @staticmethod
    def parse_and_map(filename):
        """
        Parse filename and map to padya entry in one operation.
        
        Args:
            filename (str): Audio filename
            
        Returns:
            dict: {
                'filename': str,
                'parse_result': dict (from parse_filename),
                'padya_entry': GamakaVachana or None,
                'entry_details': dict or None
            }
        """
        parse_result = AudioFileHandler.parse_filename(filename)
        
        result = {
            'filename': filename,
            'parse_result': parse_result,
            'padya_entry': None,
            'entry_details': None
        }
        
        if parse_result['valid']:
            entry = AudioFileHandler.map_to_padya_entry(
                parse_result['parva_id'],
                parse_result['sandhi_id'],
                parse_result['padya_number']
            )
            
            result['padya_entry'] = entry
            
            if entry:
                result['entry_details'] = {
                    'id': entry.id,
                    'parva_id': entry.parva_id,
                    'sandhi_id': entry.sandhi_id,
                    'padya_number': entry.padya_number,
                    'raga': entry.raga,
                    'gamaka_vachakara_name': entry.gamaka_vachakara_name,
                    'gamaka_vachakar_photo_path': entry.gamaka_vachakar_photo_path,
                    'gamaka_vachakar_audio_path': entry.gamaka_vachakar_audio_path
                }
        
        return result

    @staticmethod
    def process_audio_directory(directory_path):
        """
        Process all audio files in a directory and map them to padya entries.
        
        Args:
            directory_path (str): Path to audio directory
            
        Returns:
            list: List of results for each audio file
        """
        results = []
        
        if not os.path.isdir(directory_path):
            return [{
                'error': f"Directory not found: {directory_path}"
            }]
        
        try:
            audio_extensions = {'.mp3', '.wav', '.ogg', '.flac', '.m4a'}
            files = [f for f in os.listdir(directory_path) 
                    if os.path.splitext(f)[1].lower() in audio_extensions]
            
            for filename in sorted(files):
                file_result = AudioFileHandler.parse_and_map(filename)
                results.append(file_result)
        
        except Exception as e:
            results.append({
                'error': f"Error processing directory: {str(e)}"
            })
        
        return results
