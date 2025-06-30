// LESAVOT - Profile Page JavaScript

// DOM Elements
const profileName = document.getElementById('profileName');
const profileEmail = document.getElementById('profileEmail');
const fullNameInput = document.getElementById('fullName');
const usernameInput = document.getElementById('username');
const emailInput = document.getElementById('email');
const updateProfileBtn = document.getElementById('updateProfileBtn');
const currentPasswordInput = document.getElementById('currentPassword');
const newPasswordInput = document.getElementById('newPassword');
const confirmNewPasswordInput = document.getElementById('confirmNewPassword');
const changePasswordBtn = document.getElementById('changePasswordBtn');
const mfaStatus = document.getElementById('mfaStatus');
const setupMfaBtn = document.getElementById('setupMfaBtn');
const disableMfaBtn = document.getElementById('disableMfaBtn');
const deleteAccountBtn = document.getElementById('deleteAccountBtn');
const signOutBtn = document.getElementById('signOutBtn');
const notificationArea = document.getElementById('notificationArea');
const strengthSegments = document.querySelectorAll('.strength-segment');
const strengthText = document.querySelector('.strength-text');

// Initialize application
document.addEventListener('DOMContentLoaded', () => {
    loadUserProfile();
    initPasswordStrengthMeter();
    initUpdateProfile();
    initChangePassword();
    initMfaButtons();
    initDeleteAccount();
    initSignOut();
});

// Load user profile
async function loadUserProfile() {
    try {
        let userData = null;

        // Try to get user data from API client
        if (typeof window.apiClient !== 'undefined' && window.apiClient) {
            try {
                const response = await window.apiClient.getCurrentUser();
                userData = response.user;
            } catch (apiError) {
                console.error('Error getting user from API:', apiError);
            }
        }

        // Fallback to supabaseAuth if API client failed or is not available
        if (!userData && typeof window.userAuth !== 'undefined' && window.userAuth) {
            try {
                userData = await window.userAuth.getCurrentUser();
            } catch (authError) {
                console.error('Error getting user from supabaseAuth:', authError);
            }
        }

        // Fallback to localStorage as a last resort
        if (!userData) {
            const username = localStorage.getItem('username');
            if (username) {
                userData = { username, email: `${username}@example.com` };
            } else {
                // Redirect to login if no user data is available
                window.location.href = 'auth.html';
                return;
            }
        }

        // Update profile information
        profileName.textContent = userData.fullName || userData.username;
        profileEmail.textContent = userData.email;
        fullNameInput.value = userData.fullName || '';
        usernameInput.value = userData.username || '';
        emailInput.value = userData.email || '';

        // Update welcome message
        document.getElementById('welcomeMessage').textContent = `Welcome, ${userData.fullName || userData.username}`;

        // Check MFA status
        checkMfaStatus();
    } catch (error) {
        console.error('Error loading user profile:', error);
        showNotification('Failed to load user profile', 'error');
    }
}

// Initialize password strength meter
function initPasswordStrengthMeter() {
    newPasswordInput.addEventListener('input', function() {
        const password = this.value;
        const strength = calculatePasswordStrength(password);
        updateStrengthMeter(strength);
    });
}

// Calculate password strength (0-4)
function calculatePasswordStrength(password) {
    if (!password) return 0;

    let strength = 0;

    // Length check
    if (password.length >= 8) strength += 1;

    // Character variety checks
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;

    return strength;
}

// Update strength meter UI
function updateStrengthMeter(strength) {
    // Reset all segments
    strengthSegments.forEach(segment => {
        segment.className = 'strength-segment';
    });

    // Update segments based on strength
    for (let i = 0; i < strength; i++) {
        if (i < strengthSegments.length) {
            if (strength === 1) {
                strengthSegments[i].classList.add('weak');
            } else if (strength === 2 || strength === 3) {
                strengthSegments[i].classList.add('medium');
            } else {
                strengthSegments[i].classList.add('strong');
            }
        }
    }

    // Update text
    if (strength === 0) {
        strengthText.textContent = 'Password strength';
    } else if (strength === 1) {
        strengthText.textContent = 'Weak';
    } else if (strength === 2) {
        strengthText.textContent = 'Fair';
    } else if (strength === 3) {
        strengthText.textContent = 'Good';
    } else {
        strengthText.textContent = 'Strong';
    }
}

// Initialize update profile button
function initUpdateProfile() {
    updateProfileBtn.addEventListener('click', async () => {
        const fullName = fullNameInput.value.trim();
        const username = usernameInput.value.trim();

        if (!username) {
            showNotification('Username cannot be empty', 'error');
            return;
        }

        try {
            let success = false;

            // Try to update profile using API client
            if (typeof window.apiClient !== 'undefined' && window.apiClient) {
                try {
                    const response = await window.apiClient.updateProfile({
                        fullName,
                        username
                    });
                    success = true;
                } catch (apiError) {
                    console.error('Error updating profile with API:', apiError);
                    showNotification(apiError.message || 'Failed to update profile', 'error');
                }
            }

            // Fallback to supabaseAuth if API client failed or is not available
            if (!success && typeof window.userAuth !== 'undefined' && window.userAuth) {
                try {
                    const result = await window.userAuth.updateProfile({
                        fullName,
                        username
                    });
                    
                    if (result.success) {
                        success = true;
                    } else {
                        showNotification(result.message || 'Failed to update profile', 'error');
                    }
                } catch (authError) {
                    console.error('Error updating profile with supabaseAuth:', authError);
                    showNotification('Failed to update profile', 'error');
                }
            }

            if (success) {
                showNotification('Profile updated successfully', 'success');
                
                // Update profile name
                profileName.textContent = fullName || username;
                
                // Update welcome message
                document.getElementById('welcomeMessage').textContent = `Welcome, ${fullName || username}`;
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            showNotification('An unexpected error occurred', 'error');
        }
    });
}

// Initialize change password button
function initChangePassword() {
    changePasswordBtn.addEventListener('click', async () => {
        const currentPassword = currentPasswordInput.value;
        const newPassword = newPasswordInput.value;
        const confirmNewPassword = confirmNewPasswordInput.value;

        // Validate input
        if (!currentPassword || !newPassword || !confirmNewPassword) {
            showNotification('Please fill in all password fields', 'error');
            return;
        }

        if (newPassword !== confirmNewPassword) {
            showNotification('New passwords do not match', 'error');
            return;
        }

        // Check password strength
        const strength = calculatePasswordStrength(newPassword);
        if (strength < 3) {
            showNotification('Please use a stronger password for better security', 'warning');
            return;
        }

        try {
            let success = false;

            // Try to change password using API client
            if (typeof window.apiClient !== 'undefined' && window.apiClient) {
                try {
                    const response = await window.apiClient.updatePassword({
                        currentPassword,
                        newPassword
                    });
                    success = true;
                } catch (apiError) {
                    console.error('Error changing password with API:', apiError);
                    showNotification(apiError.message || 'Failed to change password', 'error');
                }
            }

            // Fallback to supabaseAuth if API client failed or is not available
            if (!success && typeof window.userAuth !== 'undefined' && window.userAuth) {
                try {
                    const result = await window.userAuth.changePassword(currentPassword, newPassword);
                    
                    if (result.success) {
                        success = true;
                    } else {
                        showNotification(result.message || 'Failed to change password', 'error');
                    }
                } catch (authError) {
                    console.error('Error changing password with supabaseAuth:', authError);
                    showNotification('Failed to change password', 'error');
                }
            }

            if (success) {
                showNotification('Password changed successfully', 'success');
                
                // Clear password fields
                currentPasswordInput.value = '';
                newPasswordInput.value = '';
                confirmNewPasswordInput.value = '';
                
                // Reset strength meter
                updateStrengthMeter(0);
            }
        } catch (error) {
            console.error('Error changing password:', error);
            showNotification('An unexpected error occurred', 'error');
        }
    });
}

// Check MFA status
async function checkMfaStatus() {
    try {
        let hasMfa = false;

        // Try to check MFA status using supabaseAuth
        if (typeof window.userAuth !== 'undefined' && window.userAuth) {
            try {
                const factorsResult = await window.userAuth.getEnrolledFactors();
                
                if (factorsResult.success && factorsResult.factors && factorsResult.factors.length > 0) {
                    hasMfa = true;
                }
            } catch (authError) {
                console.error('Error checking MFA status:', authError);
            }
        }

        // Update MFA status UI
        if (hasMfa) {
            mfaStatus.innerHTML = '<i class="fas fa-shield-alt"></i> <span>MFA is enabled</span>';
            mfaStatus.className = 'status-indicator enabled';
            setupMfaBtn.style.display = 'none';
            disableMfaBtn.style.display = 'block';
        } else {
            mfaStatus.innerHTML = '<i class="fas fa-shield-alt"></i> <span>MFA is not enabled</span>';
            mfaStatus.className = 'status-indicator disabled';
            setupMfaBtn.style.display = 'block';
            disableMfaBtn.style.display = 'none';
        }
    } catch (error) {
        console.error('Error checking MFA status:', error);
        mfaStatus.innerHTML = '<i class="fas fa-exclamation-triangle"></i> <span>Failed to check MFA status</span>';
    }
}

// Initialize MFA buttons
function initMfaButtons() {
    setupMfaBtn.addEventListener('click', () => {
        window.location.href = 'mfa-setup.html';
    });

    disableMfaBtn.addEventListener('click', async () => {
        // Show confirmation dialog
        showNotification(
            'Are you sure you want to disable Multi-Factor Authentication? This will reduce the security of your account.',
            'warning',
            [
                {
                    text: 'Yes, Disable MFA',
                    action: async () => {
                        try {
                            // Try to get enrolled factors
                            if (typeof window.userAuth !== 'undefined' && window.userAuth) {
                                const factorsResult = await window.userAuth.getEnrolledFactors();
                                
                                if (factorsResult.success && factorsResult.factors && factorsResult.factors.length > 0) {
                                    // Unenroll each factor
                                    for (const factor of factorsResult.factors) {
                                        const unenrollResult = await window.userAuth.unenrollMFA(factor);
                                        
                                        if (!unenrollResult.success) {
                                            throw new Error(unenrollResult.message || 'Failed to disable MFA');
                                        }
                                    }
                                    
                                    showNotification('MFA has been disabled successfully', 'success');
                                    
                                    // Update MFA status
                                    checkMfaStatus();
                                } else {
                                    throw new Error('No MFA factors found');
                                }
                            } else {
                                throw new Error('Authentication system is not available');
                            }
                        } catch (error) {
                            console.error('Error disabling MFA:', error);
                            showNotification('Failed to disable MFA: ' + error.message, 'error');
                        }
                    }
                },
                {
                    text: 'Cancel',
                    action: () => {
                        // Do nothing
                    }
                }
            ]
        );
    });
}

// Initialize delete account button
function initDeleteAccount() {
    deleteAccountBtn.addEventListener('click', () => {
        // Show confirmation dialog
        showNotification(
            'Are you sure you want to permanently delete your account? This action cannot be undone.',
            'warning',
            [
                {
                    text: 'Yes, Delete Account',
                    action: async () => {
                        try {
                            let success = false;

                            // Try to delete account using API client
                            if (typeof window.apiClient !== 'undefined' && window.apiClient) {
                                try {
                                    await window.apiClient.deleteAccount();
                                    success = true;
                                } catch (apiError) {
                                    console.error('Error deleting account with API:', apiError);
                                }
                            }

                            if (success) {
                                showNotification('Your account has been deleted successfully', 'success');
                                
                                // Redirect to login page after a short delay
                                setTimeout(() => {
                                    window.location.href = 'auth.html';
                                }, 2000);
                            } else {
                                showNotification('Failed to delete account', 'error');
                            }
                        } catch (error) {
                            console.error('Error deleting account:', error);
                            showNotification('An unexpected error occurred', 'error');
                        }
                    }
                },
                {
                    text: 'Cancel',
                    action: () => {
                        // Do nothing
                    }
                }
            ]
        );
    });
}

// Initialize sign out button
function initSignOut() {
    signOutBtn.addEventListener('click', () => {
        showNotification('Signing out...', 'info');
        setTimeout(() => {
            try {
                // Use API client for sign out if available
                if (typeof window.apiClient !== 'undefined' && window.apiClient) {
                    window.apiClient.logout();
                }
                
                // Fallback to UserAuth for sign out if available
                if (typeof window.userAuth !== 'undefined' && window.userAuth) {
                    window.userAuth.logout();
                }

                // Always clear localStorage and sessionStorage for backward compatibility
                localStorage.removeItem('username');
                localStorage.removeItem('rememberUser');
                localStorage.removeItem('currentUser');
                sessionStorage.removeItem('currentUser');
                localStorage.removeItem('jwt_token');
            } catch (error) {
                console.error('Error during sign out:', error);
                // Ensure we clear localStorage even if there's an error
                localStorage.removeItem('username');
                localStorage.removeItem('rememberUser');
                localStorage.removeItem('currentUser');
                sessionStorage.removeItem('currentUser');
                localStorage.removeItem('jwt_token');
            }

            // Redirect to auth page
            window.location.href = 'auth.html';
        }, 1000);
    });
}

// Notification function
function showNotification(message, type = 'info', actions = []) {
    const notificationArea = document.getElementById('notificationArea');

    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;

    // Icon based on type
    let icon = 'info-circle';
    if (type === 'success') icon = 'check-circle';
    if (type === 'error') icon = 'exclamation-circle';
    if (type === 'warning') icon = 'exclamation-triangle';

    // Create the notification content
    const notificationContent = document.createElement('div');
    notificationContent.className = 'notification-content';
    
    // Create the header
    const header = document.createElement('div');
    header.className = 'notification-header';
    header.innerHTML = `
        <i class="fas fa-${icon}"></i>
        <span class="notification-title">${type.charAt(0).toUpperCase() + type.slice(1)}</span>
    `;
    
    // Create the message
    const messageElement = document.createElement('p');
    messageElement.className = 'notification-message';
    messageElement.textContent = message;
    
    // Add header and message to content
    notificationContent.appendChild(header);
    notificationContent.appendChild(messageElement);
    
    // Add action buttons if provided
    if (actions && actions.length > 0) {
        const actionsContainer = document.createElement('div');
        actionsContainer.className = 'notification-actions';
        
        actions.forEach(action => {
            const actionButton = document.createElement('button');
            actionButton.className = 'notification-action-btn';
            actionButton.textContent = action.text;
            actionButton.addEventListener('click', () => {
                if (typeof action.action === 'function') {
                    action.action();
                }
                // Close the notification after action
                notification.style.opacity = '0';
                setTimeout(() => {
                    notification.remove();
                }, 300);
            });
            
            actionsContainer.appendChild(actionButton);
        });
        
        notificationContent.appendChild(actionsContainer);
    }
    
    // Create close button
    const closeBtn = document.createElement('button');
    closeBtn.className = 'notification-close';
    closeBtn.innerHTML = '<i class="fas fa-times"></i>';
    
    // Add content and close button to notification
    notification.appendChild(notificationContent);
    notification.appendChild(closeBtn);

    // Add to notification area
    notificationArea.appendChild(notification);

    // Add close button functionality
    closeBtn.addEventListener('click', function() {
        notification.style.opacity = '0';
        setTimeout(() => {
            notification.remove();
        }, 300);
    });

    // Auto remove after 10 seconds (longer for notifications with actions)
    const timeout = actions && actions.length > 0 ? 10000 : 5000;
    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.opacity = '0';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 300);
        }
    }, timeout);
}
