/**
 * LESAVOT - Authentication Initialization Script
 *
 * This script initializes the authentication system with a default admin user
 * if no users exist in the system.
 */

// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Check if userAuth is available
    if (typeof window.userAuth === 'undefined' || !window.userAuth) {
        console.error('UserAuth is not available');
        return;
    }

    // Check if there are any users in the system
    // We can't directly access the private users object, so we'll use a workaround
    // by checking if localStorage has any users
    const usersJson = localStorage.getItem('lesavot_users');
    const users = usersJson ? JSON.parse(usersJson) : {};
    const userCount = Object.keys(users).length;

    // If there are no users, create a default admin user
    if (userCount === 0) {
        console.log('No users found in the system. Creating default admin user...');

        // Create default admin user
        const adminResult = window.userAuth.register({
            username: 'admin',
            email: 'admin@lesavot.com',
            password: 'Admin@123',
            fullName: 'Administrator'
        });

        if (adminResult.success) {
            console.log('Default admin user created successfully.');
            console.log('Username: admin');
            console.log('Password: Admin@123');
        } else {
            console.error('Failed to create default admin user:', adminResult.message);
        }
    } else {
        console.log(`${userCount} user(s) found in the system. No need to create default admin.`);
    }
});
