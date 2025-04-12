# app/views.py
"""
Views module for the multimodal steganography application.

This module defines the routes and controllers for the web application.
It handles user requests, processes form data, and returns responses.
"""

import os
from flask import Blueprint, render_template, request, jsonify, redirect, url_for
from app.encryption import encrypt_message, decrypt_message
from app.steganography import hide_message_in_image, extract_message_from_image, hide_message_in_audio, extract_message_from_audio, hide_message_in_text, extract_message_from_text

# Create a Blueprint for the views
views = Blueprint('views', __name__)

# Allowed file extensions
ALLOWED_IMAGE_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}
ALLOWED_AUDIO_EXTENSIONS = {'wav', 'mp3', 'ogg'}

# Helper functions
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

# Routes
@views.route('/')
def home():
    """
    Render the home page.

    Returns:
        The rendered index.html template
    """
    return render_template('index.html')

# Route for encryption
@views.route('/encrypt', methods=['POST'])
def encrypt():
    """
    Encrypt a message.

    Returns:
        JSON response with the encrypted message
    """
    try:
        # Get form data
        message = request.form.get('message', '')

        # Validate input
        if not message:
            return jsonify({'error': 'No message provided'}), 400

        # Encrypt the message
        encrypted_message = encrypt_message(message)

        # Render the result template with the encrypted message
        return render_template('result.html', encrypted_message=encrypted_message.hex())
    except Exception as e:
        # Log the error (in a production app)
        print(f"Encryption error: {str(e)}")

        # Render the result template with the error
        return render_template('result.html', error=f"Failed to encrypt message: {str(e)}"), 500

# Route for decryption
@views.route('/decrypt', methods=['POST'])
def decrypt():
    """
    Decrypt a message.

    Returns:
        JSON response with the decrypted message
    """
    try:
        # Get form data
        encrypted_message = request.form.get('encrypted_message', '')

        # Validate input
        if not encrypted_message:
            return jsonify({'error': 'No encrypted message provided'}), 400

        # Convert hex string to bytes
        try:
            encrypted_bytes = bytes.fromhex(encrypted_message)
        except ValueError:
            return jsonify({'error': 'Invalid encrypted message format'}), 400

        # Decrypt the message
        try:
            decrypted_message = decrypt_message(encrypted_bytes)

            # Render the result template with the decrypted message
            return render_template('result.html', decrypted_message=decrypted_message)
        except Exception as e:
            # Handle decryption errors (likely wrong password)
            return render_template('result.html', password_error="Incorrect password. Please try again with the correct password.")
    except Exception as e:
        # Log the error (in a production app)
        print(f"Decryption error: {str(e)}")

        # Render the result template with the error
        return render_template('result.html', error=f"Failed to decrypt message: {str(e)}"), 500

# Route for image steganography (Hide message in image)
@views.route('/hide_image_message', methods=['POST'])
def hide_image_message():
    """
    Hide a message in an image.

    Returns:
        JSON response with the path to the image with hidden message
    """
    try:
        # Check if the post request has the file part
        if 'image' not in request.files:
            return jsonify({'error': 'No image file provided'}), 400

        # Get form data
        image = request.files['image']
        message = request.form.get('message', '')
        password = request.form.get('password', None)

        # Validate input
        if image.filename == '':
            return jsonify({'error': 'No image selected'}), 400

        if not message:
            return jsonify({'error': 'No message provided'}), 400

        if not allowed_image_file(image.filename):
            return jsonify({'error': 'File type not allowed'}), 400

        # Create the static directory if it doesn't exist
        os.makedirs('static', exist_ok=True)

        # Hide the message in the image
        hidden_image_path = hide_message_in_image(image, message, password)

        # Render the result template with the image
        return render_template('result.html', hidden_image=hidden_image_path)
    except Exception as e:
        # Log the error (in a production app)
        print(f"Image hiding error: {str(e)}")

        # Render the result template with the error
        return render_template('result.html', error=f"Failed to hide message in image: {str(e)}"), 500

@views.route('/extract_image_message', methods=['POST'])
def extract_image_message():
    """
    Extract a message from an image.

    Returns:
        JSON response with the extracted message
    """
    try:
        # Check if the post request has the file part
        if 'image' not in request.files:
            return jsonify({'error': 'No image file provided'}), 400

        # Get form data
        image = request.files['image']
        password = request.form.get('password', None)

        # Validate input
        if image.filename == '':
            return jsonify({'error': 'No image selected'}), 400

        if not allowed_image_file(image.filename):
            return jsonify({'error': 'File type not allowed'}), 400

        # Extract the message from the image
        try:
            hidden_message = extract_message_from_image(image, password)

            # Render the result template with the extracted message
            return render_template('result.html', hidden_message=hidden_message)
        except ValueError as e:
            # Check if it's a password error
            if "password" in str(e).lower():
                # Render the result template with the password error
                return render_template('result.html', password_error=str(e))
            # Re-raise other errors
            raise
    except Exception as e:
        # Log the error (in a production app)
        print(f"Image extraction error: {str(e)}")

        # Render the result template with the error
        return render_template('result.html', error=f"Failed to extract message from image: {str(e)}"), 500

# Route for audio steganography (Hide message in audio)
@views.route('/hide_audio_message', methods=['POST'])
def hide_audio_message():
    """
    Hide a message in an audio file.

    Returns:
        JSON response with the path to the audio with hidden message
    """
    try:
        # Check if the post request has the file part
        if 'audio' not in request.files:
            return jsonify({'error': 'No audio file provided'}), 400

        # Get form data
        audio = request.files['audio']
        message = request.form.get('message', '')
        password = request.form.get('password', None)

        # Validate input
        if audio.filename == '':
            return jsonify({'error': 'No audio selected'}), 400

        if not message:
            return jsonify({'error': 'No message provided'}), 400

        if not allowed_audio_file(audio.filename):
            return jsonify({'error': 'File type not allowed'}), 400

        # Create the static directory if it doesn't exist
        os.makedirs('static', exist_ok=True)

        # Hide the message in the audio
        hidden_audio_path = hide_message_in_audio(audio, message, password)

        # Render the result template with the audio
        return render_template('result.html', hidden_audio=hidden_audio_path)
    except Exception as e:
        # Log the error (in a production app)
        print(f"Audio hiding error: {str(e)}")

        # Render the result template with the error
        return render_template('result.html', error=f"Failed to hide message in audio: {str(e)}"), 500

@views.route('/extract_audio_message', methods=['POST'])
def extract_audio_message():
    """
    Extract a message from an audio file.

    Returns:
        JSON response with the extracted message
    """
    try:
        # Check if the post request has the file part
        if 'audio' not in request.files:
            return jsonify({'error': 'No audio file provided'}), 400

        # Get form data
        audio = request.files['audio']
        password = request.form.get('password', None)

        # Validate input
        if audio.filename == '':
            return jsonify({'error': 'No audio selected'}), 400

        if not allowed_audio_file(audio.filename):
            return jsonify({'error': 'File type not allowed'}), 400

        # Extract the message from the audio
        try:
            hidden_message = extract_message_from_audio(audio, password)

            # Return the extracted message
            return render_template('result.html', hidden_message=hidden_message)
        except ValueError as e:
            # Check if it's a password error
            if "password" in str(e).lower():
                # Render the result template with the password error
                return render_template('result.html', password_error=str(e))
            # Re-raise other errors
            raise
    except Exception as e:
        # Log the error (in a production app)
        print(f"Audio extraction error: {str(e)}")

        # Render the result template with the error
        return render_template('result.html', error=f"Failed to extract message from audio: {str(e)}"), 500

# Route for text steganography (Hide message in text)
@views.route('/hide_text_message', methods=['POST'])
def hide_text_message():
    """
    Hide a message in text.

    Returns:
        JSON response with the text containing the hidden message
    """
    try:
        # Get form data
        message = request.form.get('message', '')
        cover_text = request.form.get('cover_text', None)
        password = request.form.get('password', None)

        # Validate input
        if not message:
            return jsonify({'error': 'No message provided'}), 400

        # Hide the message in text
        hidden_text = hide_message_in_text(message, password, cover_text)

        # Render the result template with the hidden text
        return render_template('result.html', hidden_text=hidden_text)
    except Exception as e:
        # Log the error (in a production app)
        print(f"Text hiding error: {str(e)}")

        # Render the result template with the error
        return render_template('result.html', error=f"Failed to hide message in text: {str(e)}"), 500

@views.route('/extract_text_message', methods=['POST'])
def extract_text_message():
    """
    Extract a message from text.

    Returns:
        JSON response with the extracted message
    """
    try:
        # Get form data
        hidden_message = request.form.get('hidden_message', '')
        password = request.form.get('password', None)

        # Validate input
        if not hidden_message:
            return jsonify({'error': 'No text provided'}), 400

        # Extract the message from the text
        try:
            extracted_message = extract_message_from_text(hidden_message, password)

            # Render the result template with the extracted message
            return render_template('result.html', hidden_message=extracted_message)
        except ValueError as e:
            # Check if it's a password error
            if "password" in str(e).lower():
                # Render the result template with the password error
                return render_template('result.html', password_error=str(e))
            # Re-raise other errors
            raise
    except Exception as e:
        # Log the error (in a production app)
        print(f"Text extraction error: {str(e)}")

        # Render the result template with the error
        return render_template('result.html', error=f"Failed to extract message from text: {str(e)}"), 500