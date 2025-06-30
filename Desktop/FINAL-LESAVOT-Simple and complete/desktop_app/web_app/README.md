# Multimodal Steganography Web Application

A web-based steganography application that allows users to hide messages in images, text, and audio files.

## Features

- **User Authentication**: Register and login functionality with password strength indicator
- **Image Steganography**: Hide and extract messages from image files
- **Text Steganography**: Hide and extract messages from text content
- **Audio Steganography**: Hide and extract messages from audio files
- **Password Protection**: Optional password protection for encrypted messages
- **Modern UI**: Clean, responsive interface with blue theme

## How to Run

This is a client-side only application that runs directly in your web browser without needing a server.

### Option 1: Open Directly in Browser

1. Download all files from the `web_version` folder
2. Double-click on `index.html` to open it in your default web browser

### Option 2: Use a Local Server

For a better experience, you can use a simple local server:

#### Using Python:

```bash
# Navigate to the web_version folder
cd web_version

# If you have Python 3 installed:
python -m http.server

# If you have Python 2 installed:
python -m SimpleHTTPServer
```

Then open your browser and go to `http://localhost:8000`

#### Using Node.js:

```bash
# Install http-server globally if you haven't already
npm install -g http-server

# Navigate to the web_version folder
cd web_version

# Start the server
http-server
```

Then open your browser and go to `http://localhost:8080`

## Usage

1. **Register/Login**: Create an account or log in with existing credentials
2. **Select Modality**: Choose between Image, Text, or Audio tabs
3. **Choose Mode**: Select Encrypt to hide a message or Decrypt to extract a message
4. **Encrypt**:
   - Select a file (for Image/Audio) or enter text
   - Enter the message you want to hide
   - Optionally enter a password for additional security
   - Click Encrypt
5. **Decrypt**:
   - Select a file with a hidden message or enter text with a hidden message
   - Enter the password if one was used during encryption
   - Click Decrypt to reveal the hidden message

## Notes

- This is a demonstration application with fully implemented text steganography algorithms.
- User data is stored in the browser's localStorage and will be lost if you clear your browser data.
- For a production application, server-side processing would be required for secure authentication and more complex steganography algorithms.

## Character Length Limits for Text Encryption

The text steganography implementation has the following practical limits:

### Secret Message Size
- **Optimal performance**: Up to 10,000 characters
- **Maximum theoretical limit**: ~100,000 characters (not recommended)

### Cover Text Size
- **Minimum recommended**: At least 20% longer than the secret message
- **Optimal ratio**: Cover text should be 5-10 times longer than the secret message

### Technical Details
- Each character in your message is converted to a 16-bit binary representation
- Each bit is then converted to a zero-width character (U+200B or U+200C)
- The platform distributes hidden data throughout the cover text using an algorithm based on text length
- Additional overhead includes metadata, checksums, and signatures

### Best Practices
- For sensitive information, consider breaking long messages into multiple smaller encrypted segments
- Use longer cover texts for better concealment and distribution
- The platform includes error recovery mechanisms, but extremely long messages may still experience issues

## Browser Compatibility

This application works best in modern browsers:
- Chrome (recommended)
- Firefox
- Edge
- Safari

## License

This project is open source and available under the MIT License.
