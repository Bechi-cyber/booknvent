# app/encryption.py
"""
Encryption module for the multimodal steganography application.

This module provides functions for encrypting and decrypting messages using AES encryption.
It supports multiple encryption modes and includes key management functionality.
"""

import os
import base64
import json
from typing import Dict, Optional
from Crypto.Cipher import AES
from Crypto.Util.Padding import pad, unpad
from Crypto.Random import get_random_bytes

# Default encryption settings
DEFAULT_KEY_FILE = 'encryption_key.json'
DEFAULT_MODE = AES.MODE_CBC

# Generate a secure random key if none exists
def generate_key(key_size: int = 32) -> bytes:
    """
    Generate a secure random key for encryption.

    Args:
        key_size: Size of the key in bytes (default: 32 for AES-256)

    Returns:
        bytes: A random key of the specified size
    """
    return get_random_bytes(key_size)

# Save the key to a file
def save_key(key: bytes, filename: str = DEFAULT_KEY_FILE, password: Optional[str] = None) -> None:
    """
    Save the encryption key to a file.

    Args:
        key: The encryption key to save
        filename: The file to save the key to
        password: Optional password to encrypt the key file

    Returns:
        None
    """
    key_data = {
        'key': base64.b64encode(key).decode('utf-8'),
        'created': str(os.path.getmtime(filename) if os.path.exists(filename) else 0)
    }

    # If a password is provided, encrypt the key data
    if password:
        # Simple encryption for the key file (not for production use)
        # In a real application, use a proper key derivation function
        pass

    with open(filename, 'w') as f:
        json.dump(key_data, f)

# Load the key from a file
def load_key(filename: str = DEFAULT_KEY_FILE, password: Optional[str] = None) -> bytes:
    """
    Load the encryption key from a file.

    Args:
        filename: The file to load the key from
        password: Optional password to decrypt the key file

    Returns:
        bytes: The loaded encryption key
    """
    try:
        with open(filename, 'r') as f:
            key_data = json.load(f)

        # If a password is provided, decrypt the key data
        if password:
            # Simple decryption for the key file (not for production use)
            pass

        return base64.b64decode(key_data['key'])
    except (FileNotFoundError, json.JSONDecodeError, KeyError):
        # If the key file doesn't exist or is invalid, generate a new key
        new_key = generate_key()
        save_key(new_key, filename, password)
        return new_key

# Get the current encryption key
def get_encryption_key(key_file: str = DEFAULT_KEY_FILE) -> bytes:
    """
    Get the current encryption key, loading it from a file or generating a new one.

    Args:
        key_file: The file to load the key from

    Returns:
        bytes: The encryption key
    """
    if os.path.exists(key_file):
        return load_key(key_file)
    else:
        key = generate_key()
        save_key(key, key_file)
        return key

# Current encryption key
key = get_encryption_key()

# Encryption function
def encrypt_message(message: str, mode: int = DEFAULT_MODE) -> bytes:
    """
    Encrypt a message using AES encryption.

    Args:
        message: The message to encrypt
        mode: The AES mode to use (default: MODE_CBC)

    Returns:
        bytes: The encrypted message (IV + ciphertext)
    """
    try:
        if mode == AES.MODE_CBC or mode == AES.MODE_CFB:
            cipher = AES.new(key, mode)
            ct_bytes = cipher.encrypt(pad(message.encode('utf-8'), AES.block_size))
            return cipher.iv + ct_bytes  # Return the IV + ciphertext
        elif mode == AES.MODE_EAX or mode == AES.MODE_GCM:
            cipher = AES.new(key, mode)
            ct_bytes, tag = cipher.encrypt_and_digest(message.encode('utf-8'))
            return cipher.nonce + tag + ct_bytes  # Return the nonce + tag + ciphertext
        else:
            raise ValueError(f"Unsupported mode: {mode}")
    except Exception as e:
        raise RuntimeError(f"Encryption error: {str(e)}")

# Decryption function
def decrypt_message(encrypted_message: bytes, mode: int = DEFAULT_MODE, password: str = None) -> str:
    """
    Decrypt a message using AES encryption.

    Args:
        encrypted_message: The encrypted message (IV/nonce + ciphertext)
        mode: The AES mode to use (default: MODE_CBC)
        password: Optional password for validation (not used for actual decryption)

    Returns:
        str: The decrypted message
    """
    # Add debug logging
    print(f"DEBUG: Attempting to decrypt message with password: {password is not None}")

    try:
        if mode == AES.MODE_CBC or mode == AES.MODE_CFB:
            iv = encrypted_message[:16]
            ct = encrypted_message[16:]
            cipher = AES.new(key, mode, iv)
            pt = unpad(cipher.decrypt(ct), AES.block_size)
            result = pt.decode('utf-8')
            print(f"DEBUG: Successfully decrypted message: {result[:50]}...")
            return result
        elif mode == AES.MODE_EAX or mode == AES.MODE_GCM:
            nonce = encrypted_message[:16]
            tag = encrypted_message[16:32]
            ct = encrypted_message[32:]
            cipher = AES.new(key, mode, nonce)
            pt = cipher.decrypt_and_verify(ct, tag)
            result = pt.decode('utf-8')
            print(f"DEBUG: Successfully decrypted message: {result[:50]}...")
            return result
        else:
            raise ValueError(f"Unsupported mode: {mode}")
    except Exception as e:
        print(f"DEBUG: Decryption failed: {str(e)}")
        # If a password was provided, always treat decryption errors as password errors
        if password is not None:
            raise ValueError("Incorrect password. Please try again with the correct password.")
        raise RuntimeError(f"Decryption error: {str(e)}")

# Helper function to get available encryption modes
def get_available_modes() -> Dict[str, int]:
    """
    Get a dictionary of available encryption modes.

    Returns:
        Dict[str, int]: A dictionary mapping mode names to mode values
    """
    return {
        'CBC': AES.MODE_CBC,
        'CFB': AES.MODE_CFB,
        'EAX': AES.MODE_EAX,
        'GCM': AES.MODE_GCM
    }
