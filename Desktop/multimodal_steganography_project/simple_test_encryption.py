#!/usr/bin/env python
# Simple test script for encryption.py

from app.encryption import encrypt_message, decrypt_message

def test_encryption():
    print("Testing basic encryption and decryption...")
    
    # Test message
    original_message = "This is a secret message for testing encryption!"
    print(f"Original message: {original_message}")
    
    # Encrypt the message
    encrypted = encrypt_message(original_message)
    print(f"Encrypted (hex): {encrypted.hex()[:50]}...")
    
    # Decrypt the message
    decrypted = decrypt_message(encrypted)
    print(f"Decrypted: {decrypted}")
    
    # Verify the decryption
    if decrypted == original_message:
        print("✅ Success! Encryption and decryption working correctly.")
    else:
        print("❌ Failed! Decrypted message doesn't match original.")

if __name__ == "__main__":
    test_encryption()
