// LESAVOT - History Page JavaScript

// DOM Elements
const typeFilter = document.getElementById('typeFilter');
const modeFilter = document.getElementById('modeFilter');
const clearHistoryBtn = document.getElementById('clearHistoryBtn');
const historyTableBody = document.getElementById('historyTableBody');
const prevPageBtn = document.getElementById('prevPageBtn');
const nextPageBtn = document.getElementById('nextPageBtn');
const paginationInfo = document.getElementById('paginationInfo');
const signOutBtn = document.getElementById('signOutBtn');
const notificationArea = document.getElementById('notificationArea');

// State
let currentPage = 1;
let totalPages = 1;
let currentFilters = {
    type: '',
    mode: ''
};

// Initialize application
document.addEventListener('DOMContentLoaded', () => {
    initFilters();
    initPagination();
    initClearHistory();
    initSignOut();
    loadHistory();
    displayWelcomeMessage();
});

// Initialize filters
function initFilters() {
    typeFilter.addEventListener('change', () => {
        currentFilters.type = typeFilter.value;
        currentPage = 1;
        loadHistory();
    });

    modeFilter.addEventListener('change', () => {
        currentFilters.mode = modeFilter.value;
        currentPage = 1;
        loadHistory();
    });
}

// Initialize pagination
function initPagination() {
    prevPageBtn.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            loadHistory();
        }
    });

    nextPageBtn.addEventListener('click', () => {
        if (currentPage < totalPages) {
            currentPage++;
            loadHistory();
        }
    });
}

// Initialize clear history button
function initClearHistory() {
    clearHistoryBtn.addEventListener('click', () => {
        // Show confirmation dialog
        showNotification(
            'Are you sure you want to clear your entire operation history?',
            'warning',
            [
                {
                    text: 'Yes, Clear History',
                    action: () => {
                        clearAllHistory();
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

// Load history from API
async function loadHistory() {
    // Show loading state
    historyTableBody.innerHTML = `
        <tr class="loading-row">
            <td colspan="6">Loading history...</td>
        </tr>
    `;

    try {
        // Check if API client is available
        if (typeof window.apiClient === 'undefined' || !window.apiClient) {
            throw new Error('API client not available');
        }

        // Build query parameters
        const params = {
            page: currentPage,
            limit: 10
        };

        if (currentFilters.type) {
            params.type = currentFilters.type;
        }

        if (currentFilters.mode) {
            params.mode = currentFilters.mode;
        }

        // Fetch history from API
        const result = await window.apiClient.getHistory(params);

        // Update pagination
        totalPages = result.pagination.pages;
        updatePaginationUI();

        // Render history entries
        renderHistoryEntries(result.data.history);
    } catch (error) {
        console.error('Error loading history:', error);
        historyTableBody.innerHTML = `
            <tr class="empty-row">
                <td colspan="6">
                    <i class="fas fa-exclamation-circle"></i> 
                    Failed to load history. Please try again later.
                </td>
            </tr>
        `;
        showNotification('Failed to load operation history', 'error');
    }
}

// Render history entries
function renderHistoryEntries(entries) {
    if (!entries || entries.length === 0) {
        historyTableBody.innerHTML = `
            <tr class="empty-row">
                <td colspan="6">
                    <i class="fas fa-history"></i> 
                    No operation history found. Start using the steganography tools to see your history here.
                </td>
            </tr>
        `;
        return;
    }

    // Clear table
    historyTableBody.innerHTML = '';

    // Add entries
    entries.forEach(entry => {
        const row = document.createElement('tr');
        
        // Format date
        const date = new Date(entry.created_at);
        const formattedDate = date.toLocaleString();

        // Create row content
        row.innerHTML = `
            <td>${formattedDate}</td>
            <td><span class="type-badge ${entry.type}">${entry.type}</span></td>
            <td><span class="mode-badge ${entry.mode}">${entry.mode}</span></td>
            <td>
                <span class="password-indicator ${entry.has_password ? 'yes' : 'no'}"></span>
                ${entry.has_password ? 'Yes' : 'No'}
            </td>
            <td>
                <div class="details-tooltip">
                    <i class="fas fa-info-circle"></i>
                    <div class="tooltip-text">
                        <strong>Content Length:</strong> ${entry.metadata.contentLength || 'N/A'}<br>
                        <strong>Message Length:</strong> ${entry.metadata.messageLength || 'N/A'}<br>
                        <strong>Created:</strong> ${formattedDate}
                    </div>
                </div>
            </td>
            <td>
                <div class="action-buttons">
                    <button class="action-btn delete" data-id="${entry.id}" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;

        // Add delete event listener
        const deleteBtn = row.querySelector('.action-btn.delete');
        deleteBtn.addEventListener('click', () => {
            deleteHistoryEntry(entry.id);
        });

        // Add row to table
        historyTableBody.appendChild(row);
    });
}

// Update pagination UI
function updatePaginationUI() {
    paginationInfo.textContent = `Page ${currentPage} of ${totalPages}`;
    
    // Update button states
    prevPageBtn.disabled = currentPage <= 1;
    nextPageBtn.disabled = currentPage >= totalPages;
}

// Delete history entry
async function deleteHistoryEntry(id) {
    try {
        // Check if API client is available
        if (typeof window.apiClient === 'undefined' || !window.apiClient) {
            throw new Error('API client not available');
        }

        // Delete entry
        await window.apiClient.deleteHistoryEntry(id);

        // Reload history
        loadHistory();

        // Show success message
        showNotification('History entry deleted successfully', 'success');
    } catch (error) {
        console.error('Error deleting history entry:', error);
        showNotification('Failed to delete history entry', 'error');
    }
}

// Clear all history
async function clearAllHistory() {
    try {
        // Check if API client is available
        if (typeof window.apiClient === 'undefined' || !window.apiClient) {
            throw new Error('API client not available');
        }

        // Clear history
        await window.apiClient.clearHistory();

        // Reload history
        loadHistory();

        // Show success message
        showNotification('Operation history cleared successfully', 'success');
    } catch (error) {
        console.error('Error clearing history:', error);
        showNotification('Failed to clear operation history', 'error');
    }
}

// Display welcome message
function displayWelcomeMessage() {
    try {
        // Check if userAuth is available in the global scope
        if (typeof window.userAuth !== 'undefined' && window.userAuth) {
            const currentUser = window.userAuth.getCurrentUser();
            if (currentUser) {
                // Use the full name if available, otherwise use username
                const displayName = currentUser.fullName || currentUser.username;
                document.getElementById('welcomeMessage').textContent = `Welcome, ${displayName}`;
                return; // Exit early if we successfully displayed the welcome message
            }
        }

        // Check if API client is available
        if (typeof window.apiClient !== 'undefined' && window.apiClient) {
            window.apiClient.getCurrentUser()
                .then(response => {
                    const user = response.user;
                    const displayName = user.full_name || user.username;
                    document.getElementById('welcomeMessage').textContent = `Welcome, ${displayName}`;
                })
                .catch(error => {
                    console.error('Error getting current user:', error);
                    // Fallback to localStorage
                    fallbackWelcomeMessage();
                });
        } else {
            // Fallback to localStorage
            fallbackWelcomeMessage();
        }
    } catch (error) {
        console.error('Error displaying welcome message:', error);
        // Fallback to localStorage
        fallbackWelcomeMessage();
    }
}

// Fallback welcome message
function fallbackWelcomeMessage() {
    // Fallback to localStorage for backward compatibility
    const username = localStorage.getItem('username');
    if (username) {
        document.getElementById('welcomeMessage').textContent = `Welcome, ${username}`;
    }
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
