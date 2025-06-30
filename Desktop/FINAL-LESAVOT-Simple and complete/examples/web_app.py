from flask import Flask, render_template, request, send_file, redirect, url_for, session, flash
import os
import io
import base64
from PIL import Image
import numpy as np
import uuid
import scipy.io.wavfile as wavfile
from werkzeug.security import generate_password_hash, check_password_hash
import json
from functools import wraps
from datetime import datetime

app = Flask(__name__, static_folder='static')
app.config['UPLOAD_FOLDER'] = 'examples/data/uploads'
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max upload size
app.secret_key = 'lesavot_secret_key_for_session'  # Secret key for session

# Create necessary folders
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
os.makedirs('examples/data/users', exist_ok=True)

# User database file
USER_DB_FILE = 'examples/data/users/users.json'

# Initialize user database if it doesn't exist
if not os.path.exists(USER_DB_FILE):
    with open(USER_DB_FILE, 'w') as f:
        json.dump({}, f)

# User authentication functions
def get_users():
    try:
        with open(USER_DB_FILE, 'r') as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return {}

def save_users(users):
    with open(USER_DB_FILE, 'w') as f:
        json.dump(users, f)

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'username' not in session:
            flash('Please log in to access this page', 'error')
            return redirect(url_for('login'))
        return f(*args, **kwargs)
    return decorated_function

class ImageSteganography:
    """
    Implements LSB (Least Significant Bit) steganography for images.
    """

    def __init__(self):
        pass

    def embed(self, image_path, message, output_path):
        """
        Embeds a message in an image using LSB steganography.
        """
        try:
            img = Image.open(image_path)
            width, height = img.size
            img_array = np.array(img)

            binary_message = ''.join(format(ord(char), '08b') for char in message)
            binary_message += '00000000'

            if len(binary_message) > width * height * 3:
                print("Error: Message too large for the image")
                return False

            idx = 0
            for i in range(height):
                for j in range(width):
                    for k in range(3):  # RGB channels
                        if idx < len(binary_message):
                            img_array[i, j, k] = (img_array[i, j, k] & ~1) | int(binary_message[idx])
                            idx += 1
                        else:
                            break
                    if idx >= len(binary_message):
                        break
                if idx >= len(binary_message):
                    break

            output_img = Image.fromarray(img_array)
            output_img.save(output_path)
            return True

        except Exception as e:
            print(f"Error embedding message: {e}")
            return False

    def extract(self, image_path):
        """
        Extracts a hidden message from an image.
        """
        try:
            img = Image.open(image_path)
            width, height = img.size
            img_array = np.array(img)

            binary_message = ""
            for i in range(height):
                for j in range(width):
                    for k in range(3):  # RGB channels
                        binary_message += str(img_array[i, j, k] & 1)

                        if len(binary_message) % 8 == 0:
                            if binary_message[-8:] == "00000000":
                                message = ""
                                for idx in range(0, len(binary_message) - 8, 8):
                                    byte = binary_message[idx:idx+8]
                                    message += chr(int(byte, 2))
                                return message

            return "No hidden message found"

        except Exception as e:
            print(f"Error extracting message: {e}")
            return None

class TextSteganography:
    """
    Implements whitespace steganography for text files.
    """

    def __init__(self):
        pass

    def embed(self, text_path, message, output_path):
        """
        Embeds a message in a text file using whitespace steganography.
        """
        try:
            with open(text_path, 'r', encoding='utf-8') as file:
                text = file.read()

            binary_message = ''.join(format(ord(char), '08b') for char in message)
            binary_message += '00000000'  # Add terminator

            words = text.split()

            if len(binary_message) > len(words) - 1:
                print("Error: Message too large for the text file")
                return False

            stego_text = words[0]
            for i in range(len(binary_message)):
                if i < len(words) - 1:
                    if binary_message[i] == '1':
                        stego_text += "  " + words[i + 1]
                    else:
                        stego_text += " " + words[i + 1]

            if len(binary_message) < len(words) - 1:
                for i in range(len(binary_message) + 1, len(words)):
                    stego_text += " " + words[i]

            with open(output_path, 'w', encoding='utf-8') as file:
                file.write(stego_text)

            return True

        except Exception as e:
            print(f"Error embedding message in text: {e}")
            return False

    def extract(self, text_path):
        """
        Extracts a hidden message from a text file.
        """
        try:
            with open(text_path, 'r', encoding='utf-8') as file:
                text = file.read()

            binary_message = ""

            i = 0
            while i < len(text):
                if text[i] == ' ':
                    space_count = 0
                    while i < len(text) and text[i] == ' ':
                        space_count += 1
                        i += 1

                    if space_count == 2:
                        binary_message += '1'
                    else:
                        binary_message += '0'
                else:
                    i += 1

            message = ""
            for i in range(0, len(binary_message), 8):
                if i + 8 <= len(binary_message):
                    byte = binary_message[i:i+8]
                    if byte == "00000000":
                        break
                    message += chr(int(byte, 2))

            return message

        except Exception as e:
            print(f"Error extracting message from text: {e}")
            return None

class AudioSteganography:
    """
    Implements phase encoding steganography for audio files.
    """

    def __init__(self):
        pass

    def embed(self, audio_path, message, output_path):
        """
        Embeds a message in an audio file using phase encoding.
        """
        try:
            sample_rate, audio_data = wavfile.read(audio_path)
            audio_data = audio_data.astype(np.float64)

            binary_message = ''.join(format(ord(char), '08b') for char in message)
            binary_message += '00000000'  # Add terminator

            segment_length = 1024
            if len(binary_message) > (len(audio_data) // segment_length):
                print("Error: Message too large for the audio file")
                return False

            for i in range(len(binary_message)):
                if i >= len(audio_data) // segment_length:
                    break

                segment = audio_data[i * segment_length:(i + 1) * segment_length]

                spectrum = np.fft.fft(segment)
                magnitude = np.abs(spectrum)
                phase = np.angle(spectrum)

                if binary_message[i] == '1':
                    phase[1:segment_length//2] += np.pi/2

                modified_spectrum = magnitude * np.exp(1j * phase)
                modified_segment = np.real(np.fft.ifft(modified_spectrum))

                audio_data[i * segment_length:(i + 1) * segment_length] = modified_segment

            audio_data = np.int16(audio_data / np.max(np.abs(audio_data)) * 32767)

            wavfile.write(output_path, sample_rate, audio_data)
            return True

        except Exception as e:
            print(f"Error embedding message in audio: {e}")
            return False

    def extract(self, audio_path):
        """
        Extracts a hidden message from an audio file.
        """
        try:
            sample_rate, audio_data = wavfile.read(audio_path)
            audio_data = audio_data.astype(np.float64)

            binary_message = ""
            segment_length = 1024

            for i in range(len(audio_data) // segment_length):
                segment = audio_data[i * segment_length:(i + 1) * segment_length]

                spectrum = np.fft.fft(segment)
                phase = np.angle(spectrum)

                phase_diff = np.mean(phase[1:segment_length//2])
                if phase_diff > 0:
                    binary_message += '1'
                else:
                    binary_message += '0'

                if len(binary_message) % 8 == 0 and len(binary_message) >= 8:
                    if binary_message[-8:] == "00000000":
                        message = ""
                        for idx in range(0, len(binary_message) - 8, 8):
                            byte = binary_message[idx:idx+8]
                            message += chr(int(byte, 2))
                        return message

            return "No hidden message found"

        except Exception as e:
            print(f"Error extracting message from audio: {e}")
            return None

# Authentication routes
@app.route('/signup', methods=['GET', 'POST'])
def signup():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        confirm_password = request.form['confirm_password']

        users = get_users()

        # Validate input
        if username in users:
            flash('Username already exists', 'error')
            return render_template('signup.html')

        if password != confirm_password:
            flash('Passwords do not match', 'error')
            return render_template('signup.html')

        # Add new user
        users[username] = {
            'password': generate_password_hash(password),
            'files': []
        }
        save_users(users)

        flash('Account created successfully! Please log in.', 'success')
        return redirect(url_for('login'))

    return render_template('signup.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']

        users = get_users()

        if username in users and check_password_hash(users[username]['password'], password):
            session['username'] = username
            flash('Logged in successfully!', 'success')
            return redirect(url_for('dashboard'))
        else:
            flash('Invalid username or password', 'error')

    return render_template('login.html')

@app.route('/logout')
def logout():
    session.pop('username', None)
    flash('Logged out successfully', 'success')
    return redirect(url_for('index'))

# Main routes
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/dashboard')
@login_required
def dashboard():
    return render_template('dashboard.html', username=session.get('username'))

# Image steganography routes
@app.route('/image')
@login_required
def image():
    return render_template('image.html')

@app.route('/image/embed', methods=['POST'])
@login_required
def image_embed():
    if 'file' not in request.files:
        flash('No file selected', 'error')
        return redirect(url_for('image'))

    file = request.files['file']
    message = request.form['message']

    if file.filename == '':
        flash('No file selected', 'error')
        return redirect(url_for('image'))

    if file:
        # Generate unique filenames
        original_filename = str(uuid.uuid4()) + '.png'
        stego_filename = str(uuid.uuid4()) + '.png'

        original_path = os.path.join(app.config['UPLOAD_FOLDER'], original_filename)
        stego_path = os.path.join(app.config['UPLOAD_FOLDER'], stego_filename)

        # Save the uploaded file
        file.save(original_path)

        # Embed the message
        steg = ImageSteganography()
        success = steg.embed(original_path, message, stego_path)

        if success:
            # Read the stego image and convert to base64 for display
            with open(stego_path, 'rb') as f:
                stego_image = base64.b64encode(f.read()).decode('utf-8')

            # Add file to user's files
            users = get_users()
            users[session['username']]['files'].append({
                'type': 'image',
                'filename': stego_filename,
                'date': str(uuid.uuid1())
            })
            save_users(users)

            return render_template('image_result.html',
                                  stego_image=stego_image,
                                  stego_filename=stego_filename,
                                  message=message)
        else:
            flash('Failed to embed message. The message might be too large for the image.', 'error')
            return redirect(url_for('image'))

@app.route('/image/extract', methods=['POST'])
@login_required
def image_extract():
    if 'file' not in request.files:
        flash('No file selected', 'error')
        return redirect(url_for('image'))

    file = request.files['file']

    if file.filename == '':
        flash('No file selected', 'error')
        return redirect(url_for('image'))

    if file:
        # Generate unique filename
        filename = str(uuid.uuid4()) + '.png'
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)

        # Save the uploaded file
        file.save(file_path)

        # Extract the message
        steg = ImageSteganography()
        message = steg.extract(file_path)

        # Read the image and convert to base64 for display
        with open(file_path, 'rb') as f:
            image_data = base64.b64encode(f.read()).decode('utf-8')

        return render_template('image_extract_result.html',
                              image=image_data,
                              message=message)

# Text steganography routes
@app.route('/text')
@login_required
def text():
    return render_template('text.html')

@app.route('/text/embed', methods=['POST'])
@login_required
def text_embed():
    if 'file' not in request.files:
        flash('No file selected', 'error')
        return redirect(url_for('text'))

    file = request.files['file']
    message = request.form['message']

    if file.filename == '':
        flash('No file selected', 'error')
        return redirect(url_for('text'))

    if file:
        # Generate unique filenames
        original_filename = str(uuid.uuid4()) + '.txt'
        stego_filename = str(uuid.uuid4()) + '.txt'

        original_path = os.path.join(app.config['UPLOAD_FOLDER'], original_filename)
        stego_path = os.path.join(app.config['UPLOAD_FOLDER'], stego_filename)

        # Save the uploaded file
        file.save(original_path)

        # Embed the message
        steg = TextSteganography()
        success = steg.embed(original_path, message, stego_path)

        if success:
            # Read the stego text
            with open(stego_path, 'r', encoding='utf-8') as f:
                stego_text = f.read()

            # Add file to user's files
            users = get_users()
            users[session['username']]['files'].append({
                'type': 'text',
                'filename': stego_filename,
                'date': str(uuid.uuid1())
            })
            save_users(users)

            return render_template('text_result.html',
                                  stego_text=stego_text,
                                  stego_filename=stego_filename,
                                  message=message)
        else:
            flash('Failed to embed message. The message might be too large for the text file.', 'error')
            return redirect(url_for('text'))

@app.route('/text/extract', methods=['POST'])
@login_required
def text_extract():
    if 'file' not in request.files:
        flash('No file selected', 'error')
        return redirect(url_for('text'))

    file = request.files['file']

    if file.filename == '':
        flash('No file selected', 'error')
        return redirect(url_for('text'))

    if file:
        # Generate unique filename
        filename = str(uuid.uuid4()) + '.txt'
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)

        # Save the uploaded file
        file.save(file_path)

        # Extract the message
        steg = TextSteganography()
        message = steg.extract(file_path)

        # Read the text
        with open(file_path, 'r', encoding='utf-8') as f:
            text_data = f.read()

        return render_template('text_extract_result.html',
                              text=text_data,
                              message=message)

# Audio steganography routes
@app.route('/audio')
@login_required
def audio():
    return render_template('audio.html')

@app.route('/audio/embed', methods=['POST'])
@login_required
def audio_embed():
    if 'file' not in request.files:
        flash('No file selected', 'error')
        return redirect(url_for('audio'))

    file = request.files['file']
    message = request.form['message']

    if file.filename == '':
        flash('No file selected', 'error')
        return redirect(url_for('audio'))

    if file:
        # Generate unique filenames
        original_filename = str(uuid.uuid4()) + '.wav'
        stego_filename = str(uuid.uuid4()) + '.wav'

        original_path = os.path.join(app.config['UPLOAD_FOLDER'], original_filename)
        stego_path = os.path.join(app.config['UPLOAD_FOLDER'], stego_filename)

        # Save the uploaded file
        file.save(original_path)

        # Embed the message
        steg = AudioSteganography()
        success = steg.embed(original_path, message, stego_path)

        if success:
            # Add file to user's files
            users = get_users()
            users[session['username']]['files'].append({
                'type': 'audio',
                'filename': stego_filename,
                'date': str(uuid.uuid1())
            })
            save_users(users)

            return render_template('audio_result.html',
                                  stego_filename=stego_filename,
                                  message=message)
        else:
            flash('Failed to embed message. The message might be too large for the audio file.', 'error')
            return redirect(url_for('audio'))

@app.route('/audio/extract', methods=['POST'])
@login_required
def audio_extract():
    if 'file' not in request.files:
        flash('No file selected', 'error')
        return redirect(url_for('audio'))

    file = request.files['file']

    if file.filename == '':
        flash('No file selected', 'error')
        return redirect(url_for('audio'))

    if file:
        # Generate unique filename
        filename = str(uuid.uuid4()) + '.wav'
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)

        # Save the uploaded file
        file.save(file_path)

        # Extract the message
        steg = AudioSteganography()
        message = steg.extract(file_path)

        return render_template('audio_extract_result.html',
                              filename=filename,
                              message=message)

@app.route('/files')
@login_required
def files():
    users = get_users()
    user_files = users[session['username']]['files']
    return render_template('files.html', files=user_files)

@app.route('/download/<filename>')
@login_required
def download(filename):
    return send_file(os.path.join(app.config['UPLOAD_FOLDER'], filename), as_attachment=True)

if __name__ == '__main__':
    app.run(debug=True)
