# LESAVOT Multimodal Steganography Web Application

A comprehensive web-based steganography application that allows you to hide messages in images, text, and audio files.

## Features

- **User Authentication**: Register and login with password strength indicator
- **Image Steganography**: Hide and extract messages from image files using LSB (Least Significant Bit) steganography
- **Text Steganography**: Hide and extract messages from text content using zero-width characters
- **Audio Steganography**: Hide and extract messages from audio files using LSB steganography
- **Password Protection**: Optional encryption of messages with a password
- **Modern UI**: Clean, responsive interface with blue theme

## Getting Started

### Option 1: Using the Launcher Scripts (Recommended)

#### Windows:
1. Double-click on `start_application.bat`
2. The application will open in your default web browser

#### macOS/Linux:
1. Open Terminal
2. Navigate to the application directory
3. Run: `chmod +x start_application.sh`
4. Run: `./start_application.sh`
5. The application will open in your default web browser

### Option 2: Using Python Directly

1. Open a command prompt or terminal
2. Navigate to the application directory
3. Run: `python start_local_server.py` (Windows) or `python3 start_local_server.py` (macOS/Linux)
4. The application will open in your default web browser

### Option 3: Opening Directly in Browser

1. Open the `run_web_app.html` file in your web browser
2. Click the "Launch Web Application" button

## Using the Application

### Registration and Login

1. When you first open the application, you'll see the login/register page
2. Click "Register" to create a new account
3. Enter a username and password
4. The password strength meter will show how strong your password is
5. Click "Register" to create your account
6. After registration, log in with your new credentials

### Image Steganography

1. Select the "Image" tab
2. Choose "Encrypt" to hide a message or "Decrypt" to extract a message
3. For encryption:
   - Select an image file
   - Enter the message you want to hide
   - Optionally enter a password for additional security
   - Click "Encrypt"
   - After processing, you'll see the image with the hidden message
   - Click "Download Image" to save the steganographic image
4. For decryption:
   - Select an image file with a hidden message
   - Enter the password if one was used during encryption
   - Click "Decrypt" to reveal the hidden message
   - The extracted message will appear in the text area

### Text Steganography

1. Select the "Text" tab
2. Choose "Encrypt" to hide a message or "Decrypt" to extract a message
3. For encryption:
   - Enter or paste the text that will contain the hidden message
   - Enter the message you want to hide
   - Optionally enter a password for additional security
   - Click "Encrypt"
   - The text with the hidden message will appear in the text area
   - Click "Copy to Clipboard" to copy the steganographic text
4. For decryption:
   - Enter or paste the text containing the hidden message
   - Enter the password if one was used during encryption
   - Click "Decrypt" to reveal the hidden message
   - The extracted message will appear in the text area

### Audio Steganography

1. Select the "Audio" tab
2. Choose "Encrypt" to hide a message or "Decrypt" to extract a message
3. For encryption:
   - Select an audio file
   - Enter the message you want to hide
   - Optionally enter a password for additional security
   - Click "Encrypt"
   - After processing, you'll see an audio player with the steganographic audio
   - Click "Download Audio" to save the audio file with the hidden message
4. For decryption:
   - Select an audio file with a hidden message
   - Enter the password if one was used during encryption
   - Click "Decrypt" to reveal the hidden message
   - The extracted message will appear in the text area

## Technical Details

### Image Steganography

The application uses LSB (Least Significant Bit) steganography for images:
- Each pixel in an image has RGB color values (0-255)
- The least significant bit of each color value is modified to store a bit of the message
- This causes minimal visual change to the image
- The message length is stored in the first 32 bits
- The message is converted to binary and stored bit by bit

### Text Steganography

The application uses zero-width character steganography for text:
- Zero-width characters are invisible characters that can be inserted into text
- Two different zero-width characters are used to represent binary 0 and 1
- The message is converted to binary and encoded using these characters
- A signature is added to identify steganographic text
- The message length is stored in the first 16 bits

### Audio Steganography

The application uses LSB steganography for audio:
- Audio samples are modified to store the message bits
- Only every 10th sample is modified to minimize audible changes
- The message length is stored in the first 32 bits
- The message is converted to binary and stored bit by bit

### Password Protection

All steganography methods support password protection:
- The message is encrypted using XOR encryption with the password
- The same password is required to decrypt the message
- Without the correct password, the extracted message will be gibberish

## Notes

- User data is stored in your browser's localStorage, so it will persist between sessions on the same device and browser
- If you clear your browser data, your user accounts will be lost
- This is a client-side application, so all processing happens in your browser

## Troubleshooting

If you encounter any issues:

1. Make sure you're using a modern browser (Chrome, Firefox, Edge, or Safari)
2. Try clearing your browser cache and reloading the page
3. Check the browser console for any error messages (F12 > Console)
4. If the application doesn't load, make sure all files are in the correct location
5. For audio steganography, some browsers may have restrictions on audio processing

## Security Considerations

- The steganography methods used in this application are for educational purposes
- For critical security applications, consider using more robust methods
- The password protection uses a simple XOR encryption, which is not suitable for high-security applications
- Always use strong passwords when encrypting sensitive information

## License

This project is open source and available under the MIT License.
