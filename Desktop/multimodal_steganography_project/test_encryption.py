#!/usr/bin/env python
# Test script for encryption.py

from app.encryption import encrypt_message, decrypt_message, get_available_modes

def test_encryption():
    print("Testing encryption and decryption...")
    
    # Test message
    original_message = "This is a secret message for testing encryption!"
    print(f"Original message: {original_message}")
    
    # Get available encryption modes
    modes = get_available_modes()
    print(f"Available encryption modes: {list(modes.keys())}")
    
    # Test each encryption mode
    for mode_name, mode_value in modes.items():
        print(f"\nTesting {mode_name} mode:")
        
        # Encrypt the message
        encrypted = encrypt_message(original_message, mode_value)
        print(f"Encrypted (hex): {encrypted.hex()[:50]}...")
        
        # Decrypt the message
        decrypted = decrypt_message(encrypted, mode_value)
        print(f"Decrypted: {decrypted}")
        
        # Verify the decryption
        if decrypted == original_message:
            print(f"✅ {mode_name} mode: Success!")
        else:
            print(f"❌ {mode_name} mode: Failed!")

if __name__ == "__main__":
    test_encryption()
