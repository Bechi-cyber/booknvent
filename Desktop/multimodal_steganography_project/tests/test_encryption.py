#!/usr/bin/env python
# tests/test_encryption.py
"""
Test module for the encryption functionality.

This module contains tests for the encryption and decryption functions.
"""

import unittest
import os
import sys

# Add the parent directory to the path so we can import the app modules
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.encryption import encrypt_message, decrypt_message, generate_key, save_key, load_key

class TestEncryption(unittest.TestCase):
    """Test cases for the encryption module."""
    
    def setUp(self):
        """Set up the test environment."""
        # Create a temporary key file for testing
        self.test_key_file = 'test_key.json'
        
        # Generate a test key
        self.test_key = generate_key()
        
        # Save the test messages
        self.test_messages = [
            "This is a secret message",
            "Another message with special characters: !@#$%^&*()",
            "A longer message that will be encrypted and then decrypted to test the functionality of the encryption module. This message should be long enough to test the padding and other aspects of the encryption algorithm.",
            "",  # Empty message
            "1234567890"  # Numeric message
        ]
    
    def tearDown(self):
        """Clean up after the tests."""
        # Remove the temporary key file if it exists
        if os.path.exists(self.test_key_file):
            os.remove(self.test_key_file)
    
    def test_key_generation(self):
        """Test key generation."""
        # Test that the key is the correct length
        self.assertEqual(len(self.test_key), 32)
        
        # Test that the key is of the correct type
        self.assertIsInstance(self.test_key, bytes)
        
        # Test that two generated keys are different
        another_key = generate_key()
        self.assertNotEqual(self.test_key, another_key)
    
    def test_key_save_load(self):
        """Test saving and loading keys."""
        # Save the key
        save_key(self.test_key, self.test_key_file)
        
        # Check that the key file exists
        self.assertTrue(os.path.exists(self.test_key_file))
        
        # Load the key
        loaded_key = load_key(self.test_key_file)
        
        # Check that the loaded key matches the original
        self.assertEqual(self.test_key, loaded_key)
    
    def test_encryption_decryption(self):
        """Test encryption and decryption."""
        for message in self.test_messages:
            # Encrypt the message
            encrypted = encrypt_message(message)
            
            # Check that the encrypted message is not the same as the original
            self.assertNotEqual(message.encode() if message else b'', encrypted)
            
            # Decrypt the message
            decrypted = decrypt_message(encrypted)
            
            # Check that the decrypted message matches the original
            self.assertEqual(message, decrypted)
    
    def test_encryption_modes(self):
        """Test different encryption modes."""
        from Crypto.Cipher import AES
        
        # Test CBC mode
        message = "Test message for CBC mode"
        encrypted_cbc = encrypt_message(message, mode=AES.MODE_CBC)
        decrypted_cbc = decrypt_message(encrypted_cbc, mode=AES.MODE_CBC)
        self.assertEqual(message, decrypted_cbc)
        
        # Test CFB mode
        message = "Test message for CFB mode"
        encrypted_cfb = encrypt_message(message, mode=AES.MODE_CFB)
        decrypted_cfb = decrypt_message(encrypted_cfb, mode=AES.MODE_CFB)
        self.assertEqual(message, decrypted_cfb)
        
        # Test EAX mode
        message = "Test message for EAX mode"
        encrypted_eax = encrypt_message(message, mode=AES.MODE_EAX)
        decrypted_eax = decrypt_message(encrypted_eax, mode=AES.MODE_EAX)
        self.assertEqual(message, decrypted_eax)
        
        # Test GCM mode
        message = "Test message for GCM mode"
        encrypted_gcm = encrypt_message(message, mode=AES.MODE_GCM)
        decrypted_gcm = decrypt_message(encrypted_gcm, mode=AES.MODE_GCM)
        self.assertEqual(message, decrypted_gcm)
    
    def test_error_handling(self):
        """Test error handling in encryption and decryption."""
        # Test decryption with invalid data
        with self.assertRaises(Exception):
            decrypt_message(b'invalid_data')
        
        # Test decryption with wrong mode
        message = "Test message"
        encrypted = encrypt_message(message, mode=AES.MODE_CBC)
        
        with self.assertRaises(Exception):
            decrypt_message(encrypted, mode=AES.MODE_EAX)

if __name__ == '__main__':
    unittest.main()
