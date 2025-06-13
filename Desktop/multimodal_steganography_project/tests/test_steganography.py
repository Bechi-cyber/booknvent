#!/usr/bin/env python
# tests/test_steganography.py
"""
Test module for the steganography functionality.

This module contains tests for the steganography functions for different media types.
"""

import unittest
import os
import sys
import io
import numpy as np
from PIL import Image

# Add the parent directory to the path so we can import the app modules
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.steganography import (
    hide_message_in_image, extract_message_from_image,
    hide_message_in_text, extract_message_from_text
)

class TestImageSteganography(unittest.TestCase):
    """Test cases for image steganography."""
    
    def setUp(self):
        """Set up the test environment."""
        # Create a test directory
        os.makedirs('static', exist_ok=True)
        
        # Create a test image
        self.test_image = Image.new('RGB', (100, 100), color='white')
        self.test_image_file = io.BytesIO()
        self.test_image.save(self.test_image_file, format='PNG')
        self.test_image_file.seek(0)
        
        # Test messages
        self.test_messages = [
            "This is a secret message",
            "Another message with special characters: !@#$%^&*()",
            "A short message"
        ]
        
        # Test password
        self.test_password = "test_password"
    
    def tearDown(self):
        """Clean up after the tests."""
        # Remove test files
        for file in os.listdir('static'):
            if file.startswith('hidden_image'):
                os.remove(os.path.join('static', file))
    
    def test_image_steganography_without_password(self):
        """Test image steganography without password."""
        for message in self.test_messages:
            # Reset the file pointer
            self.test_image_file.seek(0)
            
            # Hide the message in the image
            hidden_image_path = hide_message_in_image(self.test_image_file, message)
            
            # Check that the hidden image file exists
            self.assertTrue(os.path.exists(hidden_image_path))
            
            # Extract the message from the image
            with open(hidden_image_path, 'rb') as f:
                extracted_message = extract_message_from_image(f)
            
            # Check that the extracted message matches the original
            self.assertEqual(message, extracted_message)
    
    def test_image_steganography_with_password(self):
        """Test image steganography with password."""
        for message in self.test_messages:
            # Reset the file pointer
            self.test_image_file.seek(0)
            
            # Hide the message in the image with a password
            hidden_image_path = hide_message_in_image(self.test_image_file, message, self.test_password)
            
            # Check that the hidden image file exists
            self.assertTrue(os.path.exists(hidden_image_path))
            
            # Extract the message from the image with the correct password
            with open(hidden_image_path, 'rb') as f:
                extracted_message = extract_message_from_image(f, self.test_password)
            
            # Check that the extracted message matches the original
            self.assertEqual(message, extracted_message)
            
            # Try to extract the message with the wrong password
            with open(hidden_image_path, 'rb') as f:
                extracted_message = extract_message_from_image(f, "wrong_password")
            
            # Check that the extracted message does not match the original
            self.assertNotEqual(message, extracted_message)

class TestTextSteganography(unittest.TestCase):
    """Test cases for text steganography."""
    
    def setUp(self):
        """Set up the test environment."""
        # Test messages
        self.test_messages = [
            "This is a secret message",
            "Another message with special characters: !@#$%^&*()",
            "A short message"
        ]
        
        # Test password
        self.test_password = "test_password"
        
        # Test cover text
        self.test_cover_text = "This is a cover text that will contain a hidden message."
    
    def test_text_steganography_without_password(self):
        """Test text steganography without password."""
        for message in self.test_messages:
            # Hide the message in text
            hidden_text = hide_message_in_text(message)
            
            # Check that the hidden text is not empty
            self.assertTrue(hidden_text)
            
            # Extract the message from the text
            extracted_message = extract_message_from_text(hidden_text)
            
            # Check that the extracted message matches the original
            self.assertEqual(message, extracted_message)
    
    def test_text_steganography_with_password(self):
        """Test text steganography with password."""
        for message in self.test_messages:
            # Hide the message in text with a password
            hidden_text = hide_message_in_text(message, self.test_password)
            
            # Check that the hidden text is not empty
            self.assertTrue(hidden_text)
            
            # Extract the message from the text with the correct password
            extracted_message = extract_message_from_text(hidden_text, self.test_password)
            
            # Check that the extracted message matches the original
            self.assertEqual(message, extracted_message)
            
            # Try to extract the message with the wrong password
            extracted_message = extract_message_from_text(hidden_text, "wrong_password")
            
            # Check that the extracted message does not match the original
            self.assertNotEqual(message, extracted_message)
    
    def test_text_steganography_with_cover_text(self):
        """Test text steganography with custom cover text."""
        for message in self.test_messages:
            # Hide the message in text with a custom cover text
            hidden_text = hide_message_in_text(message, cover_text=self.test_cover_text)
            
            # Check that the hidden text contains the cover text
            self.assertIn(self.test_cover_text, hidden_text)
            
            # Extract the message from the text
            extracted_message = extract_message_from_text(hidden_text)
            
            # Check that the extracted message matches the original
            self.assertEqual(message, extracted_message)

if __name__ == '__main__':
    unittest.main()
