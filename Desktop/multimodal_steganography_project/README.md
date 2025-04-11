# Multimodal Steganography Project

This project demonstrates various steganography techniques to hide messages in different types of media (images, audio, and text). It includes a web interface built with Flask that allows users to encrypt messages and hide them in various media formats.

## Features

- **Encryption**: AES encryption for secure message handling
- **Image Steganography**: Hide messages in image files using LSB (Least Significant Bit) technique
- **Audio Steganography**: Embed messages in audio files
- **Text Steganography**: Hide messages using zero-width characters

## Installation

1. Clone this repository
2. Install the required dependencies:

   ```bash
   pip install -r requirements.txt
   ```

## Usage

1. Start the Flask application:

   ```bash
   python app.py
   ```

2. Open your web browser and navigate to `http://127.0.0.1:5000`
3. Use the web interface to encrypt messages and hide them in various media formats

## Project Structure

- `app.py`: Main application file
- `app/`: Application package
  - `encryption.py`: Encryption and decryption functions
  - `steganography.py`: Steganography implementations for different media types
  - `views.py`: Flask routes and view functions
- `static/`: Static files (CSS, JavaScript)
- `templates/`: HTML templates

## Security Considerations

- The encryption key in `encryption.py` should be changed for production use
- This project is for educational purposes only
- Do not use for sensitive information without proper security review

## License

This project is open source and available under the MIT License.
