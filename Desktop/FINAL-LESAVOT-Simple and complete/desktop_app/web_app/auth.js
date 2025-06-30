// LESAVOT - Authentication Page JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const signInForm = document.getElementById('signInForm');
    const signUpForm = document.getElementById('signUpForm');
    const showSignUpBtn = document.getElementById('showSignUpBtn');
    const showSignInBtn = document.getElementById('showSignInBtn');
    const signInBtn = document.getElementById('signInBtn');
    const signUpBtn = document.getElementById('signUpBtn');
    const signUpPassword = document.getElementById('signUpPassword');
    const confirmPassword = document.getElementById('confirmPassword');
    const strengthSegments = document.querySelectorAll('.strength-segment');
    const strengthText = document.querySelector('.strength-text');

    // Modal Elements
    const termsModal = document.getElementById('termsModal');
    const privacyModal = document.getElementById('privacyModal');
    const showTermsBtn = document.getElementById('showTermsBtn');
    const showPrivacyBtn = document.getElementById('showPrivacyBtn');
    const acceptTermsBtn = document.getElementById('acceptTermsBtn');

    const acceptPrivacyBtn = document.getElementById('acceptPrivacyBtn');
    const modalCloseBtns = document.querySelectorAll('.modal-close, .modal-close-btn');

    // Toggle between sign in and sign up forms
    showSignUpBtn.addEventListener('click', function(e) {
        e.preventDefault();
        signInForm.classList.remove('active');
        signUpForm.classList.add('active');
    });

    showSignInBtn.addEventListener('click', function(e) {
        e.preventDefault();
        signUpForm.classList.remove('active');
        signInForm.classList.add('active');
    });

    // Load remembered user data if available
    loadRememberedUser();

    // Password strength meter
    signUpPassword.addEventListener('input', function() {
        const password = this.value;
        const strength = calculatePasswordStrength(password);
        updateStrengthMeter(strength);
    });

    // Password toggle functionality
    const signInPasswordToggle = document.getElementById('signInPasswordToggle');
    const signUpPasswordToggle = document.getElementById('signUpPasswordToggle');
    const confirmPasswordToggle = document.getElementById('confirmPasswordToggle');

    if (signInPasswordToggle) {
        signInPasswordToggle.addEventListener('click', function() {
            togglePasswordVisibility('signInPassword', this);
        });
    }

    if (signUpPasswordToggle) {
        signUpPasswordToggle.addEventListener('click', function() {
            togglePasswordVisibility('signUpPassword', this);
        });
    }

    if (confirmPasswordToggle) {
        confirmPasswordToggle.addEventListener('click', function() {
            togglePasswordVisibility('confirmPassword', this);
        });
    }

    // Load remembered user function
    function loadRememberedUser() {
        try {
            const rememberedUser = JSON.parse(localStorage.getItem('lesavot_remember_user') || 'null');
            if (rememberedUser) {
                // Fill in the username field
                const usernameField = document.getElementById('signInUsername');
                if (usernameField) {
                    usernameField.value = rememberedUser.username || rememberedUser.email;
                }

                // Check the remember me checkbox
                const rememberMeCheckbox = document.getElementById('rememberMe');
                if (rememberMeCheckbox) {
                    rememberMeCheckbox.checked = true;
                }

                console.log('Loaded remembered user:', rememberedUser.username);
            }
        } catch (error) {
            console.error('Error loading remembered user:', error);
        }
    }

    // Password visibility toggle function
    function togglePasswordVisibility(inputId, toggleIcon) {
        const passwordInput = document.getElementById(inputId);
        if (!passwordInput) return;

        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            toggleIcon.classList.remove('fa-eye');
            toggleIcon.classList.add('fa-eye-slash');
        } else {
            passwordInput.type = 'password';
            toggleIcon.classList.remove('fa-eye-slash');
            toggleIcon.classList.add('fa-eye');
        }
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

    // MFA Modal Elements
    const mfaModal = document.getElementById('mfaModal');
    const verifyMfaBtn = document.getElementById('verifyMfaBtn');
    const mfaCode = document.getElementById('mfaCode');
    let currentMfaData = null;

    // Sign In button click handler
    signInBtn.addEventListener('click', async function() {
        const username = document.getElementById('signInUsername').value.trim();
        const password = document.getElementById('signInPassword').value;
        const rememberMe = document.getElementById('rememberMe').checked;

        // Validate input
        if (!username || !password) {
            showNotification('Please enter both username and password', 'error');
            return;
        }

        // Show loading notification
        showNotification('Authenticating...', 'info');

        try {
            // Try supabaseAuth first (our improved authentication system)
            if (typeof supabaseAuth !== 'undefined' && supabaseAuth) {
                console.log('Using supabaseAuth for login');

                // Attempt to login with username or email
                const result = await supabaseAuth.login(username, password, rememberMe);

                if (result.success) {
                    console.log('Login successful:', result.user);

                    // Check if MFA is required
                    try {
                        const factorsResult = await supabaseAuth.getEnrolledFactors();

                        if (factorsResult.success && factorsResult.factors && factorsResult.factors.length > 0) {
                            // User has MFA enabled, show MFA verification modal
                            showMfaModal(factorsResult.factors[0]);
                        } else {
                            // No MFA required, proceed with login
                            handleSuccessfulLogin(result.user, rememberMe);
                        }
                    } catch (mfaError) {
                        console.log('MFA check failed, proceeding without MFA');
                        handleSuccessfulLogin(result.user, rememberMe);
                    }
                } else {
                    // Show error message
                    showNotification(result.message, 'error');
                }
                return;
            }

            // Fallback to apiClient if supabaseAuth is not available
            if (typeof window.apiClient !== 'undefined' && window.apiClient) {
                console.log('Using apiClient for login');

                // Use email as username if it doesn't contain @
                const email = username.includes('@') ? username : `${username}@example.com`;

                try {
                    const result = await window.apiClient.login({
                        email,
                        password,
                        rememberMe
                    });

                    // Store user data
                    const user = result.user;

                    // Check if MFA is required (to be implemented in the API)
                    // For now, proceed with login
                    handleSuccessfulLogin(user, rememberMe);

                } catch (apiError) {
                    console.error('API login error:', apiError);
                    showNotification(apiError.message || 'wrong password, couldn\'t detect', 'error');
                }
                return;
            }

            // If no authentication system is available
            showNotification('Authentication system is not available. Please try again later.', 'error');

        } catch (error) {
            console.error('Authentication error:', error);
            showNotification('An error occurred during authentication. Please try again.', 'error');
        }
    });

    // Function to show MFA modal
    function showMfaModal(factorId) {
        // Store the factor ID for later use
        currentMfaData = { factorId };

        // Show the MFA modal
        mfaModal.style.display = 'block';
        document.body.style.overflow = 'hidden';

        // Focus on the MFA code input
        mfaCode.focus();

        // Create a challenge for the factor
        createMfaChallenge(factorId);
    }

    // Function to create MFA challenge
    async function createMfaChallenge(factorId) {
        try {
            const challengeResult = await supabaseAuth.challengeMFA(factorId);

            if (challengeResult.success) {
                currentMfaData.challengeId = challengeResult.challenge.id;
            } else {
                showNotification('Failed to create MFA challenge. Please try again.', 'error');
                mfaModal.style.display = 'none';
                document.body.style.overflow = '';
            }
        } catch (error) {
            console.error('Error creating MFA challenge:', error);
            showNotification('An error occurred during MFA setup. Please try again.', 'error');
            mfaModal.style.display = 'none';
            document.body.style.overflow = '';
        }
    }

    // Verify MFA button click handler
    verifyMfaBtn.addEventListener('click', async function() {
        const code = mfaCode.value.trim();

        if (!code || code.length !== 6 || !/^\d+$/.test(code)) {
            showNotification('Please enter a valid 6-digit verification code', 'error');
            return;
        }

        if (!currentMfaData || !currentMfaData.factorId || !currentMfaData.challengeId) {
            showNotification('MFA session expired. Please try logging in again.', 'error');
            mfaModal.style.display = 'none';
            document.body.style.overflow = '';
            return;
        }

        try {
            const verifyResult = await supabaseAuth.verifyMFA(
                currentMfaData.factorId,
                currentMfaData.challengeId,
                code
            );

            if (verifyResult.success) {
                // MFA verification successful
                mfaModal.style.display = 'none';
                document.body.style.overflow = '';

                // Get current user
                const user = await supabaseAuth.getCurrentUser();

                // Handle successful login
                handleSuccessfulLogin(user, document.getElementById('rememberMe').checked);
            } else {
                showNotification('Invalid verification code. Please try again.', 'error');
            }
        } catch (error) {
            console.error('Error verifying MFA:', error);
            showNotification('An error occurred during MFA verification. Please try again.', 'error');
        }
    });

    // Close MFA modal when clicking the close button
    document.querySelectorAll('#mfaModal .modal-close, #mfaModal .modal-close-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            mfaModal.style.display = 'none';
            document.body.style.overflow = '';
            currentMfaData = null;
        });
    });

    // Close MFA modal when clicking outside
    window.addEventListener('click', function(e) {
        if (e.target === mfaModal) {
            mfaModal.style.display = 'none';
            document.body.style.overflow = '';
            currentMfaData = null;
        }
    });

    // Function to handle successful login
    function handleSuccessfulLogin(user, rememberMe) {
        const displayName = user.fullName || user.username;

        // Show success message
        showNotification(`Welcome back, ${displayName}!`, 'success');

        if (rememberMe) {
            showNotification('Login credentials will be remembered', 'info');
        }

        // For backward compatibility, also store in the old format
        localStorage.setItem('username', user.username);
        if (rememberMe) {
            localStorage.setItem('rememberUser', 'true');
        }

        // Redirect to text steganography page after successful authentication
        setTimeout(() => {
            window.location.href = 'text_stego.html';
        }, 1000);
    }

    // Simulate database authentication (for demonstration purposes)
    function simulateAuthenticationWithDatabase(username, password) {
        // In a real application, this would be an API call to your backend
        // which would verify the credentials against your database

        // Show loading notification
        showNotification('Authenticating...', 'info');

        // For demonstration purposes, we'll simulate a successful login
        // with a slight delay to mimic a network request
        setTimeout(function() {
            // Always return success for demo purposes
            showNotification('Authentication successful', 'success');

            // In a real application with a database, you would:
            // 1. Send credentials to your backend API
            // 2. Verify username/password against database records
            // 3. If valid, generate and return authentication token
            // 4. If invalid, return error message

            // Redirect to text steganography page after successful authentication
            setTimeout(function() {
                window.location.href = 'text_stego.html';
            }, 500);
        }, 1000);
    }

    // Forgot Password functionality
    const forgotPasswordLink = document.querySelector('.forgot-password');
    forgotPasswordLink.addEventListener('click', function(e) {
        e.preventDefault();

        // Get the username if it's already entered
        const username = document.getElementById('signInUsername').value;

        // Show password reset form or prompt for email
        if (username) {
            showPasswordResetPrompt(username);
        } else {
            showNotification('Please enter your username first', 'info');
        }
    });

    // Function to show password reset prompt
    function showPasswordResetPrompt(username) {
        // In a real application with a database, you would:
        // 1. Verify the username exists in the database
        // 2. Generate a secure reset token
        // 3. Store the token in the database with an expiration time
        // 4. Send an email with a reset link containing the token

        // For demonstration purposes, we'll show a notification
        showNotification(`Password reset instructions would be sent to the email associated with username: ${username}`, 'info');

        // Simulate sending a password reset email
        setTimeout(function() {
            showNotification('If an account exists with this username, a password reset link has been sent to the associated email address.', 'success');

            // In a real application with a database, you would:
            // 1. Look up the user's email in the database
            // 2. Generate a time-limited secure token
            // 3. Store the token in the database
            // 4. Send an email with a link containing the token
            // 5. When the user clicks the link, verify the token and allow password reset
        }, 2000);
    }

    // Check for remembered user on page load
    window.addEventListener('load', function() {
        try {
            // Check if userAuth is available
            if (typeof window.userAuth === 'undefined' || !window.userAuth) {
                console.error('UserAuth is not available');

                // Fallback to legacy storage
                if (localStorage.getItem('rememberUser') === 'true') {
                    const rememberedUsername = localStorage.getItem('username');
                    if (rememberedUsername) {
                        document.getElementById('signInUsername').value = rememberedUsername;
                        document.getElementById('rememberMe').checked = true;
                        showNotification('Welcome back! Your username has been filled in automatically.', 'info');
                    }
                }
                return;
            }

            // Try to get remembered user from UserAuth
            const rememberedUser = window.userAuth.getRememberedUser();
            if (rememberedUser) {
                // Fill in the username and password fields
                document.getElementById('signInUsername').value = rememberedUser.username;
                document.getElementById('signInPassword').value = rememberedUser.password;
                document.getElementById('rememberMe').checked = true;

                // Show notification
                showNotification('Welcome back! Your login details have been filled in automatically.', 'info');

                // Add a button to the notification to auto-login
                const notification = document.querySelector('.notification.info');
                if (notification) {
                    const autoLoginBtn = document.createElement('button');
                    autoLoginBtn.className = 'auto-login-btn';
                    autoLoginBtn.textContent = 'Login Now';
                    autoLoginBtn.addEventListener('click', function() {
                        // Trigger the sign-in button click
                        signInBtn.click();
                    });

                    const notificationContent = notification.querySelector('.notification-content');
                    if (notificationContent) {
                        notificationContent.appendChild(autoLoginBtn);
                    }
                }
            } else {
                // Fallback to legacy storage
                if (localStorage.getItem('rememberUser') === 'true') {
                    const rememberedUsername = localStorage.getItem('username');
                    if (rememberedUsername) {
                        document.getElementById('signInUsername').value = rememberedUsername;
                        document.getElementById('rememberMe').checked = true;
                        showNotification('Welcome back! Your username has been filled in automatically.', 'info');
                    }
                }
            }
        } catch (error) {
            console.error('Error checking for remembered user:', error);

            // Fallback to legacy storage
            if (localStorage.getItem('rememberUser') === 'true') {
                const rememberedUsername = localStorage.getItem('username');
                if (rememberedUsername) {
                    document.getElementById('signInUsername').value = rememberedUsername;
                    document.getElementById('rememberMe').checked = true;
                    showNotification('Welcome back! Your username has been filled in automatically.', 'info');
                }
            }
        }
    });

    // Modal functionality
    showTermsBtn.addEventListener('click', function(e) {
        e.preventDefault();
        termsModal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    });

    showPrivacyBtn.addEventListener('click', function(e) {
        e.preventDefault();
        privacyModal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    });

    // Close modals
    modalCloseBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            termsModal.style.display = 'none';
            privacyModal.style.display = 'none';
            document.body.style.overflow = '';
        });
    });

    // Close modal when clicking outside
    window.addEventListener('click', function(e) {
        if (e.target === termsModal) {
            termsModal.style.display = 'none';
            document.body.style.overflow = '';
        }
        if (e.target === privacyModal) {
            privacyModal.style.display = 'none';
            document.body.style.overflow = '';
        }
    });

    // Accept buttons
    acceptTermsBtn.addEventListener('click', function() {
        document.getElementById('agreeTerms').checked = true;
        termsModal.style.display = 'none';
        document.body.style.overflow = '';
        showNotification('You have accepted the Terms of Service', 'success');
    });

    acceptPrivacyBtn.addEventListener('click', function() {
        document.getElementById('agreeTerms').checked = true;
        privacyModal.style.display = 'none';
        document.body.style.overflow = '';
        showNotification('You have accepted the Privacy Policy', 'success');
    });

    // Email validation
    const emailInput = document.getElementById('signUpEmail');
    emailInput.addEventListener('blur', function() {
        const email = this.value;
        if (email && !isValidEmail(email)) {
            this.classList.add('is-invalid');
            showNotification('Please enter a valid email address', 'warning');
        } else {
            this.classList.remove('is-invalid');
        }
    });

    function isValidEmail(email) {
        const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        return re.test(email);
    }

    // Sign Up button click handler
    signUpBtn.addEventListener('click', async function() {
        const username = document.getElementById('signUpUsername').value;
        const email = document.getElementById('signUpEmail').value;
        const password = document.getElementById('signUpPassword').value;
        const confirmPwd = document.getElementById('confirmPassword').value;
        const fullName = document.getElementById('signUpFullName')?.value || username; // Optional full name field
        const agreeTerms = document.getElementById('agreeTerms').checked;

        // Basic validation
        if (!username || !email || !password || !confirmPwd) {
            showNotification('Please fill in all fields', 'error');
            return;
        }

        if (!isValidEmail(email)) {
            showNotification('Please enter a valid email address', 'error');
            return;
        }

        if (password !== confirmPwd) {
            showNotification('Passwords do not match', 'error');
            return;
        }

        if (!agreeTerms) {
            showNotification('Please agree to the Terms of Service and Privacy Policy', 'error');
            return;
        }

        // Password strength check
        const strength = calculatePasswordStrength(password);
        if (strength < 3) {
            showNotification('Please use a stronger password for better security', 'warning');
            return;
        }

        // Show loading notification
        showNotification('Creating your account...', 'info');

        try {
            // Check if apiClient is available
            if (typeof window.apiClient === 'undefined' || !window.apiClient) {
                console.error('API Client is not available');

                // Fallback to supabaseAuth if available
                if (typeof supabaseAuth !== 'undefined' && supabaseAuth) {
                    // Register the user using Supabase
                    const result = await supabaseAuth.register({
                        username,
                        email,
                        password,
                        fullName
                    });

                    if (result.success) {
                        // Show success message
                        showNotification('Account created successfully! Please log in with your credentials.', 'success');

                        // Ask if they want to set up MFA
                        showNotification('Would you like to set up Multi-Factor Authentication for enhanced security?', 'info', [
                            {
                                text: 'Set up MFA',
                                action: () => {
                                    // Redirect to MFA setup page
                                    window.location.href = 'mfa-setup.html';
                                }
                            },
                            {
                                text: 'Skip for now',
                                action: () => {
                                    // Switch to the login form
                                    signUpForm.classList.remove('active');
                                    signInForm.classList.add('active');

                                    // Auto-fill the username field in the login form
                                    document.getElementById('signInUsername').value = email;

                                    // Focus on the password field
                                    document.getElementById('signInPassword').focus();
                                }
                            }
                        ]);
                    } else {
                        // Show error message
                        showNotification(result.message, 'error');
                    }
                } else {
                    showNotification('Registration system is not available. Please try again later.', 'error');
                }
                return;
            }

            // Register the user using API
            try {
                const result = await window.apiClient.register({
                    username,
                    email,
                    password,
                    fullName
                });

                // Show success message
                showNotification('Account created successfully! Please log in with your credentials.', 'success');

                // Ask if they want to set up MFA
                showNotification('Would you like to set up Multi-Factor Authentication for enhanced security?', 'info', [
                    {
                        text: 'Set up MFA',
                        action: () => {
                            // Redirect to MFA setup page
                            window.location.href = 'mfa-setup.html';
                        }
                    },
                    {
                        text: 'Skip for now',
                        action: () => {
                            // Switch to the login form
                            signUpForm.classList.remove('active');
                            signInForm.classList.add('active');

                            // Auto-fill the username field in the login form
                            document.getElementById('signInUsername').value = email;

                            // Focus on the password field
                            document.getElementById('signInPassword').focus();
                        }
                    }
                ]);
            } catch (apiError) {
                console.error('API registration error:', apiError);
                showNotification(apiError.message || 'Registration failed. Please try again.', 'error');
            }
        } catch (error) {
            console.error('Registration error:', error);
            showNotification('An error occurred during registration. Please try again.', 'error');
        }
    });

    // Notification function with optional action buttons
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
});
