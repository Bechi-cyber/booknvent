#!/usr/bin/env python3
"""
Test script for LESAVOT steganography functions
"""

import os
from PIL import Image
import numpy as np
import scipy.io.wavfile as wavfile

# Import steganography functions from the main application
from lesavot_app import (
    hide_message_in_image,
    extract_message_from_image,
    hide_message_in_text,
    extract_message_from_text,
    hide_message_in_audio,
    extract_message_from_audio
)

def test_image_steganography():
    """Test image steganography functions."""
    print("Testing image steganography...")
    
    # Create a test image
    img = Image.new('RGB', (100, 100), color='white')
    
    # Test message
    message = "This is a secret message for testing image steganography!"
    
    # Hide the message
    stego_img = hide_message_in_image(img, message)
    
    # Extract the message
    extracted_message = extract_message_from_image(stego_img)
    
    # Verify
    print(f"Original message: {message}")
    print(f"Extracted message: {extracted_message}")
    print(f"Success: {message == extracted_message}")
    print()

def test_text_steganography():
    """Test text steganography functions."""
    print("Testing text steganography...")
    
    # Create a test text
    text = "This is a sample text file.\nIt contains multiple lines.\nWe will hide a message in it."
    
    # Test message
    message = "This is a secret message for testing text steganography!"
    
    # Hide the message
    stego_text = hide_message_in_text(text, message)
    
    # Extract the message
    extracted_message = extract_message_from_text(stego_text)
    
    # Verify
    print(f"Original message: {message}")
    print(f"Extracted message: {extracted_message}")
    print(f"Success: {message == extracted_message}")
    print()

def test_audio_steganography():
    """Test audio steganography functions."""
    print("Testing audio steganography...")
    
    # Create a test audio
    sample_rate = 44100
    duration = 5  # seconds
    t = np.linspace(0, duration, sample_rate * duration)
    audio_data = np.sin(2 * np.pi * 440 * t)  # 440 Hz sine wave
    
    # Test message
    message = "This is a secret message for testing audio steganography!"
    
    # Hide the message
    stego_audio = hide_message_in_audio(audio_data, sample_rate, message)
    
    # Extract the message
    extracted_message = extract_message_from_audio(stego_audio)
    
    # Verify
    print(f"Original message: {message}")
    print(f"Extracted message: {extracted_message}")
    print(f"Success: {message in extracted_message}")  # Audio steganography might be less precise
    print()

def main():
    """Run all tests."""
    print("=== LESAVOT Steganography Tests ===")
    print()
    
    test_image_steganography()
    test_text_steganography()
    test_audio_steganography()
    
    print("All tests completed!")

if __name__ == "__main__":
    main()
