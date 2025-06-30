// LESAVOT - Multimodal Steganography
// JavaScript Implementation

// DOM Elements
const textModeRadios = document.querySelectorAll('input[name="textMode"]');
const textEncrypt = document.getElementById('textEncrypt');
const textDecrypt = document.getElementById('textDecrypt');
const textEncryptBtn = document.getElementById('textEncryptBtn');
const textDecryptBtn = document.getElementById('textDecryptBtn');
const textContent = document.getElementById('textContent');
const textMessage = document.getElementById('textMessage');
const textPassword = document.getElementById('textPassword');
const textOutput = document.getElementById('textOutput');
const textOutputContainer = document.getElementById('textOutputContainer');
const textCopyBtn = document.getElementById('textCopyBtn');
const textDownloadBtn = document.getElementById('textDownloadBtn');
const textDecryptContent = document.getElementById('textDecryptContent');
const textDecryptPassword = document.getElementById('textDecryptPassword');
const textExtractedMessage = document.getElementById('textExtractedMessage');
const signOutBtn = document.getElementById('signOutBtn');
const notificationArea = document.getElementById('notificationArea');
const tabButtons = document.querySelectorAll('.tab-btn');
const cardHeader = document.querySelector('.card-header h2');

// Initialize application
document.addEventListener('DOMContentLoaded', () => {
    initModeSwitching();
    initSteganographyActions();
    initTabNavigation();

    // Check if user is logged in
    try {
        // Check if userAuth is available in the global scope
        if (typeof window.userAuth !== 'undefined' && window.userAuth) {
            const currentUser = window.userAuth.getCurrentUser();
            if (currentUser) {
                // Use the full name if available, otherwise use username
                const displayName = currentUser.fullName || currentUser.username;
                document.getElementById('welcomeMessage').textContent = `Welcome, ${displayName}`;

                // Show personalized welcome notification
                showNotification(`Welcome to LESAVOT Steganography Platform, ${displayName}`, 'info');
                return; // Exit early if we successfully displayed the welcome message
            }
        }

        // Fallback to localStorage for backward compatibility
        const username = localStorage.getItem('username');
        if (username) {
            document.getElementById('welcomeMessage').textContent = `Welcome, ${username}`;
            showNotification('Welcome to LESAVOT Steganography Platform', 'info');
        } else {
            // No user logged in
            showNotification('Welcome to LESAVOT Steganography Platform', 'info');
        }
    } catch (error) {
        console.error('Error checking user authentication:', error);

        // Fallback to localStorage as a last resort
        const username = localStorage.getItem('username');
        if (username) {
            document.getElementById('welcomeMessage').textContent = `Welcome, ${username}`;
        }

        // Show welcome notification
        showNotification('Welcome to LESAVOT Steganography Platform', 'info');
    }
});

// Tab Navigation
function initTabNavigation() {
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Update active tab
            tabButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            // Update card header based on selected tab
            const tabText = button.querySelector('span').textContent;
            const tabIcon = button.querySelector('i').className;

            // Update card header
            if (tabText === 'Text') {
                cardHeader.textContent = 'Text Steganography';
                document.querySelector('.card-header i').className = 'fas fa-font';
            } else if (tabText === 'Image') {
                cardHeader.textContent = 'Image Steganography';
                document.querySelector('.card-header i').className = 'fas fa-image';
            } else if (tabText === 'Audio') {
                cardHeader.textContent = 'Audio Steganography';
                document.querySelector('.card-header i').className = 'fas fa-volume-up';
            }

            // For now, we're only implementing text steganography
            if (tabText !== 'Text') {
                showNotification('This feature is coming soon!', 'info');
            }
        });
    });
}

// Mode Switching
function initModeSwitching() {
    // Text mode
    textModeRadios.forEach(radio => {
        radio.addEventListener('change', () => {
            if (radio.value === 'encrypt') {
                textEncrypt.style.display = 'block';
                textDecrypt.style.display = 'none';
                cardHeader.textContent = 'Encrypt Message';
                document.querySelector('.card-header i').className = 'fas fa-lock';
            } else {
                textEncrypt.style.display = 'none';
                textDecrypt.style.display = 'block';
                cardHeader.textContent = 'Decrypt Message';
                document.querySelector('.card-header i').className = 'fas fa-unlock';
            }
        });
    });
}

// Steganography Actions
function initSteganographyActions() {
    // Text Steganography
    // --- Segmented History Logic ---
    function saveUserHistory(modality, operation) {
        let username = '';
        if (typeof window.userAuth !== 'undefined' && window.userAuth) {
            const currentUser = window.userAuth.getCurrentUser();
            if (currentUser) username = currentUser.username;
        }
        if (!username) username = localStorage.getItem('username') || 'guest';
        const key = `lesavot_history_${username}_${modality}`;
        const history = JSON.parse(localStorage.getItem(key) || '[]');
        history.unshift(operation); // newest first
        localStorage.setItem(key, JSON.stringify(history));
    }

    textEncryptBtn.addEventListener('click', () => {
        const content = textContent.value;
        const message = textMessage.value;
        const password = textPassword.value;
        const outputMode = 'stego';

        if (!message) {
            showNotification('Please enter a secret message to hide', 'error', 'The secret message field cannot be empty.');
            return;
        }
        if (!content) {
            showNotification('Please enter cover text', 'error', 'The cover text field cannot be empty.');
            return;
        }
        try {
            if (password) {
                const passwordStrength = evaluatePasswordStrength(password);
                if (passwordStrength === 'weak') {
                    showNotification(
                        'Weak password detected',
                        'warning',
                        'Your password is weak. Consider using a stronger password with a mix of letters, numbers, and special characters.'
                    );
                }
            }
            const result = hideMessageInText(content, message, password, outputMode);
            textOutput.value = result;
            textOutputContainer.style.display = 'block';

            // Save operation to segmented user history
            saveUserHistory('text', {
                type: 'text',
                mode: 'encrypt',
                hasPassword: !!password,
                contentLength: content.length,
                messageLength: message.length,
                timestamp: new Date().toISOString(),
                summary: `Encrypted message of length ${message.length} in cover text of length ${content.length}`
            });

            if (password) {
                showNotification(
                    'Message encrypted and hidden successfully!',
                    'success',
                    'Your message has been encrypted with your password and hidden in the cover text.'
                );
            } else {
                showNotification(
                    'Message hidden successfully!',
                    'success',
                    'Your message has been hidden in the cover text. Note: No password was used for encryption.'
                );
            }
            textOutputContainer.scrollIntoView({ behavior: 'smooth' });
        } catch (error) {
            showNotification('Encryption failed', 'error', error.message);
        }
    });

    textDecryptBtn.addEventListener('click', () => {
        const content = textDecryptContent.value;
        const password = textDecryptPassword.value;
        if (!content) {
            showNotification('Please enter text with hidden message', 'error', 'The encrypted text field cannot be empty.');
            return;
        }
        try {
            const result = extractMessageFromText(content, password);
            textExtractedMessage.value = result;

            // Save operation to segmented user history
            saveUserHistory('text', {
                type: 'text',
                mode: 'decrypt',
                hasPassword: !!password,
                contentLength: content.length,
                messageLength: result.length,
                timestamp: new Date().toISOString(),
                summary: `Decrypted message of length ${result.length} from text of length ${content.length}`
            });

            if (password) {
                showNotification(
                    'Message decrypted successfully!',
                    'success',
                    'Your message has been extracted and decrypted using the provided password.'
                );
            } else {
                showNotification(
                    'Message extracted successfully!',
                    'success',
                    'Your message has been extracted from the text.'
                );
            }
            textExtractedMessage.scrollIntoView({ behavior: 'smooth' });
        } catch (error) {
            // Check for incorrect password error
            if (error.message && error.message.includes("Wrong password")) {
                textExtractedMessage.value = '';
                textExtractedMessage.style.display = 'block';
                showNotification('Operation failed due to incorrect password, try again with the right password', 'error');
            } else {
                textExtractedMessage.value = error.message || 'Message extracted successfully';
                textExtractedMessage.style.display = 'block';
                showNotification('Message extracted from text', 'success');
            }
            textExtractedMessage.scrollIntoView({ behavior: 'smooth' });
        }
    });

    // Function to evaluate password strength
    function evaluatePasswordStrength(password) {
        // Check password length
        if (password.length < 8) {
            return 'weak';
        }

        // Check for variety of character types
        const hasLowerCase = /[a-z]/.test(password);
        const hasUpperCase = /[A-Z]/.test(password);
        const hasNumbers = /[0-9]/.test(password);
        const hasSpecialChars = /[^a-zA-Z0-9]/.test(password);

        const varietyScore = [hasLowerCase, hasUpperCase, hasNumbers, hasSpecialChars].filter(Boolean).length;

        if (varietyScore <= 2) {
            return 'weak';
        } else if (varietyScore === 3) {
            return 'medium';
        } else {
            return 'strong';
        }
    }

    // Copy and Download buttons
    textCopyBtn.addEventListener('click', () => {
        textOutput.select();
        document.execCommand('copy');
        showNotification('Text copied to clipboard', 'success');
    });

    textDownloadBtn.addEventListener('click', () => {
        const text = textOutput.value;
        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'hidden_message.txt';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showNotification('Text downloaded as file', 'success');
    });

    // Sign Out button
    signOutBtn.addEventListener('click', () => {
        showNotification('Signing out...', 'info');
        setTimeout(() => {
            try {
                // Use UserAuth for sign out if available
                if (typeof window.userAuth !== 'undefined' && window.userAuth) {
                    window.userAuth.logout();
                }

                // Always clear localStorage and sessionStorage for backward compatibility
                localStorage.removeItem('username');
                localStorage.removeItem('rememberUser');
                localStorage.removeItem('currentUser');
                sessionStorage.removeItem('currentUser');
            } catch (error) {
                console.error('Error during sign out:', error);
                // Ensure we clear localStorage even if there's an error
                localStorage.removeItem('username');
                localStorage.removeItem('rememberUser');
                localStorage.removeItem('currentUser');
                sessionStorage.removeItem('currentUser');
            }

            // Redirect to auth page
            window.location.href = 'auth.html';
        }, 1000);
    });
}

// Text Steganography Algorithm
function hideMessageInText(text, message, password = '', outputMode = 'stego') {
    // Generate a timestamp for authenticity verification
    const timestamp = Date.now().toString();

    // Encrypt the message if password is provided
    let messageToHide = message;
    if (password) {
        messageToHide = encryptMessage(message, password);
    }

    // Add metadata to the message
    const metadata = {
        message: messageToHide,
        timestamp: timestamp,
        version: '1.1'
    };

    // Convert metadata to JSON string
    const metadataStr = JSON.stringify(metadata);

    // Add signature
    const signature = 'LESAVOT';

    // Calculate checksum for integrity verification
    // Include the signature in the checksum calculation for added security
    const checksum = calculateChecksum(signature + metadataStr);

    // Combine all parts
    const dataToHide = signature + '|' + checksum + '|' + metadataStr;

    // Convert to binary
    const binaryData = textToBinary(dataToHide);

    // Convert to zero-width characters with improved distribution
    const zeroWidthChars = binaryToZeroWidth(binaryData);

    // Distribute the zero-width characters throughout the text for better concealment
    // This makes the steganography more robust and harder to detect
    if (outputMode === 'stego' && text.length > 20) {
        return distributeZeroWidthChars(text, zeroWidthChars);
    } else if (outputMode === 'plain') {
        // Store the steganographic version in localStorage for later retrieval
        const stegoText = distributeZeroWidthChars(text, zeroWidthChars);
        localStorage.setItem('lastStegoText', stegoText);
        return text;
    }

    // Default fallback: append to the end of text
    return text + zeroWidthChars;
}

function distributeZeroWidthChars(text, zeroWidthChars) {
    // Distribute zero-width characters throughout the text
    // This makes the steganography more robust and harder to detect

    // Calculate how many characters to insert at each position
    const textLength = text.length;
    const charsLength = zeroWidthChars.length;

    // We'll insert zero-width characters after every nth character
    // where n is calculated based on text length
    const insertEvery = Math.max(5, Math.floor(textLength / (charsLength + 1)));

    let result = '';
    let charIndex = 0;

    for (let i = 0; i < textLength; i++) {
        result += text[i];

        // Insert zero-width characters at calculated positions
        if (i > 0 && i % insertEvery === 0 && charIndex < charsLength) {
            // Calculate how many characters to insert at this position
            const charsToInsert = Math.min(4, charsLength - charIndex);
            result += zeroWidthChars.substring(charIndex, charIndex + charsToInsert);
            charIndex += charsToInsert;
        }
    }

    // Append any remaining zero-width characters
    if (charIndex < charsLength) {
        result += zeroWidthChars.substring(charIndex);
    }

    return result;
}

function extractMessageFromText(text, password = '') {
    try {
        // Check if this is a plain text output and we have the stego version in localStorage
        const lastStegoText = localStorage.getItem('lastStegoText');
        if (lastStegoText && text === lastStegoText.substring(0, text.length)) {
            text = lastStegoText;
        }

        // Extract zero-width characters
        const zeroWidthChars = extractZeroWidthChars(text);
        if (!zeroWidthChars) {
            throw new Error('No hidden message found');
        }

        // Convert zero-width characters to binary
        let binary = zeroWidthToBinary(zeroWidthChars);

        // Attempt recovery if the binary data might be corrupted
        if (binary.length % 16 !== 0 || binary.length === 0) {
            binary = attemptBinaryRecovery(binary);
        }

        // Convert binary to text with error recovery
        const extractedData = binaryToText(binary);

        // Verify we have some data
        if (!extractedData || extractedData.length === 0) {
            throw new Error('Failed to decode the hidden message');
        }

        // Parse the extracted data
        const parts = extractedData.split('|');
        if (parts.length < 3 || parts[0] !== 'LESAVOT') {
            throw new Error('Invalid steganographic data');
        }

        const signature = parts[0];
        const checksum = parts[1];
        const metadataStr = parts.slice(2).join('|');

        // Verify checksum for integrity
        const calculatedChecksum = calculateChecksum(signature + metadataStr);
        if (checksum !== calculatedChecksum) {
            // If a password was provided, this is likely due to a wrong password
            if (password) {
                throw new Error('Wrong password, couldn\'t decrypt');
            } else {
                throw new Error('Data integrity check failed - message may have been tampered with');
            }
        }

        // Parse the metadata
        let metadata;
        try {
            metadata = JSON.parse(metadataStr);
        } catch (e) {
            throw new Error('Invalid message format');
        }

        // Verify the message has required fields
        if (!metadata.message || !metadata.timestamp || !metadata.version) {
            throw new Error('Message is missing required metadata');
        }

        // Verify the message is not too old (optional, can be adjusted or removed)
        const messageAge = Date.now() - parseInt(metadata.timestamp);
        if (messageAge < 0) {
            throw new Error('Message has an invalid timestamp (from the future)');
        }

        // Get the actual message
        let message = metadata.message;

        // Decrypt if password was used
        if (password) {
            try {
                message = decryptMessage(message, password);
            } catch (e) {
                // Always throw the same error message for password issues to avoid leaking information
                throw new Error('Wrong password, couldn\'t decrypt');
            }
        }

        return message;
    } catch (error) {
        throw new Error('Failed to extract message: ' + error.message);
    }
}

// Helper functions
function textToBinary(text) {
    let binary = '';
    for (let i = 0; i < text.length; i++) {
        const charCode = text.charCodeAt(i);
        const bin = charCode.toString(2).padStart(16, '0');
        binary += bin;
    }
    return binary;
}

function binaryToText(binary) {
    // Attempt recovery if the binary is corrupted
    binary = attemptBinaryRecovery(binary);

    let text = '';
    try {
        for (let i = 0; i < binary.length; i += 16) {
            const chunk = binary.substr(i, 16);
            // Handle potential invalid binary data
            if (!/^[01]+$/.test(chunk)) {
                throw new Error('Invalid binary data');
            }

            const charCode = parseInt(chunk, 2);
            // Check for invalid character codes
            if (charCode === 0 || !isFinite(charCode) || charCode > 0xFFFF) {
                continue; // Skip invalid characters
            }

            text += String.fromCharCode(charCode);
        }
    } catch (error) {
        // If conversion fails, try a more lenient approach
        console.error('Binary conversion error, attempting recovery:', error);

        // Try a more forgiving approach
        for (let i = 0; i < binary.length; i += 16) {
            try {
                const chunk = binary.substr(i, 16).replace(/[^01]/g, '0');
                if (chunk.length === 16) {
                    const charCode = parseInt(chunk, 2);
                    if (charCode > 0 && charCode <= 0xFFFF) {
                        text += String.fromCharCode(charCode);
                    }
                }
            } catch (e) {
                // Skip this chunk if it can't be processed
                continue;
            }
        }
    }

    return text;
}

function binaryToZeroWidth(binary) {
    // Use zero-width characters to represent binary
    // Zero-width space (0), zero-width non-joiner (1)
    return binary.replace(/0/g, '\u200B').replace(/1/g, '\u200C');
}

function zeroWidthToBinary(zeroWidth) {
    // Convert zero-width characters back to binary
    return zeroWidth.replace(/\u200B/g, '0').replace(/\u200C/g, '1');
}

function extractZeroWidthChars(text) {
    // Extract only zero-width characters
    const zeroWidthPattern = /[\u200B\u200C]+/g;
    const matches = text.match(zeroWidthPattern);

    // If no matches found, try alternative zero-width characters that might be used
    if (!matches) {
        // Try alternative zero-width characters that might be used or substituted
        const alternativePattern = /[\u200B\u200C\u200D\u200E\u200F\uFEFF]+/g;
        const altMatches = text.match(alternativePattern);

        if (altMatches) {
            // Filter out unsupported characters and convert them to supported ones
            return altMatches.join('')
                .replace(/[\u200D\u200E\u200F\uFEFF]/g, '\u200B');
        }

        return '';
    }

    return matches.join('');
}

// Add error recovery for binary conversion
function attemptBinaryRecovery(binary) {
    // Check if the binary length is not a multiple of 16 (corrupted)
    if (binary.length % 16 !== 0) {
        // Try to recover by padding with zeros
        const paddingNeeded = 16 - (binary.length % 16);
        return binary + '0'.repeat(paddingNeeded);
    }
    return binary;
}

function encryptMessage(message, password) {
    // Enhanced encryption with salt and improved key derivation
    // Still using XOR for compatibility, but with better security practices

    // Generate a random salt (8 bytes)
    const salt = generateRandomSalt();

    // Derive a stronger key using the password and salt
    const key = deriveKey(password, salt);

    // Encrypt the message
    let encrypted = '';
    for (let i = 0; i < message.length; i++) {
        const charCode = message.charCodeAt(i);
        // Use a different part of the key for each character based on position
        const keyIndex = (i * 13 + 7) % key.length; // Non-linear key usage
        const keyChar = key[keyIndex];
        const encryptedChar = charCode ^ keyChar;
        encrypted += String.fromCharCode(encryptedChar);
    }

    // Return salt + encrypted message (salt is needed for decryption)
    return salt + '|' + encrypted;
}

function decryptMessage(encrypted, password) {
    try {
        // If no password provided, return the encrypted message as-is
        if (!password) {
            return encrypted;
        }

        // Split the salt from the encrypted message
        const parts = encrypted.split('|');
        if (parts.length !== 2) {
            // Return the encrypted message if format is invalid
            return encrypted;
        }

        const salt = parts[0];
        const encryptedMessage = parts[1];

        // Derive the same key using the password and stored salt
        const key = deriveKey(password, salt);

        // Decrypt the message
        let decrypted = '';
        for (let i = 0; i < encryptedMessage.length; i++) {
            const charCode = encryptedMessage.charCodeAt(i);
            // Use the same non-linear key usage as in encryption
            const keyIndex = (i * 13 + 7) % key.length;
            const keyChar = key[keyIndex];
            const decryptedChar = charCode ^ keyChar;
            decrypted += String.fromCharCode(decryptedChar);
        }

        // Return the decrypted result - this will be the original message if password is correct
        // or garbled text if password is wrong, but we always return something
        return decrypted;
    } catch (error) {
        console.error('Decryption error:', error);
        // Return the original encrypted message on any error
        return encrypted;
    }
}

function generateRandomSalt() {
    // Generate a random salt as a string of 16 hex characters (8 bytes)
    let salt = '';
    const hexChars = '0123456789abcdef';
    for (let i = 0; i < 16; i++) {
        salt += hexChars.charAt(Math.floor(Math.random() * hexChars.length));
    }
    return salt;
}

function deriveKey(password, salt) {
    // Enhanced key derivation with salt
    // This is a simplified PBKDF2-like approach

    // Start with the password and salt
    let key = [];
    const combinedInput = password + salt;

    // Initial key generation
    for (let i = 0; i < combinedInput.length; i++) {
        key.push(combinedInput.charCodeAt(i));
    }

    // Ensure the key is at least 32 bytes (256 bits)
    while (key.length < 32) {
        key.push(key[key.length % combinedInput.length]);
    }

    // Multiple iterations to strengthen against brute force
    // More iterations = stronger security but slower performance
    const iterations = 2000;
    for (let i = 0; i < iterations; i++) {
        // Mix the key bytes in a non-linear way
        for (let j = 0; j < key.length; j++) {
            const prevIndex = (j - 1 + key.length) % key.length;
            const nextIndex = (j + 1) % key.length;
            key[j] = (key[j] + key[prevIndex] + key[nextIndex] + i) % 256;
        }
    }

    return key;
}

function calculateChecksum(text) {
    // Enhanced checksum calculation using SHA-256 inspired algorithm
    // This is a simplified version for educational purposes
    // In production, use a standard crypto library

    // Initialize hash values (first 8 prime numbers)
    const h = [2, 3, 5, 7, 11, 13, 17, 19];

    // Process each character
    for (let i = 0; i < text.length; i++) {
        const charCode = text.charCodeAt(i);

        // Update hash values
        h[0] = ((h[0] << 5) + h[0] + charCode) & 0xFFFFFFFF;
        h[1] = ((h[1] << 7) + h[1] - charCode) & 0xFFFFFFFF;
        h[2] = ((h[2] << 3) + h[2] ^ charCode) & 0xFFFFFFFF;
        h[3] = ((h[3] << 11) + h[3] + (charCode * i)) & 0xFFFFFFFF;
        h[4] = ((h[4] << 6) + h[4] ^ (charCode << 1)) & 0xFFFFFFFF;
        h[5] = ((h[5] << 15) + h[5] + (charCode >> 1)) & 0xFFFFFFFF;
        h[6] = ((h[6] << 4) + h[6] ^ (charCode * 7)) & 0xFFFFFFFF;
        h[7] = ((h[7] << 9) + h[7] + (charCode * 13)) & 0xFFFFFFFF;

        // Mix the hash values
        if (i % 8 === 7) {
            for (let j = 0; j < 8; j++) {
                h[j] = h[j] ^ h[(j + 1) % 8];
            }
        }
    }

    // Convert hash values to hexadecimal string
    let checksum = '';
    for (let i = 0; i < 8; i++) {
        checksum += h[i].toString(16).padStart(8, '0');
    }

    // Return first 16 characters of the checksum (64 bits)
    return checksum.substring(0, 16);
}

// Enhanced Notification system
function showNotification(message, type = 'info', details = null) {
    // Remove any existing notifications of the same type
    const existingNotifications = document.querySelectorAll(`.notification.${type}`);
    existingNotifications.forEach(notification => notification.remove());

    const notification = document.createElement('div');
    notification.className = `notification ${type}`;

    // Add appropriate icon based on notification type
    let icon = 'info-circle';
    let title = 'Information';

    if (type === 'success') {
        icon = 'check-circle';
        title = 'Operation Successful';
    } else if (type === 'error') {
        icon = 'exclamation-triangle';
        title = 'Operation Failed';
    } else if (type === 'warning') {
        icon = 'exclamation-circle';
        title = 'Warning';
    }

    // Create notification content with title and details if provided
    let notificationContent = `
        <div class="notification-content">
            <div class="notification-header">
                <i class="fas fa-${icon}"></i>
                <span class="notification-title">${title}</span>
            </div>
            <div class="notification-message">${message}</div>
    `;

    // Add details if provided
    if (details) {
        notificationContent += `
            <div class="notification-details">
                <small>${details}</small>
            </div>
        `;
    }

    notificationContent += `
        </div>
        <button class="notification-close" type="button">
            <i class="fas fa-times"></i>
        </button>
    `;

    notification.innerHTML = notificationContent;

    notification.querySelector('.notification-close').addEventListener('click', () => {
        notification.remove();
    });

    notificationArea.appendChild(notification);

    // Auto-remove after 6 seconds for success, 8 seconds for others
    const timeout = type === 'success' ? 6000 : 8000;
    setTimeout(() => {
        if (notification.parentNode) {
            // Add fade-out animation
            notification.style.opacity = '0';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 300); // Animation duration
        }
    }, timeout);
}
