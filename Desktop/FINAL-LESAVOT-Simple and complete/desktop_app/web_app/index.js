// LESAVOT - Welcome Page JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in using UserAuth if available
    let isLoggedIn = false;
    let displayName = '';

    try {
        // Check if userAuth is available in the global scope
        if (typeof window.userAuth !== 'undefined' && window.userAuth) {
            const currentUser = window.userAuth.getCurrentUser();
            if (currentUser) {
                isLoggedIn = true;
                // Use the full name if available, otherwise use username
                displayName = currentUser.fullName || currentUser.username;
            }
        } else {
            // Fallback to localStorage for backward compatibility
            const username = localStorage.getItem('username');
            if (username) {
                isLoggedIn = true;
                displayName = username;
            }
        }
    } catch (error) {
        console.error('Error checking user authentication:', error);
        // Fallback to localStorage as a last resort
        const username = localStorage.getItem('username');
        if (username) {
            isLoggedIn = true;
            displayName = username;
        }
    }

    // If user is logged in, show welcome message
    if (isLoggedIn) {
        // Create user info element if it doesn't exist
        if (!document.getElementById('userInfo')) {
            const header = document.querySelector('header .header-container');

            // Create user info element
            const userInfo = document.createElement('div');
            userInfo.className = 'user-info';
            userInfo.id = 'userInfo';

            // Create welcome message
            const welcomeMessage = document.createElement('span');
            welcomeMessage.id = 'welcomeMessage';
            welcomeMessage.textContent = `Welcome, ${displayName}`;

            // Create user actions container
            const userActions = document.createElement('div');
            userActions.className = 'user-actions';

            // Create profile button
            const profileBtn = document.createElement('button');
            profileBtn.type = 'button';
            profileBtn.className = 'btn-icon';
            profileBtn.title = 'Profile';
            profileBtn.innerHTML = '<i class="fas fa-user"></i>';

            // Create sign out button
            const signOutBtn = document.createElement('a');
            signOutBtn.href = 'auth.html';
            signOutBtn.className = 'btn-icon active-logout';
            signOutBtn.title = 'Sign Out';
            signOutBtn.id = 'signOutBtn';
            signOutBtn.innerHTML = '<i class="fas fa-sign-out-alt"></i>';

            // Add event listener to sign out button
            signOutBtn.addEventListener('click', function() {
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
            });

            // Append elements
            userActions.appendChild(profileBtn);
            userActions.appendChild(signOutBtn);
            userInfo.appendChild(welcomeMessage);
            userInfo.appendChild(userActions);

            // Insert after header container
            header.parentNode.insertBefore(userInfo, header.nextSibling);
        } else {
            // Update existing welcome message
            document.getElementById('welcomeMessage').textContent = `Welcome, ${displayName}`;
        }

        // Update CTA button to go directly to text_stego.html instead of auth.html
        const ctaButton = document.querySelector('.cta-button');
        if (ctaButton) {
            ctaButton.href = 'text_stego.html';
            ctaButton.innerHTML = '<i class="fas fa-shield-alt"></i> ENTER SECURE PLATFORM';
        }
    }

    // Initialize notification area
    const notificationArea = document.getElementById('notificationArea');
    if (notificationArea) {
        // Show welcome notification
        showNotification('Welcome to LESAVOT Steganography Platform', 'info');
    }
});

// Enhanced Notification system
function showNotification(message, type = 'info', details = null) {
    const notificationArea = document.getElementById('notificationArea');
    if (!notificationArea) return;

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
        title = 'Success';
    } else if (type === 'error') {
        icon = 'exclamation-triangle';
        title = 'Error';
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

    notification.querySelector('.notification-close').addEventListener('click', function() {
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
