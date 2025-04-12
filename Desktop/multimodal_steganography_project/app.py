# app.py
"""
Main application module for the multimodal steganography application.

This module initializes the Flask application, registers blueprints,
and sets up the file management system.
"""

import os
from flask import Flask, render_template
from app.views import views
from app.auth_views import auth
from app.file_manager import init_app as init_file_manager
from app.auth import init_app as init_auth

def create_app():
    """
    Create and configure the Flask application.

    Returns:
        Flask: The configured Flask application
    """
    app = Flask(__name__)

    # Configure the application
    app.config['SECRET_KEY'] = os.urandom(24)
    app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16 MB max upload size

    # Initialize the file management system
    init_file_manager()

    # Initialize the authentication system
    init_auth()

    # Register blueprints
    app.register_blueprint(views, url_prefix='/')
    app.register_blueprint(auth, url_prefix='/auth')

    # Register error handlers
    @app.errorhandler(404)
    def page_not_found(e):
        return render_template('error.html', error="Page not found"), 404

    @app.errorhandler(500)
    def server_error(e):
        return render_template('error.html', error="Internal server error"), 500

    @app.errorhandler(413)
    def too_large(e):
        return render_template('error.html', error="File too large"), 413

    return app

# Create the application
app = create_app()

# Run the application
if __name__ == '__main__':
    app.run(debug=True)
