# app/auth_views.py
"""
Authentication views for the multimodal steganography application.

This module defines the routes for user authentication.
"""

from flask import Blueprint, render_template, request, redirect, url_for, flash, session
from app.auth import register_user, authenticate_user, login_user, logout_user, login_required

# Create a Blueprint for the authentication views
auth = Blueprint('auth', __name__)

@auth.route('/login', methods=['GET', 'POST'])
def login():
    """
    Handle user login.

    Returns:
        The login page or a redirect to the next page
    """
    # If the user is already logged in, redirect to the home page
    if 'username' in session:
        return redirect(url_for('views.home'))

    # Handle form submission
    if request.method == 'POST':
        username = request.form.get('username', '')
        password = request.form.get('password', '')

        # Validate input
        if not username or not password:
            flash('Please enter both username and password.')
            return render_template('login.html')

        # Authenticate the user
        try:
            if authenticate_user(username, password):
                # Check if the user wants to be remembered
                remember = 'remember' in request.form

                # Log in the user
                login_user(username, remember)

                # Redirect to the next page or the home page
                next_page = request.args.get('next')
                if next_page:
                    return redirect(next_page)
                return redirect(url_for('views.home'))
            else:
                # Show error message for invalid credentials
                flash('Invalid username or password.', 'error')
                return render_template('login.html')
        except Exception as e:
            # Show any other error messages
            flash(str(e), 'error')
            return render_template('login.html')

    # Show the login page
    return render_template('login.html')

@auth.route('/register', methods=['GET', 'POST'])
def register():
    """
    Handle user registration.

    Returns:
        The registration page or a redirect to the login page
    """
    # If the user is already logged in, redirect to the home page
    if 'username' in session:
        return redirect(url_for('views.home'))

    # Handle form submission
    if request.method == 'POST':
        username = request.form.get('username', '')
        password = request.form.get('password', '')
        confirm_password = request.form.get('confirm_password', '')

        # Validate input
        if not username or not password or not confirm_password:
            flash('Please fill in all fields.')
            return render_template('register.html')

        if password != confirm_password:
            flash('Passwords do not match.')
            return render_template('register.html')

        # Register the user
        if register_user(username, password):
            flash('Registration successful. Please log in.')
            return redirect(url_for('auth.login'))
        else:
            flash('Username already exists.')
            return render_template('register.html')

    # Show the registration page
    return render_template('register.html')

@auth.route('/logout')
def logout():
    """
    Handle user logout.

    Returns:
        A redirect to the login page
    """
    # Log out the user
    logout_user()

    flash('You have been logged out.')
    return redirect(url_for('auth.login'))

@auth.route('/profile')
@login_required
def profile():
    """
    Show the user's profile.

    Returns:
        The profile page
    """
    return render_template('profile.html', username=session['username'])
