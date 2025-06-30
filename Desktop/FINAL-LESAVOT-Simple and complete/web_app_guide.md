# Multimodal Steganography Web Application Guide

## Accessing the Web Application

The web application has been successfully uploaded to your GitHub repository. Here are several ways to access and use it:

### Option 1: Access Directly from GitHub Pages

If GitHub Pages is enabled for your repository, you can access the web application at:
https://bechi-cyber.github.io/FINAL-LESAVOT/run_web_app.html

To enable GitHub Pages:
1. Go to your repository: https://github.com/Bechi-cyber/FINAL-LESAVOT
2. Click on "Settings"
3. Scroll down to the "GitHub Pages" section
4. Under "Source", select "main" branch
5. Click "Save"
6. Wait a few minutes for GitHub Pages to deploy your site

### Option 2: Download and Run Locally

1. Download the ZIP file from your repository:
   https://github.com/Bechi-cyber/FINAL-LESAVOT/raw/main/multimodal_steganography_web_app.zip

2. Extract the ZIP file to a folder on your computer

3. Open the `run_web_app.html` file in your web browser

### Option 3: Upload to a Web Hosting Service

1. Download the ZIP file from your repository:
   https://github.com/Bechi-cyber/FINAL-LESAVOT/raw/main/multimodal_steganography_web_app.zip

2. Extract the ZIP file

3. Upload all the extracted files to your web hosting service
   (e.g., cPanel File Manager, FTP, etc.)

4. Access the application by navigating to the URL where you uploaded the files

## Using the Web Application

### Registration and Login

1. When you first open the application, you'll see the login/register page
2. Click "Register" to create a new account
3. Enter a username and password
4. The password strength meter will show how strong your password is
5. Click "Register" to create your account
6. After registration, log in with your new credentials

### Main Application

After logging in, you'll see the main application with three tabs:

#### Image Steganography

1. Select the "Image" tab
2. Choose "Encrypt" to hide a message or "Decrypt" to extract a message
3. For encryption:
   - Select an image file
   - Enter the message you want to hide
   - Optionally enter a password for additional security
   - Click "Encrypt"
4. For decryption:
   - Select an image file with a hidden message
   - Enter the password if one was used during encryption
   - Click "Decrypt" to reveal the hidden message

#### Text Steganography

1. Select the "Text" tab
2. Choose "Encrypt" to hide a message or "Decrypt" to extract a message
3. For encryption:
   - Enter or paste the text that will contain the hidden message
   - Enter the message you want to hide
   - Optionally enter a password for additional security
   - Click "Encrypt"
4. For decryption:
   - Enter or paste the text containing the hidden message
   - Enter the password if one was used during encryption
   - Click "Decrypt" to reveal the hidden message

#### Audio Steganography

1. Select the "Audio" tab
2. Choose "Encrypt" to hide a message or "Decrypt" to extract a message
3. For encryption:
   - Select an audio file
   - Enter the message you want to hide
   - Optionally enter a password for additional security
   - Click "Encrypt"
4. For decryption:
   - Select an audio file with a hidden message
   - Enter the password if one was used during encryption
   - Click "Decrypt" to reveal the hidden message

## Notes

- User data is stored in your browser's localStorage, so it will persist between sessions on the same device and browser
- If you clear your browser data, your user accounts will be lost
- This is a client-side application, so all processing happens in your browser
- For a production application, you would need to implement server-side authentication and storage

## Troubleshooting

If you encounter any issues:

1. Make sure you're using a modern browser (Chrome, Firefox, Edge, or Safari)
2. Try clearing your browser cache and reloading the page
3. Check the browser console for any error messages (F12 > Console)
4. If the application doesn't load, make sure all files are in the correct location
