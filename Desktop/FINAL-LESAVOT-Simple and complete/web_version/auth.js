// LESAVOT - Authentication Page JavaScript (with secure password hashing and advanced toggle)

// SHA-256 hashing utility
async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

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
    const signInPassword = document.getElementById('signInPassword');

    // OTP Modal Elements (dynamically created)
    let otpModal = null;
    let otpInput = null;
    let otpSubmitBtn = null;
    let otpUsername = '';

    // Password visibility toggle state for each field
    const passwordToggleStates = {
        signInPassword: 0,
        signUpPassword: 0,
        confirmPassword: 0
    };

    // Secure, accessible password toggle logic
    function togglePasswordVisibility(input, toggleBtn, stateKey) {
        if (passwordToggleStates[stateKey] === 0) {
            input.type = 'text';
            toggleBtn.classList.remove('fa-eye');
            toggleBtn.classList.add('fa-eye-slash');
            toggleBtn.setAttribute('aria-label', 'Hide password');
            passwordToggleStates[stateKey] = 1;
        } else {
            input.type = 'password';
            toggleBtn.classList.remove('fa-eye-slash');
            toggleBtn.classList.add('fa-eye');
            toggleBtn.setAttribute('aria-label', 'Show password');
            passwordToggleStates[stateKey] = 0;
        }
    }

    // Password suggestion logic
    function generateStrongPassword() {
        // 20+ chars, mix of upper, lower, digits, symbols
        const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const lower = 'abcdefghijklmnopqrstuvwxyz';
        const digits = '0123456789';
        const symbols = '!@#$%^&*()-_=+[]{}|;:,.<>?';
        const all = upper + lower + digits + symbols;
        let password = '';
        // Ensure at least one of each type
        password += upper[Math.floor(Math.random() * upper.length)];
        password += lower[Math.floor(Math.random() * lower.length)];
        password += digits[Math.floor(Math.random() * digits.length)];
        password += symbols[Math.floor(Math.random() * symbols.length)];
        for (let i = 4; i < 24; i++) {
            password += all[Math.floor(Math.random() * all.length)];
        }
        // Shuffle password
        password = password.split('').sort(() => 0.5 - Math.random()).join('');
        return password;
    }

    // Add suggest password button to signup form
    const suggestBtn = document.createElement('button');
    suggestBtn.type = 'button';
    suggestBtn.className = 'btn btn-outline password-suggest-btn';
    suggestBtn.textContent = 'Suggest Strong Password';
    const signUpPasswordGroup = signUpPassword.closest('.form-group');
    if (signUpPasswordGroup) {
        signUpPasswordGroup.appendChild(suggestBtn);
    }
    suggestBtn.addEventListener('click', function() {
        const strongPassword = generateStrongPassword();
        signUpPassword.value = strongPassword;
        confirmPassword.value = strongPassword;
        signUpPassword.dispatchEvent(new Event('input'));
        showNotification('A strong password has been suggested. You can use or edit it.', 'info');
    });

    // Password toggle event listeners (consistent, accessible, secure)
    const signInPasswordToggle = document.getElementById('signInPasswordToggle');
    if (signInPasswordToggle) {
        signInPasswordToggle.setAttribute('tabindex', '0');
        signInPasswordToggle.setAttribute('role', 'button');
        signInPasswordToggle.setAttribute('aria-label', 'Show password');
        signInPasswordToggle.addEventListener('click', function() {
            togglePasswordVisibility(signInPassword, this, 'signInPassword');
        });
        signInPasswordToggle.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                togglePasswordVisibility(signInPassword, this, 'signInPassword');
            }
        });
    }
    const signUpPasswordToggle = document.getElementById('signUpPasswordToggle');
    if (signUpPasswordToggle) {
        signUpPasswordToggle.setAttribute('tabindex', '0');
        signUpPasswordToggle.setAttribute('role', 'button');
        signUpPasswordToggle.setAttribute('aria-label', 'Show password');
        signUpPasswordToggle.addEventListener('click', function() {
            togglePasswordVisibility(signUpPassword, this, 'signUpPassword');
        });
        signUpPasswordToggle.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                togglePasswordVisibility(signUpPassword, this, 'signUpPassword');
            }
        });
    }
    const confirmPasswordToggle = document.getElementById('confirmPasswordToggle');
    if (confirmPasswordToggle) {
        confirmPasswordToggle.setAttribute('tabindex', '0');
        confirmPasswordToggle.setAttribute('role', 'button');
        confirmPasswordToggle.setAttribute('aria-label', 'Show password');
        confirmPasswordToggle.addEventListener('click', function() {
            togglePasswordVisibility(confirmPassword, this, 'confirmPassword');
        });
        confirmPasswordToggle.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                togglePasswordVisibility(confirmPassword, this, 'confirmPassword');
            }
        });
    }

    // Toggle between sign in and sign up forms
    showSignUpBtn.addEventListener('click', function(e) {
        e.preventDefault();
        signInForm.classList.remove('active');
        signUpForm.classList.add('active');
        // Clear signup fields
        document.getElementById('signUpFullName').value = '';
        document.getElementById('signUpUsername').value = '';
        document.getElementById('signUpEmail').value = '';
        document.getElementById('signUpPassword').value = '';
        document.getElementById('confirmPassword').value = '';
    });

    // On page load, ensure signup fields are empty
    document.getElementById('signUpFullName').value = '';
    document.getElementById('signUpUsername').value = '';
    document.getElementById('signUpEmail').value = '';
    document.getElementById('signUpPassword').value = '';
    document.getElementById('confirmPassword').value = '';
    showSignInBtn.addEventListener('click', function(e) {
        e.preventDefault();
        signUpForm.classList.remove('active');
        signInForm.classList.add('active');
        // Clear sign in fields
        document.getElementById('signInUsername').value = '';
        document.getElementById('signInPassword').value = '';
    });

    // On page load, ensure sign in fields are empty
    document.getElementById('signInUsername').value = '';
    document.getElementById('signInPassword').value = '';

    // Autofill + fingerprint for password field
    const signInUsername = document.getElementById('signInUsername');
    const signInPasswordInput = document.getElementById('signInPassword');
    let autofillFingerprintRequested = false;
    signInPasswordInput.addEventListener('input', async function(e) {
        // Detect autofill: if both username and password are filled quickly, likely autofill
        if (
            signInUsername.value &&
            signInPasswordInput.value &&
            !autofillFingerprintRequested &&
            (document.activeElement !== signInPasswordInput)
        ) {
            autofillFingerprintRequested = true;
            // Prompt for fingerprint authentication (WebAuthn)
            if (window.PublicKeyCredential) {
                try {
                    await navigator.credentials.get({ publicKey: { challenge: new Uint8Array(32), timeout: 60000, userVerification: 'required' } });
                    showNotification('Fingerprint verified. You may now sign in.', 'success');
                } catch (e) {
                    showNotification('Fingerprint authentication failed or was cancelled.', 'error');
                }
            }
        }
    });
    signInPasswordInput.addEventListener('keydown', function() {
        autofillFingerprintRequested = false;
    });

    // Password strength meter
    signUpPassword.addEventListener('input', function() {
        const password = this.value;
        const strength = calculatePasswordStrength(password);
        updateStrengthMeter(strength);
    });

    // Calculate password strength (0-4)
    function calculatePasswordStrength(password) {
        if (!password) return 0;
        let strength = 0;
        if (password.length >= 8) strength += 1;
        if (/[A-Z]/.test(password)) strength += 1;
        if (/[0-9]/.test(password)) strength += 1;
        if (/[^A-Za-z0-9]/.test(password)) strength += 1;
        return strength;
    }
    function updateStrengthMeter(strength) {
        strengthSegments.forEach(segment => { segment.className = 'strength-segment'; });
        for (let i = 0; i < strength; i++) {
            if (i < strengthSegments.length) {
                if (strength === 1) strengthSegments[i].classList.add('weak');
                else if (strength === 2 || strength === 3) strengthSegments[i].classList.add('medium');
                else strengthSegments[i].classList.add('strong');
            }
        }
        if (strength === 0) strengthText.textContent = 'Password strength';
        else if (strength === 1) strengthText.textContent = 'Weak';
        else if (strength === 2) strengthText.textContent = 'Fair';
        else if (strength === 3) strengthText.textContent = 'Good';
        else strengthText.textContent = 'Strong';
    }

    // Sign Up button click handler (now uses backend API)
    signUpBtn.addEventListener('click', async function() {
        const username = document.getElementById('signUpUsername').value;
        const email = document.getElementById('signUpEmail').value;
        const password = document.getElementById('signUpPassword').value;
        const confirmPwd = document.getElementById('confirmPassword').value;
        const fullName = document.getElementById('signUpFullName')?.value || username;
        const agreeTerms = document.getElementById('agreeTerms').checked;
        if (!username || !email || !password || !confirmPwd) { showNotification('Please fill in all fields', 'error'); return; }
        if (!isValidEmail(email)) { showNotification('Please enter a valid email address', 'error'); return; }
        if (password !== confirmPwd) { showNotification('Passwords do not match', 'error'); return; }
        if (!agreeTerms) { showNotification('Please agree to the Terms of Service and Privacy Policy', 'error'); return; }
        const strength = calculatePasswordStrength(password);
        if (strength < 3) { showNotification('Please use a stronger password for better security', 'warning'); return; }
        showNotification('Creating your account...', 'info');
        try {
            // Use proper API endpoint for signup
            const apiUrl = window.CONFIG ? window.CONFIG.getApiUrl('auth/signup') : '/api/v1/auth/signup';
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username,
                    email,
                    password,
                    fullName
                })
            });
            const data = await response.json();
            if (response.ok) {
                showNotification('Account created successfully! Please log in with your credentials.', 'success');
                signUpForm.classList.remove('active');
                signInForm.classList.add('active');
                document.getElementById('signInUsername').value = username;
                document.getElementById('signInPassword').focus();
            } else {
                showNotification(data.message || 'Registration failed. Please try again.', 'error');
            }
        } catch (error) {
            console.error('Registration error:', error);
            showNotification('An error occurred during registration. Please try again.', 'error');
        }
    });

    // Sign In button click handler (now uses backend and OTP)
    signInBtn.addEventListener('click', async function() {
        const username = document.getElementById('signInUsername').value.trim();
        const password = document.getElementById('signInPassword').value;
        const rememberMe = document.getElementById('rememberMe').checked;
        if (!username || !password) { showNotification('Please enter both username and password', 'error'); return; }
        showNotification('Authenticating...', 'info');
        try {
            // Use proper API endpoint for login
            const apiUrl = window.CONFIG ? window.CONFIG.getApiUrl('auth/login') : '/api/v1/auth/login';
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password, rememberMe })
            });
            const data = await response.json();
            if (response.ok) {
                showNotification('OTP sent to your email. Please enter it to continue.', 'info');
                otpUsername = username;
                showOtpModal();
            } else {
                showNotification(data.message || 'Invalid username or password', 'error');
            }
        } catch (error) {
            console.error('Authentication error:', error);
            showNotification('An error occurred during authentication. Please try again.', 'error');
        }
    });

    // Show OTP modal/input with Resend OTP feature
    function showOtpModal() {
        if (otpModal) otpModal.remove();
        otpModal = document.createElement('div');
        otpModal.className = 'otp-modal';
        otpModal.innerHTML = `
            <div class="otp-modal-content">
                <h3>Enter OTP</h3>
                <input type="text" id="otpInput" maxlength="6" placeholder="Enter 6-digit OTP" autocomplete="one-time-code" />
                <button id="otpSubmitBtn" class="btn btn-primary">Verify OTP</button>
                <button id="otpResendBtn" class="btn btn-link">Resend OTP</button>
                <span id="otpResendCooldown" style="margin-left:10px;color:#888;"></span>
                <button id="otpCancelBtn" class="btn btn-secondary">Cancel</button>
            </div>
        `;
        document.body.appendChild(otpModal);
        otpInput = document.getElementById('otpInput');
        otpSubmitBtn = document.getElementById('otpSubmitBtn');
        const otpResendBtn = document.getElementById('otpResendBtn');
        const otpResendCooldown = document.getElementById('otpResendCooldown');
        const otpCancelBtn = document.getElementById('otpCancelBtn');
        otpInput.focus();
        otpSubmitBtn.addEventListener('click', submitOtp);
        otpCancelBtn.addEventListener('click', function() {
            otpModal.remove();
        });
        otpInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') submitOtp();
        });
        // Resend OTP logic with cooldown
        let resendCooldown = 0;
        let resendInterval = null;
        function startResendCooldown() {
            resendCooldown = 10;
            otpResendBtn.disabled = true;
            otpResendBtn.style.pointerEvents = 'none';
            otpResendCooldown.textContent = `Resend available in ${resendCooldown}s`;
            resendInterval = setInterval(() => {
                resendCooldown--;
                if (resendCooldown > 0) {
                    otpResendCooldown.textContent = `Resend available in ${resendCooldown}s`;
                } else {
                    clearInterval(resendInterval);
                    otpResendBtn.disabled = false;
                    otpResendBtn.style.pointerEvents = 'auto';
                    otpResendCooldown.textContent = '';
                }
            }, 1000);
        }
        otpResendBtn.addEventListener('click', async function() {
            otpResendBtn.disabled = true;
            otpResendBtn.style.pointerEvents = 'none';
            showNotification('Resending OTP...', 'info');
            try {
                // Use proper API endpoint for OTP resend (same as login)
                const apiUrl = window.CONFIG ? window.CONFIG.getApiUrl('auth/login') : '/api/v1/auth/login';
                const response = await fetch(apiUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username: otpUsername, resendOtp: true })
                });
                const data = await response.json();
                if (response.ok) {
                    showNotification('A new OTP has been sent to your email.', 'success');
                    startResendCooldown();
                } else {
                    showNotification(data.message || 'Failed to resend OTP', 'error');
                    otpResendBtn.disabled = false;
                    otpResendBtn.style.pointerEvents = 'auto';
                }
            } catch (error) {
                showNotification('Error resending OTP. Please try again.', 'error');
                otpResendBtn.disabled = false;
                otpResendBtn.style.pointerEvents = 'auto';
            }
        });
        startResendCooldown(); // Start cooldown on modal open
    }

    // Submit OTP to backend
    async function submitOtp() {
        const otp = otpInput.value.trim();
        if (!otp || otp.length !== 6) {
            showNotification('Please enter the 6-digit OTP sent to your email.', 'error');
            return;
        }
        try {
            // Use proper API endpoint for OTP verification
            const apiUrl = window.CONFIG ? window.CONFIG.getApiUrl('auth/verify-otp') : '/api/v1/auth/verify-otp';
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: otpUsername, otp })
            });
            const data = await response.json();
            if (response.ok) {
                showNotification('OTP verified. Access granted.', 'success');
                otpModal.remove();
                // Store authentication token and user info
                if (data.token) {
                    localStorage.setItem('jwt_token', data.token);
                    if (data.refreshToken) {
                        localStorage.setItem('refresh_token', data.refreshToken);
                    }
                }
                localStorage.setItem('username', otpUsername);
                setTimeout(() => { window.location.href = 'text_stego.html'; }, 1000);
            } else {
                showNotification(data.message || 'Invalid OTP', 'error');
            }
        } catch (error) {
            console.error('OTP verification error:', error);
            showNotification('An error occurred during OTP verification. Please try again.', 'error');
        }
    }

    // Helper functions (showNotification, isValidEmail, handleSuccessfulLogin, etc.)
    function showNotification(message, type = 'info') {
        const notificationArea = document.getElementById('notificationArea');
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        let icon = 'info-circle';
        if (type === 'success') icon = 'check-circle';
        if (type === 'error') icon = 'exclamation-circle';
        if (type === 'warning') icon = 'exclamation-triangle';
        const notificationContent = document.createElement('div');
        notificationContent.className = 'notification-content';
        const header = document.createElement('div');
        header.className = 'notification-header';
        header.innerHTML = `<i class="fas fa-${icon}"></i><span class="notification-title">${type.charAt(0).toUpperCase() + type.slice(1)}</span>`;
        const messageElement = document.createElement('p');
        messageElement.className = 'notification-message';
        messageElement.textContent = message;
        notificationContent.appendChild(header);
        notificationContent.appendChild(messageElement);
        notification.appendChild(notificationContent);
        const closeBtn = document.createElement('button');
        closeBtn.className = 'notification-close';
        closeBtn.innerHTML = '<i class="fas fa-times"></i>';
        notification.appendChild(closeBtn);
        notificationArea.appendChild(notification);
        closeBtn.addEventListener('click', function() {
            notification.style.opacity = '0';
            setTimeout(() => { notification.remove(); }, 300);
        });
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.opacity = '0';
                setTimeout(() => { if (notification.parentNode) notification.remove(); }, 300);
            }
        }, 5000);
    }
    function isValidEmail(email) {
        const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        return re.test(email);
    }
    function handleSuccessfulLogin(user, rememberMe) {
        const displayName = user.fullName || user.username;
        showNotification(`Welcome back, ${displayName}!`, 'success');
        if (rememberMe) showNotification('Login credentials will be remembered', 'info');
        localStorage.setItem('username', user.username);
        if (rememberMe) localStorage.setItem('rememberUser', 'true');
        setTimeout(() => { window.location.href = 'text_stego.html'; }, 1000);
    }
});
