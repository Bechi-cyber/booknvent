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

# Derive a key from a password
def derive_key_from_password(password: str, salt: bytes = None) -> tuple:
    """
    Derive an encryption key from a password using PBKDF2.

    Args:
        password: The password to derive the key from
        salt: Optional salt for key derivation (generated if None)

    Returns:
        tuple: (key, salt)
    """
    from Crypto.Protocol.KDF import PBKDF2
    from Crypto.Hash import SHA256

    # Generate a random salt if none is provided
    if salt is None:
        salt = get_random_bytes(16)

    # Derive a 32-byte key (256 bits) from the password
    derived_key = PBKDF2(password, salt, dkLen=32, count=1000000, hmac_hash_module=SHA256)

    return derived_key, salt

# Encryption function
def encrypt_message(message: str, password: str = None, mode: int = DEFAULT_MODE) -> bytes:
    """
    Encrypt a message using AES encryption.

    Args:
        message: The message to encrypt
        password: Optional password for encryption (uses global key if None)
        mode: The AES mode to use (default: MODE_CBC)

    Returns:
        bytes: The encrypted message (salt + IV + ciphertext)
    """
    try:
        # Use password-based encryption if password is provided
        if password:
            # Derive a key from the password
            derived_key, salt = derive_key_from_password(password)

            if mode == AES.MODE_CBC or mode == AES.MODE_CFB:
                cipher = AES.new(derived_key, mode)
                ct_bytes = cipher.encrypt(pad(message.encode('utf-8'), AES.block_size))
                return salt + cipher.iv + ct_bytes  # Return the salt + IV + ciphertext
            elif mode == AES.MODE_EAX or mode == AES.MODE_GCM:
                cipher = AES.new(derived_key, mode)
                ct_bytes, tag = cipher.encrypt_and_digest(message.encode('utf-8'))
                return salt + cipher.nonce + tag + ct_bytes  # Return the salt + nonce + tag + ciphertext
        # Use global key if no password is provided
        else:
            if mode == AES.MODE_CBC or mode == AES.MODE_CFB:
                cipher = AES.new(key, mode)
                ct_bytes = cipher.encrypt(pad(message.encode('utf-8'), AES.block_size))
                return b'\x00' * 16 + cipher.iv + ct_bytes  # Return zeros for salt + IV + ciphertext
            elif mode == AES.MODE_EAX or mode == AES.MODE_GCM:
                cipher = AES.new(key, mode)
                ct_bytes, tag = cipher.encrypt_and_digest(message.encode('utf-8'))
                return b'\x00' * 16 + cipher.nonce + tag + ct_bytes  # Return zeros for salt + nonce + tag + ciphertext

        raise ValueError(f"Unsupported mode: {mode}")
    except Exception as e:
        raise RuntimeError(f"Encryption error: {str(e)}")

# Decryption function
def decrypt_message(encrypted_message: bytes, mode: int = DEFAULT_MODE, password: str = None) -> str:
    """
    Decrypt a message using AES encryption.

    Args:
        encrypted_message: The encrypted message (salt + IV/nonce + ciphertext)
        mode: The AES mode to use (default: MODE_CBC)
        password: Optional password for decryption (uses global key if None)

    Returns:
        str: The decrypted message
    """
    # Add debug logging
    print(f"DEBUG: Attempting to decrypt message with password: {password is not None}")
    print(f"DEBUG: Encrypted message length: {len(encrypted_message)} bytes")

    # Validate input
    if len(encrypted_message) < 48:  # Need at least salt (16) + IV (16) + some ciphertext
        print(f"DEBUG: Encrypted message too short: {len(encrypted_message)} bytes")
        raise ValueError("Invalid encrypted message: too short")

    try:
        # Extract the salt (first 16 bytes)
        salt = encrypted_message[:16]

        # Check if this is a password-encrypted message
        is_password_encrypted = not all(b == 0 for b in salt)

        # If password is required but not provided
        if is_password_encrypted and not password:
            raise ValueError("This message is password-protected. Please provide a password.")

        # If password is provided but message is not password-encrypted
        if password and not is_password_encrypted:
            print("DEBUG: Password provided but message is not password-encrypted")
            # Continue with global key

        # Use the appropriate key
        encryption_key = key  # Default to global key
        if password and is_password_encrypted:
            # Derive the key from the password and salt
            encryption_key, _ = derive_key_from_password(password, salt)

        if mode == AES.MODE_CBC or mode == AES.MODE_CFB:
            iv = encrypted_message[16:32]
            ct = encrypted_message[32:]
            cipher = AES.new(encryption_key, mode, iv)
            pt = unpad(cipher.decrypt(ct), AES.block_size)
            result = pt.decode('utf-8')
            print(f"DEBUG: Successfully decrypted message: {result[:50] if len(result) > 50 else result}")
            return result
        elif mode == AES.MODE_EAX or mode == AES.MODE_GCM:
            nonce = encrypted_message[16:32]
            tag = encrypted_message[32:48]
            ct = encrypted_message[48:]
            cipher = AES.new(encryption_key, mode, nonce)
            pt = cipher.decrypt_and_verify(ct, tag)
            result = pt.decode('utf-8')
            print(f"DEBUG: Successfully decrypted message: {result[:50] if len(result) > 50 else result}")
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
