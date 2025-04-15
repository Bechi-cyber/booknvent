# app/auth.py
"""
Authentication module for the multimodal steganography application.

This module provides functions for user authentication and session management.
"""

import os
import json
import hashlib
import secrets
from datetime import datetime, timedelta
from functools import wraps
from flask import session, redirect, url_for, request, flash

# Constants
USERS_FILE = 'users.json'
SESSION_TIMEOUT = 30  # minutes
REMEMBER_TIMEOUT = 30 * 24 * 60  # 30 days in minutes

# Password requirements
MIN_PASSWORD_LENGTH = 8
MAX_LOGIN_ATTEMPTS = 5
LOCKOUT_TIME = 15  # minutes

def init_app():
    """
    Initialize the authentication system.

    Creates the users file if it doesn't exist.
    """
    if not os.path.exists(USERS_FILE):
        with open(USERS_FILE, 'w') as f:
            json.dump({}, f)

def hash_password(password, salt=None):
    """
    Hash a password with a salt.

    Args:
        password: The password to hash
        salt: The salt to use (if None, a new salt will be generated)

    Returns:
        tuple: (hashed_password, salt)
    """
    if salt is None:
        salt = secrets.token_hex(16)

    # Hash the password with the salt
    hashed = hashlib.pbkdf2_hmac(
        'sha256',
        password.encode('utf-8'),
        salt.encode('utf-8'),
        100000
    ).hex()

    return hashed, salt

def validate_password_strength(password):
    """
    Validate the strength of a password.

    Args:
        password: The password to validate

    Returns:
        tuple: (is_valid, error_message)
    """
    if len(password) < MIN_PASSWORD_LENGTH:
        return False, f"Password must be at least {MIN_PASSWORD_LENGTH} characters long."

    # Check for at least one uppercase letter
    if not any(c.isupper() for c in password):
        return False, "Password must contain at least one uppercase letter."

    # Check for at least one lowercase letter
    if not any(c.islower() for c in password):
        return False, "Password must contain at least one lowercase letter."

    # Check for at least one digit
    if not any(c.isdigit() for c in password):
        return False, "Password must contain at least one number."

    # Check for at least one special character
    special_chars = "!@#$%^&*()-_=+[]{}|;:'\",.<>/?`~"
    if not any(c in special_chars for c in password):
        return False, "Password must contain at least one special character."

    return True, ""

def register_user(username, password):
    """
    Register a new user.

    Args:
        username: The username
        password: The password

    Returns:
        tuple: (success, error_message)
    """
    # Load the users file
    with open(USERS_FILE, 'r') as f:
        users = json.load(f)

    # Check if the username already exists
    if username in users:
        return False, "Username already exists."

    # Validate password strength
    is_valid, error_message = validate_password_strength(password)
    if not is_valid:
        return False, error_message

    # Hash the password
    hashed_password, salt = hash_password(password)

    # Add the user
    users[username] = {
        'password': hashed_password,
        'salt': salt,
        'created_at': datetime.now().isoformat(),
        'login_attempts': 0,
        'locked_until': None
    }

    # Save the users file
    with open(USERS_FILE, 'w') as f:
        json.dump(users, f)

    return True, ""

def authenticate_user(username, password):
    """
    Authenticate a user.

    Args:
        username: The username
        password: The password

    Returns:
        tuple: (success, error_message)
    """
    # Load the users file
    with open(USERS_FILE, 'r') as f:
        users = json.load(f)

    # Check if the username exists
    if username not in users:
        return False, "Invalid username or password."

    # Check if the account is locked
    user = users[username]
    if 'locked_until' in user and user['locked_until']:
        locked_until = datetime.fromisoformat(user['locked_until'])
        if datetime.now() < locked_until:
            remaining_minutes = int((locked_until - datetime.now()).total_seconds() / 60)
            return False, f"Account is locked. Try again in {remaining_minutes} minutes."

    # Get the user's salt
    salt = user['salt']

    # Hash the password with the salt
    hashed_password, _ = hash_password(password, salt)

    # Check if the password is correct
    if hashed_password == user['password']:
        # Reset login attempts on successful login
        user['login_attempts'] = 0
        user['locked_until'] = None
        with open(USERS_FILE, 'w') as f:
            json.dump(users, f)
        return True, ""
    else:
        # Increment login attempts
        if 'login_attempts' not in user:
            user['login_attempts'] = 0

        user['login_attempts'] += 1

        # Lock the account if too many failed attempts
        if user['login_attempts'] >= MAX_LOGIN_ATTEMPTS:
            user['locked_until'] = (datetime.now() + timedelta(minutes=LOCKOUT_TIME)).isoformat()
            with open(USERS_FILE, 'w') as f:
                json.dump(users, f)
            return False, f"Too many failed login attempts. Account locked for {LOCKOUT_TIME} minutes."

        # Save the updated login attempts
        with open(USERS_FILE, 'w') as f:
            json.dump(users, f)

        return False, "Invalid username or password."

def login_user(username, remember=False):
    """
    Log in a user.

    Args:
        username: The username
        remember: Whether to remember the user (default: False)
    """
    session['username'] = username
    session['login_time'] = datetime.now().isoformat()

    # Set the remember flag in the session
    if remember:
        session['remember'] = True
    else:
        session.pop('remember', None)

def logout_user():
    """
    Log out the current user.
    """
    session.pop('username', None)
    session.pop('login_time', None)
    session.pop('remember', None)

def is_authenticated():
    """
    Check if the current user is authenticated.

    Returns:
        bool: True if the user is authenticated, False otherwise
    """
    # Check if the username is in the session
    if 'username' not in session:
        return False

    # Check if the session has expired
    login_time = datetime.fromisoformat(session['login_time'])

    # Use a longer timeout for remembered users
    if 'remember' in session and session['remember']:
        timeout = REMEMBER_TIMEOUT
    else:
        timeout = SESSION_TIMEOUT

    if datetime.now() - login_time > timedelta(minutes=timeout):
        logout_user()
        return False

    # Update the login time to extend the session
    session['login_time'] = datetime.now().isoformat()

    return True

def login_required(f):
    """
    Decorator to require login for a route.

    Args:
        f: The function to decorate

    Returns:
        function: The decorated function
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not is_authenticated():
            flash('Please log in to access this page.')
            return redirect(url_for('auth.login', next=request.url))
        return f(*args, **kwargs)
    return decorated_function
