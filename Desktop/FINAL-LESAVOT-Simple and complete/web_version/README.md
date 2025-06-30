# LESAVOT Frontend - Advanced Steganography Platform

LESAVOT Frontend is the client-side application for the comprehensive steganography platform that allows users to hide and extract messages from images using advanced algorithms. This frontend provides an intuitive web interface with secure user authentication and operation history tracking.

## Features

- **Multiple Steganography Algorithms**: LSB, DCT, and Wavelet-based hiding
- **Secure Authentication**: JWT-based user authentication with session management
- **Operation History**: Track all steganography operations with detailed metadata
- **Real-time Metrics**: Monitor platform usage and performance
- **Responsive Design**: Works seamlessly across desktop and mobile devices
- **File Management**: Support for various image formats (PNG, JPG, JPEG, BMP, GIF)
- **Environment-Aware Configuration**: Automatic API endpoint detection for development/production

## Technology Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Configuration**: Environment-aware API client
- **Authentication**: JWT token management with localStorage
- **UI/UX**: Responsive design with modern CSS Grid and Flexbox
- **File Handling**: HTML5 File API for image processing

## Render Deployment Guide

### Prerequisites
- GitHub account
- Render account (https://render.com)
- Backend API deployed and running

### Deployment Steps

1. **Push to GitHub Repository**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit: LESAVOT Frontend"
   git remote add origin https://github.com/Bechi-cyber/LASAVOT.git
   git push -u origin master
   ```

2. **Deploy on Render**:
   - Go to https://render.com and sign in
   - Click "New +" and select "Static Site"
   - Connect your GitHub repository: `https://github.com/Bechi-cyber/LASAVOT`
   - Configure deployment settings:

### Render Configuration Settings

**Basic Settings:**
- **Name**: `lesavot-frontend`
- **Branch**: `master`
- **Root Directory**: `.` (leave empty for root)
- **Build Command**: `echo "No build step required"`
- **Publish Directory**: `.` (root directory)

**Advanced Settings:**
- **Auto-Deploy**: Yes (recommended)
- **Environment**: `production`

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
