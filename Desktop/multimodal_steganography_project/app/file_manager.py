# app/file_manager.py
"""
File management module for the multimodal steganography application.

This module provides functions for handling file uploads, saving files,
and managing the static directory.
"""

import os
import uuid
from datetime import datetime
from werkzeug.utils import secure_filename

# Constants
UPLOAD_FOLDER = 'static/uploads'
OUTPUT_FOLDER = 'static/output'
ALLOWED_IMAGE_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}
ALLOWED_AUDIO_EXTENSIONS = {'wav', 'mp3', 'ogg'}

def init_app():
    """
    Initialize the file management system.
    
    Creates the necessary directories if they don't exist.
    """
    os.makedirs(UPLOAD_FOLDER, exist_ok=True)
    os.makedirs(OUTPUT_FOLDER, exist_ok=True)
    
    # Create subdirectories for different file types
    os.makedirs(os.path.join(UPLOAD_FOLDER, 'images'), exist_ok=True)
    os.makedirs(os.path.join(UPLOAD_FOLDER, 'audio'), exist_ok=True)
    os.makedirs(os.path.join(OUTPUT_FOLDER, 'images'), exist_ok=True)
    os.makedirs(os.path.join(OUTPUT_FOLDER, 'audio'), exist_ok=True)
    os.makedirs(os.path.join(OUTPUT_FOLDER, 'text'), exist_ok=True)

def allowed_image_file(filename):
    """
    Check if the uploaded file is an allowed image type.
    
    Args:
        filename: The name of the uploaded file
        
    Returns:
        bool: True if the file is allowed, False otherwise
    """
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_IMAGE_EXTENSIONS

def allowed_audio_file(filename):
    """
    Check if the uploaded file is an allowed audio type.
    
    Args:
        filename: The name of the uploaded file
        
    Returns:
        bool: True if the file is allowed, False otherwise
    """
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_AUDIO_EXTENSIONS

def save_uploaded_file(file, file_type):
    """
    Save an uploaded file to the appropriate directory.
    
    Args:
        file: The uploaded file object
        file_type: The type of file ('image' or 'audio')
        
    Returns:
        str: The path to the saved file
    """
    if file and file.filename:
        # Generate a unique filename
        filename = secure_filename(file.filename)
        unique_filename = f"{datetime.now().strftime('%Y%m%d%H%M%S')}_{uuid.uuid4().hex[:8]}_{filename}"
        
        # Determine the appropriate directory
        if file_type == 'image':
            directory = os.path.join(UPLOAD_FOLDER, 'images')
        elif file_type == 'audio':
            directory = os.path.join(UPLOAD_FOLDER, 'audio')
        else:
            raise ValueError(f"Unsupported file type: {file_type}")
        
        # Save the file
        file_path = os.path.join(directory, unique_filename)
        file.save(file_path)
        
        return file_path
    
    return None

def get_output_path(file_type, extension):
    """
    Generate a path for an output file.
    
    Args:
        file_type: The type of file ('image', 'audio', or 'text')
        extension: The file extension (without the dot)
        
    Returns:
        str: The path to the output file
    """
    # Generate a unique filename
    unique_filename = f"{datetime.now().strftime('%Y%m%d%H%M%S')}_{uuid.uuid4().hex[:8]}.{extension}"
    
    # Determine the appropriate directory
    if file_type == 'image':
        directory = os.path.join(OUTPUT_FOLDER, 'images')
    elif file_type == 'audio':
        directory = os.path.join(OUTPUT_FOLDER, 'audio')
    elif file_type == 'text':
        directory = os.path.join(OUTPUT_FOLDER, 'text')
    else:
        raise ValueError(f"Unsupported file type: {file_type}")
    
    # Return the full path
    return os.path.join(directory, unique_filename)

def cleanup_old_files(max_age_days=7):
    """
    Clean up files older than the specified age.
    
    Args:
        max_age_days: Maximum age of files in days
    """
    # Get the current time
    now = datetime.now()
    
    # Walk through the upload and output directories
    for root_dir in [UPLOAD_FOLDER, OUTPUT_FOLDER]:
        for root, dirs, files in os.walk(root_dir):
            for file in files:
                file_path = os.path.join(root, file)
                
                # Get the file's modification time
                file_time = datetime.fromtimestamp(os.path.getmtime(file_path))
                
                # Calculate the age of the file in days
                age_days = (now - file_time).days
                
                # Delete the file if it's older than the maximum age
                if age_days > max_age_days:
                    try:
                        os.remove(file_path)
                        print(f"Deleted old file: {file_path}")
                    except Exception as e:
                        print(f"Error deleting file {file_path}: {str(e)}")
