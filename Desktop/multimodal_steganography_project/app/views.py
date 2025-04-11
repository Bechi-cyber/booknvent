# app/views.py
from flask import Blueprint, render_template, request, jsonify
from app.encryption import encrypt_message, decrypt_message
from app.steganography import hide_message_in_image, extract_message_from_image, hide_message_in_audio, extract_message_from_audio, hide_message_in_text, extract_message_from_text

views = Blueprint('views', __name__)

@views.route('/')
def home():
    return render_template('index.html')

# Route for encryption
@views.route('/encrypt', methods=['POST'])
def encrypt():
    message = request.form['message']
    encrypted_message = encrypt_message(message)
    return jsonify({'encrypted_message': encrypted_message.hex()})

# Route for decryption
@views.route('/decrypt', methods=['POST'])
def decrypt():
    encrypted_message = bytes.fromhex(request.form['encrypted_message'])
    decrypted_message = decrypt_message(encrypted_message)
    return jsonify({'decrypted_message': decrypted_message})

# Route for image steganography (Hide message in image)
@views.route('/hide_image_message', methods=['POST'])
def hide_image_message():
    image = request.files['image']
    message = request.form['message']
    hidden_image_path = hide_message_in_image(image, message)
    return jsonify({'hidden_image': hidden_image_path})

@views.route('/extract_image_message', methods=['POST'])
def extract_image_message():
    image = request.files['image']
    hidden_message = extract_message_from_image(image)
    return jsonify({'hidden_message': hidden_message})

# Route for audio steganography (Hide message in audio)
@views.route('/hide_audio_message', methods=['POST'])
def hide_audio_message():
    audio = request.files['audio']
    message = request.form['message']
    hidden_audio_path = hide_message_in_audio(audio, message)
    return jsonify({'hidden_audio': hidden_audio_path})

@views.route('/extract_audio_message', methods=['POST'])
def extract_audio_message():
    audio = request.files['audio']
    hidden_message = extract_message_from_audio(audio)
    return jsonify({'hidden_message': hidden_message})

# Route for text steganography (Hide message in text)
@views.route('/hide_text_message', methods=['POST'])
def hide_text_message():
    message = request.form['message']
    hidden_text = hide_message_in_text(message)
    return jsonify({'hidden_text': hidden_text})

@views.route('/extract_text_message', methods=['POST'])
def extract_text_message():
    hidden_message = extract_message_from_text(request.form['hidden_message'])
    return jsonify({'hidden_message': hidden_message})