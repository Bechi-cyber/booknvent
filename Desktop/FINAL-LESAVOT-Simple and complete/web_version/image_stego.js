// LESAVOT - Image Steganography
// JavaScript Implementation

// DOM Elements
const imageModeRadios = document.querySelectorAll('input[name="imageMode"]');
const imageEncrypt = document.getElementById('imageEncrypt');
const imageDecrypt = document.getElementById('imageDecrypt');
const imageUpload = document.getElementById('imageUpload');
const imageFileName = document.getElementById('imageFileName');
const imagePreviewContainer = document.getElementById('imagePreviewContainer');
const imagePreview = document.getElementById('imagePreview');
const imageMessage = document.getElementById('imageMessage');
const imagePassword = document.getElementById('imagePassword');
const imageEncryptBtn = document.getElementById('imageEncryptBtn');
const imageOutputContainer = document.getElementById('imageOutputContainer');
const imageOutput = document.getElementById('imageOutput');
const imageSaveBtn = document.getElementById('imageSaveBtn');
const imageDecryptUpload = document.getElementById('imageDecryptUpload');
const imageDecryptFileName = document.getElementById('imageDecryptFileName');
const imageDecryptPreviewContainer = document.getElementById('imageDecryptPreviewContainer');
const imageDecryptPreview = document.getElementById('imageDecryptPreview');
const imageDecryptPassword = document.getElementById('imageDecryptPassword');
const imageDecryptBtn = document.getElementById('imageDecryptBtn');
const imageExtractedMessage = document.getElementById('imageExtractedMessage');
const signOutBtn = document.getElementById('signOutBtn');
const notificationArea = document.getElementById('notificationArea');

// Store encrypted messages (in a real app, this would be stored in the encrypted file)
const encryptedMessages = new Map();

// Initialize application
document.addEventListener('DOMContentLoaded', () => {
    initModeSwitching();
    initFileUploads();
    initSteganographyActions();

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
                showNotification(`Welcome to LESAVOT Image Steganography, ${displayName}`, 'info');
                return; // Exit early if we successfully displayed the welcome message
            }
        }

        // Fallback to localStorage for backward compatibility
        const username = localStorage.getItem('username');
        if (username) {
            document.getElementById('welcomeMessage').textContent = `Welcome, ${username}`;
            showNotification('Welcome to LESAVOT Image Steganography', 'info');
        } else {
            // No user logged in
            showNotification('Welcome to LESAVOT Image Steganography', 'info');
        }
    } catch (error) {
        console.error('Error checking user authentication:', error);

        // Fallback to localStorage as a last resort
        const username = localStorage.getItem('username');
        if (username) {
            document.getElementById('welcomeMessage').textContent = `Welcome, ${username}`;
        }

        // Show welcome notification
        showNotification('Welcome to LESAVOT Image Steganography', 'info');
    }
});

// Mode Switching
function initModeSwitching() {
    // Image mode
    imageModeRadios.forEach(radio => {
        radio.addEventListener('change', () => {
            if (radio.value === 'encrypt') {
                imageEncrypt.style.display = 'block';
                imageDecrypt.style.display = 'none';
            } else {
                imageEncrypt.style.display = 'none';
                imageDecrypt.style.display = 'block';
            }
        });
    });
}

// File Upload Handling
function initFileUploads() {
    // Image upload for encryption
    imageUpload.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            const file = e.target.files[0];
            imageFileName.textContent = file.name;

            // Preview image
            const reader = new FileReader();
            reader.onload = (e) => {
                imagePreview.src = e.target.result;
                imagePreviewContainer.style.display = 'block';
            };
            reader.readAsDataURL(file);
        } else {
            imageFileName.textContent = 'No file chosen';
            imagePreviewContainer.style.display = 'none';
        }
    });

    // Image upload for decryption
    imageDecryptUpload.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            const file = e.target.files[0];
            imageDecryptFileName.textContent = file.name;

            // Preview image
            const reader = new FileReader();
            reader.onload = (e) => {
                imageDecryptPreview.src = e.target.result;
                imageDecryptPreviewContainer.style.display = 'block';
            };
            reader.readAsDataURL(file);
        } else {
            imageDecryptFileName.textContent = 'No file chosen';
            imageDecryptPreviewContainer.style.display = 'none';
        }
    });
}

// Steganography Actions
function initSteganographyActions() {
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

    // Image Steganography - Encrypt
    imageEncryptBtn.addEventListener('click', () => {
        if (!imageUpload.files.length) {
            showNotification('Please select an image', 'error');
            return;
        }

        if (!imageMessage.value) {
            showNotification('Please enter a message to hide', 'error');
            return;
        }

        try {
            const file = imageUpload.files[0];
            const message = imageMessage.value;
            const password = imagePassword.value || 'default'; // Use default if no password provided

            simulateImageEncryption(file, message, password)
                .then(resultData => {
                    encryptedMessages.set(resultData.id, {
                        message: message,
                        password: password
                    });

                    // Save operation to segmented user history
                    saveUserHistory('image', {
                        type: 'image',
                        mode: 'encrypt',
                        hasPassword: !!password,
                        fileName: file.name,
                        messageLength: message.length,
                        timestamp: new Date().toISOString(),
                        summary: `Encrypted message of length ${message.length} in image ${file.name}`
                    });

                    imageOutput.src = resultData.imageUrl;
                    imageOutput.dataset.encryptedId = resultData.id;
                    imageOutputContainer.style.display = 'block';
                    showNotification('Message hidden in image successfully!', 'success');
                    imageOutputContainer.scrollIntoView({ behavior: 'smooth' });
                })
                .catch(error => {
                    showNotification('Error: ' + error.message, 'error');
                });
        } catch (error) {
            showNotification('Error: ' + error.message, 'error');
        }
    });

    // Image Steganography - Decrypt
    imageDecryptBtn.addEventListener('click', () => {
        if (!imageDecryptUpload.files.length) {
            showNotification('Please select an image', 'error');
            return;
        }

        try {
            const file = imageDecryptUpload.files[0];
            const password = imageDecryptPassword.value;

            simulateImageDecryption(file, password)
                .then(extractedMessage => {
                    // Check for incorrect password (simulate: if message contains 'password: "' and password is wrong)
                    if (extractedMessage.toLowerCase().includes('password:') && !extractedMessage.includes(`password: "${password}"`)) {
                        imageExtractedMessage.value = '';
                        showNotification('Operation failed due to incorrect password, try again with the right password', 'error');
                    } else {
                        imageExtractedMessage.value = extractedMessage;
                        // Save operation to segmented user history
                        saveUserHistory('image', {
                            type: 'image',
                            mode: 'decrypt',
                            hasPassword: !!password,
                            fileName: file.name,
                            messageLength: extractedMessage.length,
                            timestamp: new Date().toISOString(),
                            summary: `Decrypted message of length ${extractedMessage.length} from image ${file.name}`
                        });
                        showNotification('Message extracted successfully!', 'success');
                    }
                    imageExtractedMessage.scrollIntoView({ behavior: 'smooth' });
                })
                .catch(error => {
                    if (error.message && error.message.toLowerCase().includes('password')) {
                        showNotification('Operation failed due to incorrect password, try again with the right password', 'error');
                    } else {
                        showNotification(error.message, 'error');
                    }
                });
        } catch (error) {
            showNotification('Error: ' + error.message, 'error');
        }
    });

    // Save image button
    imageSaveBtn.addEventListener('click', () => {
        if (imageOutput.src) {
            const link = document.createElement('a');
            link.href = imageOutput.src;
            link.download = 'hidden_message.png';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            showNotification('Image saved successfully', 'success');
        }
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

// Simulated Image Steganography Functions (for demonstration)
function simulateImageEncryption(imageFile, message, password) {
    return new Promise((resolve, reject) => {
        // This is a simulation - in a real implementation, this would use actual steganography
        setTimeout(() => {
            // Generate a unique ID for this encrypted message
            const encryptedId = 'img_' + Date.now() + '_' + Math.random().toString(36).substring(2, 15);

            // Read the image file
            const reader = new FileReader();
            reader.onload = (e) => {
                // Return both the image URL and the encrypted ID
                resolve({
                    imageUrl: e.target.result,
                    id: encryptedId
                });
            };
            reader.onerror = () => {
                reject(new Error('Failed to process the image'));
            };
            reader.readAsDataURL(imageFile);
        }, 1500); // Simulate processing time
    });
}

function simulateImageDecryption(imageFile, password) {
    return new Promise((resolve, reject) => {
        // This is a simulation - in a real implementation, this would use actual steganography
        setTimeout(() => {
            // In a real implementation, we would extract the message from the image
            // For this simulation, we'll check if we have a stored message for this image

            // Generate a reader to get the image data URL
            const reader = new FileReader();
            reader.onload = (e) => {
                const imageUrl = e.target.result;

                // Try to find a matching encrypted message
                // In a real implementation, the ID would be embedded in the image
                let foundMessage = null;

                // For simulation, we'll check all stored messages
                // This is just for demonstration - in a real app, the message would be extracted from the image
                for (const [id, data] of encryptedMessages.entries()) {
                    // If we have a stored message and the password matches
                    if (data.password === password) {
                        foundMessage = data.message;
                        break;
                    }
                }

                // Always return a message, regardless of password correctness
                if (foundMessage) {
                    resolve(foundMessage);
                } else {
                    // Return the actual encrypted message for any password
                    // This simulates extracting the encrypted data from the image
                    const simulatedEncryptedMessage = `Hidden message extracted from image with password: "${password}". In a real implementation, this would be the actual decrypted content.`;
                    resolve(simulatedEncryptedMessage);
                }
            };

            reader.onerror = () => {
                reject(new Error('Failed to process the image'));
            };

            reader.readAsDataURL(imageFile);
        }, 1500); // Simulate processing time
    });
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
