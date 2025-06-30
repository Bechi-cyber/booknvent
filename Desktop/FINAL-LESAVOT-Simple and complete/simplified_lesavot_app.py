#!/usr/bin/env python3
"""
LESAVOT - Simplified Multimodal Steganography Desktop Application
A secure application for hiding messages in images, text, and audio files.
"""

import sys
import os
import json
import hashlib
from PyQt5.QtWidgets import (QApplication, QMainWindow, QWidget, QTabWidget,
                            QVBoxLayout, QHBoxLayout, QLabel, QPushButton,
                            QLineEdit, QTextEdit, QStackedWidget, QFrame,
                            QRadioButton, QGroupBox, QDialog, QFormLayout)
from PyQt5.QtCore import Qt, QTimer

# Constants
USER_DB_FILE = 'data/users.json'
APP_TITLE = 'Multimodal Steganography'
APP_SUBTITLE = 'Hide your messages in images, audio, and text'

# Ensure data directory exists
os.makedirs(os.path.dirname(USER_DB_FILE), exist_ok=True)

# User Authentication Functions
def get_users():
    """Load users from database file."""
    try:
        if os.path.exists(USER_DB_FILE):
            with open(USER_DB_FILE, 'r') as f:
                return json.load(f)
        else:
            return {}
    except (FileNotFoundError, json.JSONDecodeError):
        return {}

def save_users(users):
    """Save users to database file."""
    with open(USER_DB_FILE, 'w') as f:
        json.dump(users, f)

def hash_password(password):
    """Hash a password for storing."""
    return hashlib.sha256(password.encode()).hexdigest()

def verify_password(stored_password, provided_password):
    """Verify a stored password against a provided password."""
    return stored_password == hash_password(provided_password)

# Login Dialog
class LoginDialog(QDialog):
    """Login dialog window."""
    def __init__(self, parent=None):
        super().__init__(parent)
        self.setWindowTitle("Login")
        self.setMinimumWidth(400)
        
        # Create layout
        layout = QVBoxLayout(self)
        
        # Add header
        title = QLabel("Login")
        title.setStyleSheet("font-size: 24px; font-weight: bold;")
        layout.addWidget(title)
        
        subtitle = QLabel("Enter your credentials to access your account")
        layout.addWidget(subtitle)
        
        # Add form
        form_layout = QFormLayout()
        
        # Username field
        self.username_input = QLineEdit()
        self.username_input.setPlaceholderText("Enter your username")
        form_layout.addRow("Username:", self.username_input)
        
        # Password field
        self.password_input = QLineEdit()
        self.password_input.setPlaceholderText("Enter your password")
        self.password_input.setEchoMode(QLineEdit.Password)
        form_layout.addRow("Password:", self.password_input)
        
        layout.addLayout(form_layout)
        
        # Add message label
        self.message_label = QLabel("")
        self.message_label.setStyleSheet("color: red;")
        layout.addWidget(self.message_label)
        
        # Add buttons
        button_layout = QHBoxLayout()
        
        register_button = QPushButton("Register")
        register_button.clicked.connect(self.open_register_dialog)
        button_layout.addWidget(register_button)
        
        button_layout.addStretch()
        
        login_button = QPushButton("Login")
        login_button.clicked.connect(self.login)
        button_layout.addWidget(login_button)
        
        layout.addLayout(button_layout)
    
    def login(self):
        """Attempt to log in with provided credentials."""
        username = self.username_input.text()
        password = self.password_input.text()
        
        # Validate input
        if not username or not password:
            self.message_label.setText("Please enter both username and password")
            return
        
        # Check credentials
        users = get_users()
        if username in users and verify_password(users[username]["password"], password):
            self.accept()  # Close dialog with accept result
        else:
            self.message_label.setText("Invalid username or password")
    
    def open_register_dialog(self):
        """Open the registration dialog."""
        self.reject()  # Close login dialog
        register_dialog = RegisterDialog(self.parent())
        if register_dialog.exec_() == QDialog.Accepted:
            # If registration successful, reopen login dialog
            login_dialog = LoginDialog(self.parent())
            if login_dialog.exec_() == QDialog.Accepted:
                self.accept()

# Register Dialog
class RegisterDialog(QDialog):
    """Registration dialog window."""
    def __init__(self, parent=None):
        super().__init__(parent)
        self.setWindowTitle("Register")
        self.setMinimumWidth(400)
        
        # Create layout
        layout = QVBoxLayout(self)
        
        # Add header
        title = QLabel("Register")
        title.setStyleSheet("font-size: 24px; font-weight: bold;")
        layout.addWidget(title)
        
        subtitle = QLabel("Create a new account")
        layout.addWidget(subtitle)
        
        # Add form
        form_layout = QFormLayout()
        
        # Username field
        self.username_input = QLineEdit()
        self.username_input.setPlaceholderText("Choose a username")
        form_layout.addRow("Username:", self.username_input)
        
        # Password field
        self.password_input = QLineEdit()
        self.password_input.setPlaceholderText("Choose a password")
        self.password_input.setEchoMode(QLineEdit.Password)
        form_layout.addRow("Password:", self.password_input)
        
        # Confirm password field
        self.confirm_password_input = QLineEdit()
        self.confirm_password_input.setPlaceholderText("Confirm your password")
        self.confirm_password_input.setEchoMode(QLineEdit.Password)
        form_layout.addRow("Confirm Password:", self.confirm_password_input)
        
        layout.addLayout(form_layout)
        
        # Add message label
        self.message_label = QLabel("")
        self.message_label.setStyleSheet("color: red;")
        layout.addWidget(self.message_label)
        
        # Add buttons
        button_layout = QHBoxLayout()
        
        login_button = QPushButton("Login")
        login_button.clicked.connect(self.open_login_dialog)
        button_layout.addWidget(login_button)
        
        button_layout.addStretch()
        
        register_button = QPushButton("Register")
        register_button.clicked.connect(self.register)
        button_layout.addWidget(register_button)
        
        layout.addLayout(button_layout)
    
    def register(self):
        """Register a new user."""
        username = self.username_input.text()
        password = self.password_input.text()
        confirm_password = self.confirm_password_input.text()
        
        # Validate input
        if not username or not password or not confirm_password:
            self.message_label.setText("Please fill in all fields")
            return
        
        if password != confirm_password:
            self.message_label.setText("Passwords do not match")
            return
        
        # Check if username exists
        users = get_users()
        if username in users:
            self.message_label.setText("Username already exists")
            return
        
        # Add new user
        users[username] = {
            "password": hash_password(password),
            "files": []
        }
        save_users(users)
        
        self.message_label.setText("Registration successful! Please log in.")
        self.message_label.setStyleSheet("color: green;")
        QTimer.singleShot(1500, self.accept)  # Close dialog after delay
    
    def open_login_dialog(self):
        """Open the login dialog."""
        self.reject()  # Close register dialog
        login_dialog = LoginDialog(self.parent())
        if login_dialog.exec_() == QDialog.Accepted:
            self.accept()

# Main Application Window
class LesavotApp(QMainWindow):
    """Main application window."""
    def __init__(self):
        super().__init__()
        self.username = None
        self.initUI()
        self.show_login()
    
    def initUI(self):
        """Initialize the user interface."""
        # Set window properties
        self.setWindowTitle(APP_TITLE)
        self.setMinimumSize(800, 600)
        
        # Create central widget
        central_widget = QWidget()
        self.setCentralWidget(central_widget)
        
        # Create main layout
        main_layout = QVBoxLayout(central_widget)
        
        # Create header
        header = QWidget()
        header.setFixedHeight(60)
        header.setStyleSheet("background-color: #1e2a3a;")
        header_layout = QHBoxLayout(header)
        
        # Add logo to header
        logo_text = QLabel(APP_TITLE)
        logo_text.setStyleSheet("color: white; font-size: 20px; font-weight: bold;")
        header_layout.addWidget(logo_text)
        
        # Add subtitle
        subtitle = QLabel(APP_SUBTITLE)
        subtitle.setStyleSheet("color: white; font-size: 14px;")
        header_layout.addWidget(subtitle)
        
        header_layout.addStretch()
        
        # Add user info to header (hidden initially)
        self.user_info = QLabel()
        self.user_info.setStyleSheet("color: white; font-size: 14px;")
        self.user_info.hide()
        header_layout.addWidget(self.user_info)
        
        # Add logout button (hidden initially)
        self.logout_button = QPushButton("Logout")
        self.logout_button.clicked.connect(self.logout)
        self.logout_button.hide()
        header_layout.addWidget(self.logout_button)
        
        main_layout.addWidget(header)
        
        # Create content area
        self.content = QStackedWidget()
        main_layout.addWidget(self.content)
        
        # Create pages
        self.login_page = QWidget()
        self.main_page = self.create_main_page()
        
        # Add pages to stacked widget
        self.content.addWidget(self.login_page)
        self.content.addWidget(self.main_page)
    
    def create_main_page(self):
        """Create the main application page."""
        page = QWidget()
        layout = QVBoxLayout(page)
        
        # Create tabs
        tabs = QTabWidget()
        
        # Create tabs for different steganography methods
        image_tab = self.create_image_tab()
        text_tab = self.create_text_tab()
        audio_tab = self.create_audio_tab()
        
        # Add tabs
        tabs.addTab(image_tab, "Image")
        tabs.addTab(text_tab, "Text")
        tabs.addTab(audio_tab, "Audio")
        
        layout.addWidget(tabs)
        
        return page
    
    def create_image_tab(self):
        """Create the image steganography tab."""
        tab = QWidget()
        layout = QVBoxLayout(tab)
        
        # Create mode selection
        mode_group = QGroupBox("Mode")
        mode_layout = QHBoxLayout(mode_group)
        
        self.image_encode_radio = QRadioButton("Encrypt")
        self.image_encode_radio.setChecked(True)
        self.image_decode_radio = QRadioButton("Decrypt")
        
        mode_layout.addWidget(self.image_encode_radio)
        mode_layout.addWidget(self.image_decode_radio)
        
        layout.addWidget(mode_group)
        
        # Add placeholder
        placeholder = QLabel("Image steganography functionality will be implemented here")
        layout.addWidget(placeholder)
        
        return tab
    
    def create_text_tab(self):
        """Create the text steganography tab."""
        tab = QWidget()
        layout = QVBoxLayout(tab)
        
        # Add placeholder
        placeholder = QLabel("Text steganography functionality will be implemented here")
        layout.addWidget(placeholder)
        
        return tab
    
    def create_audio_tab(self):
        """Create the audio steganography tab."""
        tab = QWidget()
        layout = QVBoxLayout(tab)
        
        # Add placeholder
        placeholder = QLabel("Audio steganography functionality will be implemented here")
        layout.addWidget(placeholder)
        
        return tab
    
    def show_login(self):
        """Show the login dialog."""
        login_dialog = LoginDialog(self)
        if login_dialog.exec_() == QDialog.Accepted:
            # Get username from dialog
            username = login_dialog.username_input.text()
            self.login_success(username)
    
    def login_success(self, username):
        """Handle successful login."""
        self.username = username
        self.user_info.setText(f"Welcome, {username}!")
        self.user_info.show()
        self.logout_button.show()
        self.content.setCurrentIndex(1)  # Show main page
    
    def logout(self):
        """Log out the current user."""
        self.username = None
        self.user_info.hide()
        self.logout_button.hide()
        self.content.setCurrentIndex(0)  # Show login page
        self.show_login()

def main():
    """Main application entry point."""
    print("Starting application...")
    app = QApplication(sys.argv)
    print("Creating main window...")
    window = LesavotApp()
    print("Showing main window...")
    window.show()
    print("Entering main event loop...")
    sys.exit(app.exec_())

if __name__ == "__main__":
    main()
