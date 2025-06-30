# LESAVOT Multimodal Steganography Platform

A secure application for hiding messages in text, images, and audio files using steganography techniques to enhance data security and privacy.

## Features

- **Text Steganography**: Hide messages in text using zero-width character encoding
- **Image Steganography**: Hide messages in images (simulated for demonstration)
- **Audio Steganography**: Hide messages in audio files (simulated for demonstration)
- **Modern Cybersecurity Interface**: Navy blue marble-themed UI with cybersecurity visual elements
- **Password Protection**: Add an extra layer of security with password-based encryption
- **Web-Based Application**: Access directly from your browser without installation
- **Responsive Design**: Works on desktop and mobile devices
- **Secure Authentication**: User registration and login with password protection
- **Multi-Factor Authentication**: Enhanced security with TOTP-based MFA
- **Leaked Password Protection**: Prevents the use of compromised passwords
- **User Profiles**: Manage user information and security settings
- **Operation History**: Track and manage steganography operations
- **Database Integration**: Persistent storage of user data and operation history

## Web Application

The LESAVOT project now features a web-based multimodal steganography application that can be accessed directly in your browser:

1. Open the `text_stego.html`, `image_stego.html`, or `audio_stego.html` file in your web browser
2. Navigate between the different steganography modes using the tabs at the top
3. No installation required - just open and use!

### Running the Web Application

#### Frontend Only (Quick Start)

1. Clone the repository:

   ```bash
   git clone https://github.com/Bechi-cyber/FINAL-LESAVOT.git
   cd FINAL-LESAVOT
   ```

2. Open the authentication page in your web browser:

   ```bash
   # Start with the authentication page
   open web_version/auth.html
   ```

3. Alternatively, you can simply double-click on `auth.html` in the `web_version` directory

#### Full Stack Setup (Recommended)

1. Clone the repository:

   ```bash
   git clone https://github.com/Bechi-cyber/FINAL-LESAVOT.git
   cd FINAL-LESAVOT
   ```

2. Set up the backend server:

   ```bash
   cd web_version/server
   npm install
   cp .env.example .env
   # Edit .env with your Supabase credentials
   npm start
   ```

3. In a new terminal, serve the frontend files:

   ```bash
   cd web_version
   # Using Python's built-in server
   python -m http.server 5500
   # Or using Node's http-server
   npx http-server -p 5500
   ```

4. Open your browser and navigate to `http://localhost:5500/auth.html`

## Usage

### Authentication

1. Navigate to the authentication page (`auth.html`)
2. Register a new account:
   - Enter your email, username, and password
   - Optionally provide your full name
   - Click "Create Account"
3. Log in with your credentials:
   - Enter your email/username and password
   - Optionally check "Remember me" for convenience
   - Click "Sign In"
4. Set up Multi-Factor Authentication (recommended):
   - After registration, you'll be prompted to set up MFA
   - Scan the QR code with an authenticator app (Google Authenticator, Authy, etc.)
   - Enter the verification code to complete setup

### User Profile

1. Click on the user icon in the top right corner
2. Update your profile information:
   - Change your full name or username
   - Click "Save Changes" to update
3. Change your password:
   - Enter your current password
   - Enter and confirm your new password
   - Click "Change Password"
4. Manage MFA settings:
   - Enable or disable Multi-Factor Authentication
   - Follow the prompts to complete the process

### Operation History

1. Navigate to the History tab
2. View your steganography operations:
   - Filter by type (text, image, audio)
   - Filter by mode (encrypt, decrypt)
3. Manage your history:
   - Delete individual entries
   - Clear all history with the "Clear History" button

### Text Steganography

1. Navigate to the "Text" tab
2. Choose between "Encrypt" or "Decrypt" mode
3. For encrypting:
   - Enter your secret message
   - Enter the cover text that will contain your hidden message
   - Optionally add a password for additional security
   - Click "Encrypt" to generate the output text
   - Copy or download the output text
4. For decrypting:
   - Paste the text containing the hidden message
   - Enter the password if one was used
   - Click "Decrypt" to reveal the hidden message

### Image Steganography

1. Navigate to the "Image" tab
2. Choose between "Encrypt" or "Decrypt" mode
3. For encrypting:
   - Upload a cover image
   - Enter your secret message
   - Optionally add a password for additional security
   - Click "Encrypt" to generate the output image
   - Save the output image
4. For decrypting:
   - Upload an image with a hidden message
   - Enter the password if one was used
   - Click "Decrypt" to reveal the hidden message

### Audio Steganography

1. Navigate to the "Audio" tab
2. Choose between "Encrypt" or "Decrypt" mode
3. For encrypting:
   - Upload a cover audio file
   - Enter your secret message
   - Optionally add a password for additional security
   - Click "Encrypt" to generate the output audio
   - Save the output audio file
4. For decrypting:
   - Upload an audio file with a hidden message
   - Enter the password if one was used
   - Click "Decrypt" to reveal the hidden message

## Security Considerations

### Steganography Security

- The text steganography implementation uses zero-width characters to hide messages
- The image and audio steganography features are simulated for demonstration purposes
- Password protection adds an extra layer of security with encryption
- The application includes integrity checks to detect tampering with hidden messages
- For maximum security, use strong passwords with a mix of characters, numbers, and symbols

### Account Security

- Enable Multi-Factor Authentication (MFA) for enhanced account security
- Use strong, unique passwords for your LESAVOT account
- The system includes leaked password protection to prevent the use of compromised passwords
- Regularly check your operation history for unauthorized activity
- Log out when using shared or public computers

### Data Security

- All database operations are protected by row-level security policies
- Sensitive operations are logged in the audit system
- The backend API uses JWT-based authentication with proper validation
- API requests are rate-limited to prevent brute force attacks
- CORS protection prevents unauthorized cross-origin requests

## Technical Implementation

- **Text Steganography**: Uses zero-width characters (U+200B, U+200C) to encode binary data
- **Password Encryption**: Implements a key derivation function with salt for secure encryption
- **Data Integrity**: Includes checksums to verify message integrity
- **Error Recovery**: Contains mechanisms to recover from corrupted data
- **Web Technologies**: Built with HTML5, CSS3, and vanilla JavaScript for maximum compatibility
- **Backend API**: Node.js with Express for secure server-side operations
- **Database**: PostgreSQL via Supabase for data persistence
- **Authentication**: JWT-based authentication with MFA support
- **Security**: HTTPS, CORS, rate limiting, and other security best practices

### Database Schema

The application uses the following database tables:

- **user_profiles**: Stores user information beyond what's in the auth.users table
- **user_preferences**: Stores user preferences for the application
- **stego_history**: Records the history of steganography operations
- **saved_content**: Stores saved steganographic content
- **usage_analytics**: Tracks usage patterns for analytics
- **audit_logs**: Records security-sensitive operations for auditing

### API Endpoints

The backend API provides the following endpoints:

- **/api/auth**: Authentication operations (signup, login, logout)
- **/api/users**: User profile management
- **/api/steganography**: Steganography operations and history

### Character Length Limits for Text Encryption

The LESAVOT platform doesn't have a hard-coded character length limit for text encryption, but there are practical considerations.

#### Technical Factors

- Each character in your message is converted to a 16-bit binary representation
- Each bit is then converted to a zero-width character (U+200B or U+200C)
- The platform distributes hidden data throughout the cover text using an algorithm based on text length

#### Practical Recommendations

- **Secret Message Size**:
  - Optimal performance: Up to 10,000 characters
  - Maximum theoretical limit: ~100,000 characters (not recommended)

- **Cover Text Size**:
  - Minimum recommended: At least 20% longer than the secret message
  - Optimal ratio: Cover text should be 5-10 times longer than the secret message

- **Encryption Overhead**:
  - Each character becomes approximately 16 zero-width characters
  - Additional overhead includes metadata, checksums, and signatures

#### Best Practices

- For sensitive information, consider breaking long messages into multiple smaller encrypted segments
- Use longer cover texts for better concealment and distribution
- The platform includes error recovery mechanisms, but extremely long messages may still experience issues

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- This application was developed as part of the LESAVOT project
- The web version features a responsive design with a navy blue marble theme
- The backend uses Supabase for database and authentication services
- The frontend uses modern web technologies for a responsive user experience
- Special thanks to all contributors and testers

## Contact

For questions or support, please contact [seclesavot@gmail.com](mailto:seclesavot@gmail.com)
