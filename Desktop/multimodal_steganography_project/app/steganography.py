# app/steganography.py
from PIL import Image
import wave
import librosa
import numpy as np

# Image Steganography
def hide_message_in_image(image, message):
    img = Image.open(image)
    message = message.encode()
    img = img.convert("RGB")
    pixels = img.load()

    bin_message = ''.join(format(byte, '08b') for byte in message)
    data_index = 0

    for i in range(img.width):
        for j in range(img.height):
            if data_index < len(bin_message):
                pixel = list(pixels[i, j])
                for k in range(3):
                    if data_index < len(bin_message):
                        pixel[k] = pixel[k] & ~1 | int(bin_message[data_index])
                        data_index += 1
                pixels[i, j] = tuple(pixel)

    hidden_image_path = 'static/hidden_image.png'
    img.save(hidden_image_path)
    return hidden_image_path

def extract_message_from_image(image):
    img = Image.open(image)
    pixels = img.load()
    bin_message = ""

    for i in range(img.width):
        for j in range(img.height):
            pixel = pixels[i, j]
            for k in range(3):
                bin_message += str(pixel[k] & 1)
                if len(bin_message) % 8 == 0 and bin_message[-8:] == '00000000':
                    return bytes([int(bin_message[i:i+8], 2) for i in range(0, len(bin_message)-8, 8)]).decode()

    return "No message found"

# Audio Steganography (using wave and librosa)
def hide_message_in_audio(audio, message):
    y, sr = librosa.load(audio, sr=None)
    message = message.encode()

    # Convert message to binary and embed in audio signal (simple LSB method)
    bin_message = ''.join(format(byte, '08b') for byte in message)
    audio_signal = np.copy(y)
    data_index = 0

    for i in range(len(audio_signal)):
        if data_index < len(bin_message):
            audio_signal[i] = (audio_signal[i] & ~1) | int(bin_message[data_index])
            data_index += 1

    hidden_audio_path = 'static/hidden_audio.wav'
    import soundfile as sf
    sf.write(hidden_audio_path, audio_signal, sr)
    return hidden_audio_path

def extract_message_from_audio(audio):
    y, sr = librosa.load(audio, sr=None)
    bin_message = ""

    for i in range(len(y)):
        bin_message += str(int(y[i] & 1))
        if len(bin_message) % 8 == 0 and bin_message[-8:] == '00000000':
            return bytes([int(bin_message[i:i+8], 2) for i in range(0, len(bin_message)-8, 8)]).decode()

    return "No message found"

# Text Steganography (using zero-width characters)
def hide_message_in_text(message):
    # Convert message to binary
    binary_message = ''.join(format(ord(char), '08b') for char in message)

    # Use zero-width characters for steganography
    # Zero-width space for 0, zero-width non-joiner for 1
    zwsp = '\u200B'  # Zero-width space
    zwnj = '\u200C'  # Zero-width non-joiner

    # Create a cover text with hidden message
    cover_text = "This is a normal looking text. "

    # Hide the binary message using zero-width characters
    for bit in binary_message:
        if bit == '0':
            cover_text += zwsp
        else:
            cover_text += zwnj

    cover_text += "Nothing suspicious here."
    return cover_text

def extract_message_from_text(hidden_message):
    # Extract zero-width characters
    zwsp = '\u200B'  # Zero-width space
    zwnj = '\u200C'  # Zero-width non-joiner

    binary = ''
    for char in hidden_message:
        if char == zwsp:
            binary += '0'
        elif char == zwnj:
            binary += '1'

    # Convert binary back to text
    message = ''
    for i in range(0, len(binary), 8):
        if i + 8 <= len(binary):
            byte = binary[i:i+8]
            message += chr(int(byte, 2))

    return message
