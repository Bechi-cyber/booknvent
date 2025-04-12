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

def register_user(username, password):
    """
    Register a new user.
    
    Args:
        username: The username
        password: The password
        
    Returns:
        bool: True if registration was successful, False otherwise
    """
    # Load the users file
    with open(USERS_FILE, 'r') as f:
        users = json.load(f)
    
    # Check if the username already exists
    if username in users:
        return False
    
    # Hash the password
    hashed_password, salt = hash_password(password)
    
    # Add the user
    users[username] = {
        'password': hashed_password,
        'salt': salt,
        'created_at': datetime.now().isoformat()
    }
    
    # Save the users file
    with open(USERS_FILE, 'w') as f:
        json.dump(users, f)
    
    return True

def authenticate_user(username, password):
    """
    Authenticate a user.
    
    Args:
        username: The username
        password: The password
        
    Returns:
        bool: True if authentication was successful, False otherwise
    """
    # Load the users file
    with open(USERS_FILE, 'r') as f:
        users = json.load(f)
    
    # Check if the username exists
    if username not in users:
        return False
    
    # Get the user's salt
    salt = users[username]['salt']
    
    # Hash the password with the salt
    hashed_password, _ = hash_password(password, salt)
    
    # Check if the password is correct
    return hashed_password == users[username]['password']

def login_user(username):
    """
    Log in a user.
    
    Args:
        username: The username
    """
    session['username'] = username
    session['login_time'] = datetime.now().isoformat()

def logout_user():
    """
    Log out the current user.
    """
    session.pop('username', None)
    session.pop('login_time', None)

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
    if datetime.now() - login_time > timedelta(minutes=SESSION_TIMEOUT):
        logout_user()
        return False
    
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
