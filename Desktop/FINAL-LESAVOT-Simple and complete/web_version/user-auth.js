/**
 * LESAVOT - User Authentication System
 *
 * This module provides user authentication functionality with local storage
 * that can be easily adapted to work with a database in the future.
 */

// User Authentication Class
class UserAuth {
    constructor() {
        // Initialize storage
        this.users = this._loadUsers();
        this.currentUser = this._loadCurrentUser();
    }

    /**
     * Register a new user
     * @param {Object} userData - User data including username, email, password, fullName
     * @returns {Object} - Result object with success status and message
     */
    register(userData) {
        // Check if username already exists
        if (this.users[userData.username]) {
            return {
                success: false,
                message: 'Username already exists'
            };
        }

        // Check if email already exists
        const emailExists = Object.values(this.users).some(user => user.email === userData.email);
        if (emailExists) {
            return {
                success: false,
                message: 'Email already in use'
            };
        }

        // In a real application, you would hash the password here
        // For demo purposes, we'll store it as is (NOT SECURE)
        // const hashedPassword = this._hashPassword(userData.password);

        // Create user object
        const newUser = {
            username: userData.username,
            email: userData.email,
            password: userData.password, // In real app: hashedPassword
            fullName: userData.fullName || userData.username, // Use fullName if provided, otherwise use username
            createdAt: new Date().toISOString(),
            lastLogin: null
        };

        // Add user to storage
        this.users[userData.username] = newUser;
        this._saveUsers();

        return {
            success: true,
            message: 'User registered successfully'
        };
    }

    /**
     * Authenticate a user
     * @param {string} username - Username
     * @param {string} password - Password
     * @param {boolean} rememberMe - Whether to remember the user
     * @returns {Object} - Result object with success status, message, and user data
     */
    login(username, password, rememberMe = false) {
        // Check if user exists
        const user = this.users[username];
        if (!user) {
            return {
                success: false,
                message: 'Invalid username or password'
            };
        }

        // In a real application, you would verify the hashed password
        // For demo purposes, we'll compare directly (NOT SECURE)
        if (user.password !== password) {
            return {
                success: false,
                message: 'Invalid username or password'
            };
        }

        // Update last login
        user.lastLogin = new Date().toISOString();
        this._saveUsers();

        // Set current user
        this.currentUser = {
            username: user.username,
            email: user.email,
            fullName: user.fullName
        };

        // Save current user to storage
        this._saveCurrentUser(rememberMe);

        return {
            success: true,
            message: 'Login successful',
            user: this.currentUser
        };
    }

    /**
     * Log out the current user
     * @returns {Object} - Result object with success status and message
     */
    logout() {
        this.currentUser = null;

        // Clear session storage
        sessionStorage.removeItem('currentUser');

        // Clear all remembered user data
        this._clearRememberedUser();

        // Clear legacy storage
        localStorage.removeItem('username');
        localStorage.removeItem('rememberUser');

        return {
            success: true,
            message: 'Logout successful'
        };
    }

    /**
     * Get the current logged-in user
     * @returns {Object|null} - Current user data or null if not logged in
     */
    getCurrentUser() {
        return this.currentUser;
    }

    /**
     * Check if a user is logged in
     * @returns {boolean} - True if a user is logged in, false otherwise
     */
    isLoggedIn() {
        return this.currentUser !== null;
    }

    /**
     * Update user profile
     * @param {Object} userData - User data to update
     * @returns {Object} - Result object with success status and message
     */
    updateProfile(userData) {
        if (!this.currentUser) {
            return {
                success: false,
                message: 'No user is logged in'
            };
        }

        const user = this.users[this.currentUser.username];
        if (!user) {
            return {
                success: false,
                message: 'User not found'
            };
        }

        // Update user data
        if (userData.fullName) user.fullName = userData.fullName;
        if (userData.email) user.email = userData.email;

        // Update current user
        this.currentUser.fullName = user.fullName;
        this.currentUser.email = user.email;

        // Save changes
        this._saveUsers();
        this._saveCurrentUser(true);

        return {
            success: true,
            message: 'Profile updated successfully'
        };
    }

    /**
     * Change user password
     * @param {string} currentPassword - Current password
     * @param {string} newPassword - New password
     * @returns {Object} - Result object with success status and message
     */
    changePassword(currentPassword, newPassword) {
        if (!this.currentUser) {
            return {
                success: false,
                message: 'No user is logged in'
            };
        }

        const user = this.users[this.currentUser.username];

        // Verify current password
        if (user.password !== currentPassword) {
            return {
                success: false,
                message: 'Current password is incorrect'
            };
        }

        // Update password
        // In a real application, you would hash the new password
        user.password = newPassword;
        this._saveUsers();

        return {
            success: true,
            message: 'Password changed successfully'
        };
    }

    /**
     * Load users from storage
     * @private
     * @returns {Object} - Users object
     */
    _loadUsers() {
        const usersJson = localStorage.getItem('lesavot_users');
        return usersJson ? JSON.parse(usersJson) : {};
    }

    /**
     * Save users to storage
     * @private
     */
    _saveUsers() {
        localStorage.setItem('lesavot_users', JSON.stringify(this.users));
    }

    /**
     * Load current user from storage
     * @private
     * @returns {Object|null} - Current user data or null
     */
    _loadCurrentUser() {
        // Try session storage first (for session-only login)
        let currentUserJson = sessionStorage.getItem('currentUser');

        // If not found in session storage, try local storage (for remembered login)
        if (!currentUserJson) {
            currentUserJson = localStorage.getItem('currentUser');
        }

        return currentUserJson ? JSON.parse(currentUserJson) : null;
    }

    /**
     * Save current user to storage
     * @private
     * @param {boolean} remember - Whether to remember the user across sessions
     */
    _saveCurrentUser(remember) {
        if (this.currentUser) {
            // Always save to session storage
            sessionStorage.setItem('currentUser', JSON.stringify(this.currentUser));

            // If remember is true, also save to local storage
            if (remember) {
                localStorage.setItem('currentUser', JSON.stringify(this.currentUser));

                // Store the username for the login form
                localStorage.setItem('remembered_username', this.currentUser.username);

                // Create a secure token for the password (in a real app, this would be much more secure)
                // This is a simplified version for demonstration purposes
                const secureToken = this._createSecureToken(this.currentUser.username);
                localStorage.setItem('auth_token', secureToken);
            } else {
                localStorage.removeItem('currentUser');
                localStorage.removeItem('remembered_username');
                localStorage.removeItem('auth_token');
            }
        }
    }

    /**
     * Create a secure token for remembering the user
     * @private
     * @param {string} username - The username to create a token for
     * @returns {string} - A secure token
     */
    _createSecureToken(username) {
        // In a real application, this would:
        // 1. Generate a cryptographically secure random token
        // 2. Hash it with a server-side secret
        // 3. Store the token in a database with an expiration date
        // 4. Return only the token to the client

        // For demonstration purposes, we'll create a simple token
        // DO NOT use this in production - it's not secure!
        const timestamp = new Date().getTime();
        const randomPart = Math.random().toString(36).substring(2, 15);

        // In a real app, this would be encrypted or at least hashed with a secret key
        return btoa(`${username}:${timestamp}:${randomPart}`);
    }

    /**
     * Verify a secure token
     * @private
     * @param {string} token - The token to verify
     * @returns {string|null} - The username if valid, null if invalid
     */
    _verifySecureToken(token) {
        try {
            // In a real application, this would:
            // 1. Verify the token against the database
            // 2. Check if the token has expired
            // 3. Return the associated username if valid

            // For demonstration purposes, we'll decode the simple token
            // DO NOT use this in production - it's not secure!
            const decoded = atob(token);
            const parts = decoded.split(':');

            if (parts.length !== 3) {
                return null;
            }

            const username = parts[0];
            const timestamp = parseInt(parts[1]);

            // Check if the token is expired (24 hours)
            const now = new Date().getTime();
            if (now - timestamp > 24 * 60 * 60 * 1000) {
                return null;
            }

            // Check if the user exists
            if (!this.users[username]) {
                return null;
            }

            return username;
        } catch (error) {
            console.error('Error verifying token:', error);
            return null;
        }
    }

    /**
     * Check if there's a remembered user and get their credentials
     * @returns {Object|null} - The remembered user credentials or null
     */
    getRememberedUser() {
        try {
            const username = localStorage.getItem('remembered_username');
            const token = localStorage.getItem('auth_token');

            if (!username || !token) {
                return null;
            }

            // Verify the token
            const verifiedUsername = this._verifySecureToken(token);
            if (!verifiedUsername || verifiedUsername !== username) {
                // Token is invalid or doesn't match the username
                this._clearRememberedUser();
                return null;
            }

            // Get the user from storage
            const user = this.users[username];
            if (!user) {
                this._clearRememberedUser();
                return null;
            }

            return {
                username: user.username,
                // In a real app, you would NEVER return the actual password
                // This is just for demonstration purposes
                password: user.password
            };
        } catch (error) {
            console.error('Error getting remembered user:', error);
            return null;
        }
    }

    /**
     * Clear remembered user data
     * @private
     */
    _clearRememberedUser() {
        localStorage.removeItem('remembered_username');
        localStorage.removeItem('auth_token');
        localStorage.removeItem('currentUser');
    }

    /**
     * Clear all user data from the system (private method)
     * This will remove all registered users and reset the authentication system
     * @private
     * @returns {Object} - Result object with success status and message
     */
    _clearAllUserData() {
        // Clear all user data
        this.users = {};
        this._saveUsers();

        // Clear current user
        this.currentUser = null;

        // Clear all storage
        localStorage.removeItem('lesavot_users');
        localStorage.removeItem('currentUser');
        sessionStorage.removeItem('currentUser');

        // Clear remembered user data
        this._clearRememberedUser();

        // Clear legacy storage
        localStorage.removeItem('username');
        localStorage.removeItem('rememberUser');
        localStorage.removeItem('registered_username');

        return {
            success: true,
            message: 'All user data has been cleared'
        };
    }

    // In a real application, you would implement password hashing here
    // _hashPassword(password) {
    //     // This would use a secure hashing algorithm like bcrypt
    //     // For demo purposes, we're not implementing actual hashing
    //     return password;
    // }
}

// Create a singleton instance and make it available globally
const userAuth = new UserAuth();

// Make sure userAuth is available in the global scope for browser usage
if (typeof window !== 'undefined') {
    window.userAuth = userAuth;
}
