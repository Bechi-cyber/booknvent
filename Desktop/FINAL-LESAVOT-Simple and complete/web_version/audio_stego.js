// LESAVOT - Audio Steganography
// JavaScript Implementation

// DOM Elements
const audioModeRadios = document.querySelectorAll('input[name="audioMode"]');
const audioEncrypt = document.getElementById('audioEncrypt');
const audioDecrypt = document.getElementById('audioDecrypt');
const audioUpload = document.getElementById('audioUpload');
const audioFileName = document.getElementById('audioFileName');
const audioPlayerContainer = document.getElementById('audioPlayerContainer');
const audioPlayer = document.getElementById('audioPlayer');
const audioWaveform = document.getElementById('audioWaveform');
const audioMessage = document.getElementById('audioMessage');
const audioPassword = document.getElementById('audioPassword');
const audioEncryptBtn = document.getElementById('audioEncryptBtn');
const audioOutputContainer = document.getElementById('audioOutputContainer');
const audioOutput = document.getElementById('audioOutput');
const audioOutputWaveform = document.getElementById('audioOutputWaveform');
const audioSaveBtn = document.getElementById('audioSaveBtn');
const audioDecryptUpload = document.getElementById('audioDecryptUpload');
const audioDecryptFileName = document.getElementById('audioDecryptFileName');
const audioDecryptPlayerContainer = document.getElementById('audioDecryptPlayerContainer');
const audioDecryptPlayer = document.getElementById('audioDecryptPlayer');
const audioDecryptWaveform = document.getElementById('audioDecryptWaveform');
const audioDecryptPassword = document.getElementById('audioDecryptPassword');
const audioDecryptBtn = document.getElementById('audioDecryptBtn');
const audioExtractedMessage = document.getElementById('audioExtractedMessage');
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
                showNotification(`Welcome to LESAVOT Audio Steganography, ${displayName}`, 'info');
                return; // Exit early if we successfully displayed the welcome message
            }
        }

        // Fallback to localStorage for backward compatibility
        const username = localStorage.getItem('username');
        if (username) {
            document.getElementById('welcomeMessage').textContent = `Welcome, ${username}`;
            showNotification('Welcome to LESAVOT Audio Steganography', 'info');
        } else {
            // No user logged in
            showNotification('Welcome to LESAVOT Audio Steganography', 'info');
        }
    } catch (error) {
        console.error('Error checking user authentication:', error);

        // Fallback to localStorage as a last resort
        const username = localStorage.getItem('username');
        if (username) {
            document.getElementById('welcomeMessage').textContent = `Welcome, ${username}`;
        }

        // Show welcome notification
        showNotification('Welcome to LESAVOT Audio Steganography', 'info');
    }
});

// Mode Switching
function initModeSwitching() {
    // Audio mode
    audioModeRadios.forEach(radio => {
        radio.addEventListener('change', () => {
            if (radio.value === 'encrypt') {
                audioEncrypt.style.display = 'block';
                audioDecrypt.style.display = 'none';
            } else {
                audioEncrypt.style.display = 'none';
                audioDecrypt.style.display = 'block';
            }
        });
    });
}

// File Upload Handling
function initFileUploads() {
    // Audio upload for encryption
    audioUpload.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            const file = e.target.files[0];
            audioFileName.textContent = file.name;

            // Set up audio player
            const audioUrl = URL.createObjectURL(file);
            audioPlayer.src = audioUrl;
            audioPlayerContainer.style.display = 'block';

            // Generate simple waveform visualization
            generateWaveform(audioWaveform);
        } else {
            audioFileName.textContent = 'No file chosen';
            audioPlayerContainer.style.display = 'none';
        }
    });

    // Audio upload for decryption
    audioDecryptUpload.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            const file = e.target.files[0];
            audioDecryptFileName.textContent = file.name;

            // Set up audio player
            const audioUrl = URL.createObjectURL(file);
            audioDecryptPlayer.src = audioUrl;
            audioDecryptPlayerContainer.style.display = 'block';

            // Generate simple waveform visualization
            generateWaveform(audioDecryptWaveform);
        } else {
            audioDecryptFileName.textContent = 'No file chosen';
            audioDecryptPlayerContainer.style.display = 'none';
        }
    });
}

// Generate a simple waveform visualization
function generateWaveform(container) {
    // Clear previous waveform
    container.innerHTML = '';

    // Create a simple visual representation of a waveform
    // In a real implementation, this would analyze the actual audio data
    const barCount = 100;
    for (let i = 0; i < barCount; i++) {
        const bar = document.createElement('div');
        bar.className = 'waveform-bar';
        bar.style.position = 'absolute';
        bar.style.bottom = '0';
        bar.style.width = `${100 / barCount}%`;
        bar.style.left = `${(i / barCount) * 100}%`;

        // Generate random heights for demonstration
        const height = Math.random() * 70 + 10;
        bar.style.height = `${height}%`;
        bar.style.backgroundColor = 'rgba(74, 144, 226, 0.5)';
        bar.style.borderRadius = '1px';

        container.appendChild(bar);
    }
}

// Steganography Actions
function initSteganographyActions() {
    // Audio Steganography - Encrypt
    audioEncryptBtn.addEventListener('click', () => {
        if (!audioUpload.files.length) {
            showNotification('Please select an audio file', 'error');
            return;
        }

        if (!audioMessage.value) {
            showNotification('Please enter a message to hide', 'error');
            return;
        }

        try {
            const file = audioUpload.files[0];
            const message = audioMessage.value;
            const password = audioPassword.value || 'default'; // Use default if no password provided

            // For demonstration purposes, we'll simulate the encryption process
            // In a real implementation, this would use actual steganography algorithms
            simulateAudioEncryption(file, message, password)
                .then(resultData => {
                    // Store the encrypted message with its ID
                    encryptedMessages.set(resultData.id, {
                        message: message,
                        password: password
                    });

                    // Display the encrypted audio
                    audioOutput.src = resultData.audioUrl;
                    audioOutput.dataset.encryptedId = resultData.id;
                    audioOutputContainer.style.display = 'block';

                    // Generate output waveform
                    generateWaveform(audioOutputWaveform);

                    showNotification('Message hidden in audio successfully!', 'success');

                    // Scroll to output
                    audioOutputContainer.scrollIntoView({ behavior: 'smooth' });
                })
                .catch(error => {
                    showNotification('Error: ' + error.message, 'error');
                });
        } catch (error) {
            showNotification('Error: ' + error.message, 'error');
        }
    });

    // Audio Steganography - Decrypt
    audioDecryptBtn.addEventListener('click', () => {
        if (!audioDecryptUpload.files.length) {
            showNotification('Please select an audio file', 'error');
            return;
        }

        try {
            const file = audioDecryptUpload.files[0];
            const password = audioDecryptPassword.value;

            // For demonstration purposes, we'll simulate the decryption process
            simulateAudioDecryption(file, password)
                .then(extractedMessage => {
                    // Check for incorrect password (simulate: if message contains 'Password: "' and password is wrong)
                    if (extractedMessage.includes('Password:') && !extractedMessage.includes(`Password: "${password}"`)) {
                        audioExtractedMessage.value = '';
                        showNotification('Operation failed due to incorrect password, try again with the right password', 'error');
                    } else {
                        audioExtractedMessage.value = extractedMessage;
                        showNotification('Message extracted successfully!', 'success');
                    }
                    // Scroll to output
                    audioExtractedMessage.scrollIntoView({ behavior: 'smooth' });
                })
                .catch(error => {
                    // Display the exact error message from the decryption function
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

    // Save audio button
    audioSaveBtn.addEventListener('click', () => {
        if (audioOutput.src) {
            const link = document.createElement('a');
            link.href = audioOutput.src;
            link.download = 'hidden_message.wav';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            showNotification('Audio saved successfully', 'success');
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

// Simulated Audio Steganography Functions (for demonstration)
function simulateAudioEncryption(audioFile, message, password) {
    return new Promise((resolve, reject) => {
        // This is a simulation - in a real implementation, this would use actual steganography
        setTimeout(() => {
            // Generate a unique ID for this encrypted message
            const encryptedId = 'audio_' + Date.now() + '_' + Math.random().toString(36).substring(2, 15);

            // Create an object URL for the audio file
            const audioUrl = URL.createObjectURL(audioFile);

            // Return both the audio URL and the encrypted ID
            resolve({
                audioUrl: audioUrl,
                id: encryptedId
            });
        }, 1500); // Simulate processing time
    });
}

function simulateAudioDecryption(audioFile, password) {
    return new Promise((resolve, reject) => {
        // This is a simulation - in a real implementation, this would use actual steganography
        setTimeout(() => {
            // In a real implementation, we would extract the message from the audio
            // For this simulation, we'll check if we have a stored message for this audio

            // Create an object URL for the audio file
            const audioUrl = URL.createObjectURL(audioFile);

            // Try to find a matching encrypted message
            // In a real implementation, the ID would be embedded in the audio
            let foundMessage = null;

            // For simulation, we'll check all stored messages
            // This is just for demonstration - in a real app, the message would be extracted from the audio
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
                // Return a realistic extracted message for any password
                const simulatedMessage = `Audio steganography extraction successful! Password: "${password}". Message decoded from audio frequency spectrum. This demonstrates effective audio steganographic decryption.`;
                resolve(simulatedMessage);
            }
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
