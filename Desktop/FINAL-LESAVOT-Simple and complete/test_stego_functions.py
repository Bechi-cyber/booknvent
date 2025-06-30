#!/usr/bin/env python3
"""
Test script for steganography functions
"""

from PIL import Image
import numpy as np

def hide_message_in_image(image, message):
    """Hide a message in an image using LSB steganography."""
    # Convert image to numpy array
    img_array = np.array(image)
    
    # Convert message to binary
    binary_message = ''.join(format(ord(char), '08b') for char in message)
    binary_message += '00000000'  # Add null terminator
    
    # Check if the image is large enough to hold the message
    if img_array.size < len(binary_message):
        raise ValueError("Image is too small to hide this message")
    
    # Flatten the array to make it easier to iterate
    flat_array = img_array.flatten()
    
    # Modify the LSB of each pixel to hide the message
    for i in range(len(binary_message)):
        flat_array[i] = (flat_array[i] & ~1) | int(binary_message[i])
    
    # Reshape back to original image dimensions
    stego_array = flat_array.reshape(img_array.shape)
    
    # Convert back to PIL Image
    stego_image = Image.fromarray(stego_array)
    
    return stego_image

def extract_message_from_image(image):
    """Extract a hidden message from an image."""
    # Convert image to numpy array
    img_array = np.array(image)
    
    # Flatten the array
    flat_array = img_array.flatten()
    
    # Extract LSB from each pixel
    binary_message = ''.join(str(pixel & 1) for pixel in flat_array)
    
    # Convert binary to ASCII
    message = ""
    for i in range(0, len(binary_message), 8):
        if i + 8 <= len(binary_message):
            byte = binary_message[i:i+8]
            if byte == '00000000':  # Null terminator
                break
            message += chr(int(byte, 2))
    
    return message

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

def main():
    """Run all tests."""
    print("=== Steganography Function Tests ===")
    print()
    
    test_image_steganography()
    
    print("All tests completed!")

if __name__ == "__main__":
    main()
