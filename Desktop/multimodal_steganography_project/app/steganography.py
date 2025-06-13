# app/steganography.py
"""
Steganography module for hiding messages in different media types.

This module provides functions for hiding and extracting messages in/from:
- Images (using LSB technique with encryption and randomization)
- Audio (using phase encoding with encryption and randomization)
- Text (using invisible Unicode characters with encryption)
"""

# Standard library imports
import random
import hashlib
import os

# Third-party imports
from PIL import Image  # For image processing
import numpy as np     # For numerical operations
import librosa        # For audio processing
import soundfile as sf # For audio file operations

# Local imports
from app.encryption import encrypt_message, decrypt_message

def hide_message_in_image(image, message, password=None):
    """
    Enhanced image steganography with encryption and pseudo-random pixel selection.

    Args:
        image: The input image file
        message: The message to hide
        password: Optional password for additional security

    Returns:
        str: Path to the image with hidden message
    """
    # Open and prepare the image
    img = Image.open(image)
    width, height = img.size
    img = img.convert("RGB")
    pixels = img.load()

    # Add null terminator for extraction
    message = message + '\0'
    message_bytes = message.encode()

    # Encrypt the message if password is provided
    if password:
        # Use the encryption module to encrypt the message with the password
        print(f"DEBUG: Encrypting image message with password: {password}")
        message_bytes = encrypt_message(message, password=password)
        print(f"DEBUG: Encrypted image message length: {len(message_bytes)} bytes")

    # Convert to binary string
    bin_message = ''.join(format(byte, '08b') for byte in message_bytes)

    # Check if the image has enough capacity
    max_bits = width * height * 3  # 3 color channels per pixel
    if len(bin_message) > max_bits:
        raise ValueError(f"Message too large for this image. Max capacity: {max_bits//8} bytes")

    # Generate a pseudo-random sequence of pixel coordinates
    pixel_coords = []
    for i in range(width):
        for j in range(height):
            pixel_coords.append((i, j))

    # Shuffle the coordinates using a seed derived from the password or a default seed
    seed = int(hashlib.md5((password or "default").encode()).hexdigest(), 16) % 10000000
    random.seed(seed)
    random.shuffle(pixel_coords)

    # Hide the binary data in the image
    data_index = 0
    coord_index = 0

    while data_index < len(bin_message) and coord_index < len(pixel_coords):
        i, j = pixel_coords[coord_index]
        pixel = list(pixels[i, j])

        # Modify the least significant bits of each color channel
        for k in range(3):  # RGB channels
            if data_index < len(bin_message):
                # Clear the LSB and set it to the message bit
                pixel[k] = (pixel[k] & ~1) | int(bin_message[data_index])
                data_index += 1

        pixels[i, j] = tuple(pixel)
        coord_index += 1

    # Create directory if it doesn't exist
    os.makedirs('static', exist_ok=True)

    # Save the image with hidden message
    hidden_image_path = 'static/hidden_image.png'
    img.save(hidden_image_path, format='PNG')
    return hidden_image_path

def extract_message_from_image(image, password=None):
    """
    Extract a hidden message from an image.

    Args:
        image: The image file with hidden message
        password: Optional password used during hiding

    Returns:
        str: The extracted message
    """
    # Open and prepare the image
    img = Image.open(image)
    width, height = img.size
    img = img.convert("RGB")
    pixels = img.load()

    # Generate the same pseudo-random sequence of pixel coordinates
    pixel_coords = []
    for i in range(width):
        for j in range(height):
            pixel_coords.append((i, j))

    # Use the same seed for shuffling
    seed = int(hashlib.md5((password or "default").encode()).hexdigest(), 16) % 10000000
    random.seed(seed)
    random.shuffle(pixel_coords)

    # Extract the binary data
    binary_data = ''
    for i, j in pixel_coords:
        pixel = pixels[i, j]
        for k in range(3):  # RGB channels
            binary_data += str(pixel[k] & 1)  # Extract LSB
            # Stop if we have enough bits for a complete message with null terminator
            if len(binary_data) % 8 == 0 and len(binary_data) >= 8:
                # Check every 8 bits if we've reached the null terminator
                if len(binary_data) % 8 == 0:
                    # Convert binary to bytes
                    byte_data = bytearray()
                    for idx in range(0, len(binary_data), 8):
                        if idx + 8 <= len(binary_data):
                            byte = int(binary_data[idx:idx+8], 2)
                            byte_data.append(byte)

                    # Check if we've reached the null terminator
                    try:
                        if password:
                            # Try to decrypt if password was provided
                            try:
                                # Check if we have enough data for a potential message
                                if len(byte_data) >= 32:  # At least some minimal data to check
                                    print(f"DEBUG: Checking extracted data, length: {len(byte_data)} bytes")

                                    # Try to decrypt with the provided password
                                    try:
                                        # Pass the password to the decrypt_message function
                                        decrypted = decrypt_message(bytes(byte_data), password=password)
                                        print(f"DEBUG: Image decryption successful, result: {decrypted[:50] if len(decrypted) > 50 else decrypted}")

                                        # If we successfully decrypted, return the result
                                        if '\0' in decrypted:
                                            return decrypted.split('\0')[0]
                                        return decrypted  # Return even if no null terminator is found
                                    except Exception as decrypt_error:
                                        # If we get a specific error about password protection, raise it
                                        if "password-protected" in str(decrypt_error).lower():
                                            raise ValueError("This image contains an encrypted message. Please provide a password.")
                                        elif "incorrect password" in str(decrypt_error).lower() and len(byte_data) >= 48:
                                            # If we have enough data and get a password error, it's likely the wrong password
                                            raise ValueError("Incorrect password. Please try again with the correct password.")
                                        # Otherwise, continue extracting more data
                                        print(f"DEBUG: Decryption attempt failed, continuing extraction: {str(decrypt_error)}")
                                else:
                                    # Continue extracting more data
                                    print(f"DEBUG: Not enough data yet for decryption, continuing extraction")
                            except Exception as e:
                                print(f"DEBUG: Image decryption failed: {str(e)}")
                                # If we have enough data but decryption fails, it's likely a wrong password
                                if len(byte_data) >= 48:  # Reasonable size for an encrypted message
                                    raise ValueError("Incorrect password. Please try again with the correct password.")
                                # Otherwise continue extracting
                        else:
                            # Try to decode without decryption
                            text = byte_data.decode('utf-8', errors='ignore')
                            if '\0' in text:
                                return text.split('\0')[0]
                    except ValueError as e:
                        # Re-raise password errors
                        if "password" in str(e).lower():
                            raise
                        # Continue extracting for other errors
                        pass

    # If we've extracted all bits but found no terminator, try to decode the whole message
    print(f"DEBUG: Attempting final extraction with {len(byte_data)} bytes of data")
    try:
        if password:
            # Try to decrypt the entire message with the provided password
            try:
                print(f"DEBUG: Attempting final decryption with password")
                decrypted = decrypt_message(bytes(byte_data), password=password)
                print(f"DEBUG: Final decryption successful: {decrypted[:50] if len(decrypted) > 50 else decrypted}")
                return decrypted.rstrip('\0')
            except Exception as decrypt_error:
                print(f"DEBUG: Final decryption failed: {str(decrypt_error)}")
                # Check if it's a password-related error
                if "password" in str(decrypt_error).lower():
                    raise ValueError("Incorrect password. Please try again with the correct password.")
                # If not a password error but we have enough data, it might be corrupted
                if len(byte_data) >= 48:
                    raise ValueError("The encrypted message appears to be corrupted or incomplete.")
                # Otherwise, try to decode as plain text as a fallback
                print("DEBUG: Trying to decode as plain text as fallback")

        # Try to decode the entire message as plain text
        text = byte_data.decode('utf-8', errors='ignore')
        # Check if the decoded text looks meaningful
        if any(c.isalpha() for c in text[:20]) and '\0' in text:
            return text.split('\0')[0]
        elif any(c.isalpha() for c in text[:20]):
            return text.rstrip('\0')
        else:
            return "No readable message found in this image."
    except Exception as e:
        print(f"DEBUG: Final extraction failed: {str(e)}")
        if "password" in str(e).lower():
            raise ValueError("Incorrect password. Please try again with the correct password.")
        return "No valid message found"

# Audio Steganography (using librosa and soundfile)
def hide_message_in_audio(audio, message, password=None):
    """
    Enhanced audio steganography with encryption and improved embedding.

    Args:
        audio: The input audio file
        message: The message to hide
        password: Optional password for additional security

    Returns:
        str: Path to the audio with hidden message
    """
    # Load the audio file
    y, sr = librosa.load(audio, sr=None)

    # Add null terminator for extraction
    message = message + '\0'
    message_bytes = message.encode()

    # Encrypt the message if password is provided
    if password:
        # Use the encryption module to encrypt the message with the password
        print(f"DEBUG: Encrypting audio message with password: {password}")
        message_bytes = encrypt_message(message, password=password)
        print(f"DEBUG: Encrypted audio message length: {len(message_bytes)} bytes")

    # Convert message to binary
    bin_message = ''.join(format(byte, '08b') for byte in message_bytes)

    # Check if the audio has enough capacity
    if len(bin_message) > len(y):
        raise ValueError(f"Message too large for this audio. Max capacity: {len(y)//8} bytes")

    # Create a copy of the audio signal
    audio_signal = np.copy(y)

    # Use a pseudo-random sequence for embedding if password is provided
    if password:
        # Generate indices based on password
        seed = int(hashlib.md5(password.encode()).hexdigest(), 16) % 10000000
        random.seed(seed)
        indices = list(range(len(audio_signal)))
        random.shuffle(indices)
        indices = indices[:len(bin_message)]
        indices.sort()  # Sort to maintain audio quality
    else:
        # Use sequential indices
        indices = list(range(len(bin_message)))

    # Embed the message bits
    for i, data_index in enumerate(indices):
        if i < len(bin_message):
            # Use phase encoding for better imperceptibility
            # Modify the least significant bit of the sample
            audio_signal[data_index] = (audio_signal[data_index] & ~0.001) | (float(int(bin_message[i])) * 0.001)

    # Create directory if it doesn't exist
    os.makedirs('static', exist_ok=True)

    # Save the audio with hidden message
    hidden_audio_path = 'static/hidden_audio.wav'
    sf.write(hidden_audio_path, audio_signal, sr)
    return hidden_audio_path

def extract_message_from_audio(audio, password=None):
    """
    Extract a hidden message from an audio file.

    Args:
        audio: The audio file with hidden message
        password: Optional password used during hiding

    Returns:
        str: The extracted message
    """
    # Load the audio file
    y, _ = librosa.load(audio, sr=None)  # Discard sample rate as we don't need it

    # Use the same pseudo-random sequence for extraction if password is provided
    if password:
        # Generate indices based on password
        seed = int(hashlib.md5(password.encode()).hexdigest(), 16) % 10000000
        random.seed(seed)
        indices = list(range(len(y)))
        random.shuffle(indices)
        # We don't know the exact length, so use a reasonable number of samples
        max_bits = min(len(y), 100000)  # Limit to prevent excessive processing
        indices = indices[:max_bits]
        indices.sort()  # Sort to maintain the correct order
    else:
        # Use sequential indices
        indices = list(range(min(len(y), 100000)))

    # Extract the binary data
    binary_data = ''
    for i in indices:
        # Extract the least significant bit
        bit = '1' if (y[i] % 0.002) > 0.001 else '0'
        binary_data += bit

        # Check for null terminator every 8 bits
        if len(binary_data) % 8 == 0 and len(binary_data) >= 8:
            # Convert binary to bytes
            byte_data = bytearray()
            for j in range(0, len(binary_data), 8):
                if j + 8 <= len(binary_data):
                    byte = int(binary_data[j:j+8], 2)
                    byte_data.append(byte)

            # Try to decode and check for null terminator
            try:
                if password:
                    # Try to decrypt if password was provided
                    try:
                        # Pass the password to the decrypt_message function
                        decrypted = decrypt_message(bytes(byte_data), password=password)
                        print(f"DEBUG: Audio decryption successful, result: {decrypted[:50] if len(decrypted) > 50 else decrypted}")
                        if '\0' in decrypted:
                            return decrypted.split('\0')[0]
                        return decrypted  # Return even if no null terminator is found
                    except Exception as e:
                        print(f"DEBUG: Audio decryption failed: {str(e)}")
                        # If we have enough data but decryption fails, it's likely a wrong password
                        if len(byte_data) > 32:  # Reasonable size for an encrypted message
                            raise ValueError("Incorrect password. Please try again with the correct password.")
                        # Otherwise continue extracting
                else:
                    # Try to decode without decryption
                    text = byte_data.decode('utf-8', errors='ignore')
                    if '\0' in text:
                        return text.split('\0')[0]
            except ValueError as e:
                # Re-raise password errors
                if "password" in str(e).lower():
                    raise
                # Continue extracting for other errors
                pass

    # If we've extracted all bits but found no terminator, try to decode the whole message
    try:
        if password:
            # Try to decrypt the entire message
            decrypted = decrypt_message(bytes(byte_data), password=password)
            return decrypted.rstrip('\0')
        else:
            # Try to decode the entire message
            text = byte_data.decode('utf-8', errors='ignore')
            return text.rstrip('\0')
    except Exception:
        return "No valid message found in audio"

# Text Steganography (using multiple invisible characters and encryption)
def hide_message_in_text(message, password=None, cover_text=None):
    """
    Enhanced text steganography with multiple invisible characters and encryption.

    Args:
        message: The message to hide
        password: Optional password for encryption
        cover_text: Optional custom cover text

    Returns:
        str: Text with hidden message
    """
    # Add null terminator for extraction
    message = message + '\0'

    # Encrypt the message if password is provided
    if password:
        # Use the encryption module to encrypt the message with the password
        print(f"DEBUG: Encrypting message with password: {password}")
        encrypted_bytes = encrypt_message(message, password=password)
        # Convert bytes to hex string for easier handling
        message_to_hide = encrypted_bytes.hex()
        print(f"DEBUG: Encrypted message (hex): {message_to_hide[:50]}...")
    else:
        message_to_hide = message

    # Convert message to binary
    binary_message = ''.join(format(ord(char), '08b') for char in message_to_hide)

    # Use multiple invisible characters for better security
    # Each character represents a different bit pattern
    invisible_chars = {
        '00': '\u200B',  # Zero-width space
        '01': '\u200C',  # Zero-width non-joiner
        '10': '\u200D',  # Zero-width joiner
        '11': '\u2060'   # Word joiner
    }

    # Use provided cover text or default
    if not cover_text:
        cover_text = "This is a normal looking text. "

    # Prepare the output text
    output_text = cover_text[:len(cover_text)//2]

    # Hide the binary message using invisible characters (2 bits at a time)
    for i in range(0, len(binary_message), 2):
        if i + 1 < len(binary_message):
            bit_pair = binary_message[i:i+2]
            output_text += invisible_chars[bit_pair]
        else:
            # Handle odd length
            output_text += invisible_chars[binary_message[i] + '0']

    # Add the second half of the cover text
    output_text += cover_text[len(cover_text)//2:]

    # Add a signature to identify this as a steganographic message
    if not output_text.endswith("."):
        output_text += "."

    return output_text

def extract_message_from_text(hidden_message, password=None):
    """
    Extract a hidden message from text.

    Args:
        hidden_message: The text with hidden message
        password: Optional password used during hiding

    Returns:
        str: The extracted message
    """
    # Add debug logging
    print(f"DEBUG: Starting text extraction with password: {password}")

    # Check for invisible characters
    has_invisible = any(c in hidden_message for c in ['\u200B', '\u200C', '\u200D', '\u2060'])
    invisible_count = sum(1 for c in hidden_message if c in ['\u200B', '\u200C', '\u200D', '\u2060']) if has_invisible else 0

    print(f"DEBUG: Found {invisible_count} invisible characters")

    # Don't force password validation here - we'll handle it later

    # Define the invisible characters used for encoding
    invisible_chars = {
        '\u200B': '00',  # Zero-width space
        '\u200C': '01',  # Zero-width non-joiner
        '\u200D': '10',  # Zero-width joiner
        '\u2060': '11'   # Word joiner
    }

    # Extract the binary data
    binary = ''
    invisible_count = 0
    for char in hidden_message:
        if char in invisible_chars:
            binary += invisible_chars[char]
            invisible_count += 1

    # Add debug logging
    print(f"DEBUG: Found {invisible_count} invisible characters")
    print(f"DEBUG: Extracted binary data length: {len(binary)}")

    # Convert binary to text (8 bits per character)
    extracted_text = ''
    for i in range(0, len(binary), 8):
        if i + 8 <= len(binary):
            byte = binary[i:i+8]
            extracted_text += chr(int(byte, 2))

    # Add debug logging
    if extracted_text:
        print(f"DEBUG: Converted to text (first 50 chars): {extracted_text[:50]}...")
    else:
        print("DEBUG: No text was extracted from binary data")

    # Check if the text appears to be encrypted (has invisible characters and looks like hex)
    is_likely_encrypted = invisible_count > 20 and len(extracted_text) > 16
    is_hex = False

    if len(extracted_text) > 0:
        is_hex = all(c in '0123456789abcdefABCDEF' for c in extracted_text.strip())
        print(f"DEBUG: Text looks like hex: {is_hex}")

    # If we have invisible characters and hex-like text, it's probably encrypted
    if is_likely_encrypted and is_hex:
        print("DEBUG: Message appears to be encrypted")

        # If no password was provided but message appears encrypted
        if not password:
            print("DEBUG: No password provided for encrypted message")
            raise ValueError("This message appears to be encrypted. Please provide a password.")

        # Try to decrypt with the provided password
        try:
            # Convert from hex to bytes
            encrypted_bytes = bytes.fromhex(extracted_text)
            print(f"DEBUG: Successfully converted to bytes, length: {len(encrypted_bytes)}")

            # Attempt to decrypt
            try:
                # Pass the password to the decrypt_message function
                decrypted = decrypt_message(encrypted_bytes, password=password)
                print(f"DEBUG: Successfully decrypted: {decrypted[:50] if len(decrypted) > 50 else decrypted}")

                # Remove null terminator if present
                if '\0' in decrypted:
                    return decrypted.split('\0')[0]
                return decrypted
            except Exception as e:
                print(f"DEBUG: Decryption failed: {str(e)}")
                raise ValueError("Incorrect password. Please try again with the correct password.")
        except ValueError as e:
            print(f"DEBUG: Hex conversion or decryption failed: {str(e)}")
            raise ValueError("Incorrect password or the message was not encrypted properly.")

    # If password was provided but message doesn't look encrypted
    elif password and not (is_likely_encrypted and is_hex):
        print("DEBUG: Password provided but message doesn't appear to be encrypted")
        # Just return the extracted text as is
        if '\0' in extracted_text:
            return extracted_text.split('\0')[0]
        return extracted_text

    # If no password and message doesn't look encrypted
    else:
        print("DEBUG: No password provided and message doesn't appear encrypted")
        # Just return the extracted text as is
        if '\0' in extracted_text:
            result = extracted_text.split('\0')[0]
            print(f"DEBUG: Returning unencrypted result: {result}")
            return result
        print(f"DEBUG: Returning full unencrypted text")
        return extracted_text
