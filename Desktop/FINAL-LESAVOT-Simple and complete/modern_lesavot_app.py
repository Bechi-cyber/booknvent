#!/usr/bin/env python3
"""
LESAVOT - Modern Multimodal Steganography Desktop Application
A secure application for hiding messages in images, text, and audio files.
Based on the modern design template.
"""

import sys
import os
import json
import hashlib
from PyQt5.QtWidgets import (QApplication, QMainWindow, QWidget, QTabWidget,
                            QVBoxLayout, QHBoxLayout, QLabel, QPushButton,
                            QLineEdit, QTextEdit, QStackedWidget, QFrame,
                            QRadioButton, QGroupBox, QDialog, QFormLayout,
                            QSpacerItem, QSizePolicy)
from PyQt5.QtCore import Qt, QTimer, QPropertyAnimation, QEasingCurve

# Constants
USER_DB_FILE = 'data/users.json'
APP_TITLE = 'Multimodal Steganography'
APP_SUBTITLE = 'Hide your messages in images, audio, and text'

# Ensure data directory exists
os.makedirs(os.path.dirname(USER_DB_FILE), exist_ok=True)

# Color Theme
class Colors:
    PRIMARY_DARK = "#1e2a3a"  # Dark navy blue for header
    PRIMARY = "#3498db"       # Blue for buttons and accents
    PRIMARY_LIGHT = "#5dade2" # Lighter blue for hover states
    ACCENT = "#f39c12"        # Orange for notifications
    SUCCESS = "#2ecc71"       # Green for success messages
    ERROR = "#e74c3c"         # Red for error messages
    WHITE = "#ffffff"         # White for content areas
    TEXT_DARK = "#2c3e50"     # Dark text on light backgrounds
    TEXT_LIGHT = "#ecf0f1"    # Light text on dark backgrounds
    BORDER = "#bdc3c7"        # Border color
    SHADOW = "rgba(0, 0, 0, 0.1)" # Shadow color

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

# Custom Widgets
class ModernButton(QPushButton):
    """Modern styled button."""
    def __init__(self, text, parent=None, primary=True):
        super().__init__(text, parent)
        self.setCursor(Qt.PointingHandCursor)
        if primary:
            self.setStyleSheet(f"""
                QPushButton {{
                    background-color: {Colors.PRIMARY};
                    color: {Colors.WHITE};
                    border: none;
                    border-radius: 4px;
                    padding: 10px 20px;
                    font-weight: 500;
                }}
                QPushButton:hover {{
                    background-color: {Colors.PRIMARY_LIGHT};
                }}
                QPushButton:pressed {{
                    background-color: {Colors.PRIMARY_DARK};
                }}
            """)
        else:
            self.setStyleSheet(f"""
                QPushButton {{
                    background-color: {Colors.WHITE};
                    color: {Colors.PRIMARY};
                    border: 1px solid {Colors.PRIMARY};
                    border-radius: 4px;
                    padding: 10px 20px;
                    font-weight: 500;
                }}
                QPushButton:hover {{
                    background-color: {Colors.PRIMARY_LIGHT};
                    color: {Colors.WHITE};
                }}
            """)

class ModernLineEdit(QLineEdit):
    """Modern styled line edit."""
    def __init__(self, placeholder="", parent=None):
        super().__init__(parent)
        self.setPlaceholderText(placeholder)
        self.setStyleSheet(f"""
            QLineEdit {{
                background-color: {Colors.WHITE};
                color: {Colors.TEXT_DARK};
                border: 1px solid {Colors.BORDER};
                border-radius: 4px;
                padding: 10px;
                font-size: 14px;
            }}
            QLineEdit:focus {{
                border: 1px solid {Colors.PRIMARY};
            }}
        """)

class ModernTextEdit(QTextEdit):
    """Modern styled text edit."""
    def __init__(self, placeholder="", parent=None):
        super().__init__(parent)
        self.setPlaceholderText(placeholder)
        self.setStyleSheet(f"""
            QTextEdit {{
                background-color: {Colors.WHITE};
                color: {Colors.TEXT_DARK};
                border: 1px solid {Colors.BORDER};
                border-radius: 4px;
                padding: 10px;
                font-size: 14px;
            }}
            QTextEdit:focus {{
                border: 1px solid {Colors.PRIMARY};
            }}
        """)

class NotificationBanner(QFrame):
    """Notification banner for success/error messages."""
    def __init__(self, message, message_type="success", parent=None):
        super().__init__(parent)
        self.setFixedHeight(0)  # Start with height 0 for animation

        # Set style based on message type
        if message_type == "success":
            bg_color = Colors.SUCCESS
        elif message_type == "error":
            bg_color = Colors.ERROR
        else:
            bg_color = Colors.ACCENT

        self.setStyleSheet(f"""
            QFrame {{
                background-color: {bg_color};
                color: {Colors.WHITE};
                border-radius: 4px;
                padding-left: 10px;
                padding-right: 10px;
            }}
        """)

        # Create layout
        layout = QHBoxLayout(self)
        layout.setContentsMargins(10, 5, 10, 5)

        # Add message
        message_label = QLabel(message)
        message_label.setStyleSheet(f"color: {Colors.WHITE}; font-weight: 500;")
        layout.addWidget(message_label)

        # Add close button
        close_button = QPushButton("×")
        close_button.setFixedSize(20, 20)
        close_button.setStyleSheet(f"""
            QPushButton {{
                background-color: transparent;
                color: {Colors.WHITE};
                border: none;
                font-size: 16px;
                font-weight: bold;
            }}
            QPushButton:hover {{
                background-color: rgba(255, 255, 255, 0.2);
                border-radius: 10px;
            }}
        """)
        close_button.clicked.connect(self.hide_animation)
        layout.addWidget(close_button)

        # Set up animation
        self.animation = QPropertyAnimation(self, b"maximumHeight")
        self.animation.setDuration(300)
        self.animation.setStartValue(0)
        self.animation.setEndValue(40)
        self.animation.setEasingCurve(QEasingCurve.OutCubic)
        self.animation.start()

        # Auto-hide after 5 seconds
        QTimer.singleShot(5000, self.hide_animation)

    def hide_animation(self):
        """Animate hiding the notification."""
        self.animation = QPropertyAnimation(self, b"maximumHeight")
        self.animation.setDuration(300)
        self.animation.setStartValue(40)
        self.animation.setEndValue(0)
        self.animation.setEasingCurve(QEasingCurve.OutCubic)
        self.animation.finished.connect(self.deleteLater)
        self.animation.start()

# Login Dialog
class LoginDialog(QDialog):
    """Login dialog window."""
    def __init__(self, parent=None):
        super().__init__(parent)
        self.setWindowTitle("Login")
        self.setMinimumWidth(400)
        self.setStyleSheet(f"""
            QDialog {{
                background-color: {Colors.WHITE};
            }}
        """)

        # Create layout
        layout = QVBoxLayout(self)
        layout.setContentsMargins(20, 20, 20, 20)
        layout.setSpacing(15)

        # Add header
        header_layout = QVBoxLayout()
        header_layout.setSpacing(5)

        title = QLabel("Login")
        title.setStyleSheet(f"color: {Colors.TEXT_DARK}; font-size: 24px; font-weight: bold;")
        header_layout.addWidget(title)

        subtitle = QLabel("Enter your credentials to access your account")
        subtitle.setStyleSheet(f"color: {Colors.TEXT_DARK}; font-size: 14px;")
        header_layout.addWidget(subtitle)

        layout.addLayout(header_layout)

        # Add form
        form_layout = QFormLayout()
        form_layout.setSpacing(10)

        # Username field
        self.username_input = ModernLineEdit("Enter your username")
        form_layout.addRow("Username:", self.username_input)

        # Password field
        self.password_input = ModernLineEdit("Enter your password")
        self.password_input.setEchoMode(QLineEdit.Password)
        form_layout.addRow("Password:", self.password_input)

        layout.addLayout(form_layout)

        # Add notification area
        self.notification_area = QVBoxLayout()
        layout.addLayout(self.notification_area)

        # Add buttons
        button_layout = QHBoxLayout()

        register_button = ModernButton("Register", primary=False)
        register_button.clicked.connect(self.open_register_dialog)
        button_layout.addWidget(register_button)

        button_layout.addStretch()

        login_button = ModernButton("Login")
        login_button.clicked.connect(self.login)
        button_layout.addWidget(login_button)

        layout.addLayout(button_layout)

    def login(self):
        """Attempt to log in with provided credentials."""
        username = self.username_input.text()
        password = self.password_input.text()

        # Validate input
        if not username or not password:
            self.show_notification("Please enter both username and password", "error")
            return

        # Check credentials
        users = get_users()
        if username in users and verify_password(users[username]["password"], password):
            self.accept()  # Close dialog with accept result
        else:
            self.show_notification("Invalid username or password", "error")

    def open_register_dialog(self):
        """Open the registration dialog."""
        self.reject()  # Close login dialog
        register_dialog = RegisterDialog(self.parent())
        if register_dialog.exec_() == QDialog.Accepted:
            # If registration successful, reopen login dialog
            login_dialog = LoginDialog(self.parent())
            if login_dialog.exec_() == QDialog.Accepted:
                self.accept()

    def show_notification(self, message, message_type="info"):
        """Show a notification message."""
        # Clear any existing notifications
        for i in reversed(range(self.notification_area.count())):
            self.notification_area.itemAt(i).widget().deleteLater()

        # Add new notification
        notification = NotificationBanner(message, message_type)
        self.notification_area.addWidget(notification)


# Main Application Window
class LesavotApp(QMainWindow):
    """Main application window."""
    def __init__(self):
        print("Initializing LesavotApp...")
        super().__init__()
        self.username = None
        print("Setting up UI...")
        self.initUI()
        print("Showing login dialog...")
        self.show_login()

    def initUI(self):
        """Initialize the user interface."""
        # Set window properties
        self.setWindowTitle(APP_TITLE)
        self.setMinimumSize(1000, 700)

        # Set application style
        self.setStyleSheet(f"""
            QMainWindow, QWidget {{
                background-color: {Colors.WHITE};
                color: {Colors.TEXT_DARK};
                font-family: 'Segoe UI', Arial, sans-serif;
            }}
        """)

        # Create central widget
        central_widget = QWidget()
        self.setCentralWidget(central_widget)

        # Create main layout
        main_layout = QVBoxLayout(central_widget)
        main_layout.setContentsMargins(0, 0, 0, 0)
        main_layout.setSpacing(0)

        # Create header
        header = QWidget()
        header.setFixedHeight(60)
        header.setStyleSheet(f"background-color: {Colors.PRIMARY_DARK};")
        header_layout = QHBoxLayout(header)
        header_layout.setContentsMargins(20, 0, 20, 0)

        # Add logo to header
        logo_layout = QHBoxLayout()
        logo_layout.setSpacing(10)

        logo_icon = QLabel("🔐")
        logo_icon.setStyleSheet(f"color: {Colors.WHITE}; font-size: 24px;")
        logo_layout.addWidget(logo_icon)

        logo_text = QLabel(APP_TITLE)
        logo_text.setStyleSheet(f"color: {Colors.WHITE}; font-size: 20px; font-weight: bold;")
        logo_layout.addWidget(logo_text)

        header_layout.addLayout(logo_layout)

        # Add subtitle
        subtitle = QLabel(APP_SUBTITLE)
        subtitle.setStyleSheet(f"color: {Colors.TEXT_LIGHT}; font-size: 14px;")
        header_layout.addWidget(subtitle)

        header_layout.addStretch()

        # Add user info to header (hidden initially)
        self.user_info = QLabel()
        self.user_info.setStyleSheet(f"color: {Colors.WHITE}; font-size: 14px;")
        self.user_info.hide()
        header_layout.addWidget(self.user_info)

        # Add logout button (hidden initially)
        self.logout_button = ModernButton("Logout", primary=False)
        self.logout_button.setStyleSheet(f"""
            QPushButton {{
                background-color: transparent;
                color: {Colors.WHITE};
                border: 1px solid {Colors.WHITE};
                border-radius: 4px;
                padding: 5px 10px;
                font-size: 12px;
            }}
            QPushButton:hover {{
                background-color: rgba(255, 255, 255, 0.1);
            }}
        """)
        self.logout_button.clicked.connect(self.logout)
        self.logout_button.hide()
        header_layout.addWidget(self.logout_button)

        main_layout.addWidget(header)

        # Create notification area
        self.notification_container = QWidget()
        notification_layout = QVBoxLayout(self.notification_container)
        notification_layout.setContentsMargins(20, 10, 20, 0)
        self.notification_area = QVBoxLayout()
        notification_layout.addLayout(self.notification_area)
        main_layout.addWidget(self.notification_container)

        # Create content area
        self.content = QStackedWidget()
        main_layout.addWidget(self.content)

        # Create pages
        self.login_page = self.create_login_page()
        self.main_page = self.create_main_page()

        # Add pages to stacked widget
        self.content.addWidget(self.login_page)
        self.content.addWidget(self.main_page)

    def create_login_page(self):
        """Create the login page."""
        page = QWidget()
        layout = QVBoxLayout(page)
        layout.setContentsMargins(0, 0, 0, 0)

        # Add spacer
        layout.addSpacerItem(QSpacerItem(20, 40, QSizePolicy.Minimum, QSizePolicy.Expanding))

        # Create login container
        login_container = QWidget()
        login_container.setFixedWidth(400)
        login_container.setStyleSheet(f"""
            background-color: {Colors.WHITE};
            border-radius: 8px;
            border: 1px solid {Colors.BORDER};
        """)
        login_layout = QVBoxLayout(login_container)
        login_layout.setContentsMargins(30, 30, 30, 30)
        login_layout.setSpacing(20)

        # Add login button
        login_button = ModernButton("Login")
        login_button.clicked.connect(self.show_login)
        login_layout.addWidget(login_button)

        # Add register button
        register_button = ModernButton("Register", primary=False)
        register_button.clicked.connect(self.show_register)
        login_layout.addWidget(register_button)

        # Center login container
        container_layout = QHBoxLayout()
        container_layout.addStretch()
        container_layout.addWidget(login_container)
        container_layout.addStretch()
        layout.addLayout(container_layout)

        # Add spacer
        layout.addSpacerItem(QSpacerItem(20, 40, QSizePolicy.Minimum, QSizePolicy.Expanding))

        return page

    def create_main_page(self):
        """Create the main application page."""
        page = QWidget()
        layout = QVBoxLayout(page)
        layout.setContentsMargins(20, 20, 20, 20)

        # Create tabs
        tabs = QTabWidget()
        tabs.setStyleSheet(f"""
            QTabWidget::pane {{
                border: 1px solid {Colors.BORDER};
                border-radius: 8px;
                background-color: {Colors.WHITE};
                top: -1px;
            }}
            QTabBar::tab {{
                background-color: {Colors.WHITE};
                color: {Colors.TEXT_DARK};
                border: 1px solid {Colors.BORDER};
                border-bottom: none;
                border-top-left-radius: 4px;
                border-top-right-radius: 4px;
                padding: 8px 16px;
                margin-right: 2px;
            }}
            QTabBar::tab:selected {{
                background-color: {Colors.PRIMARY};
                color: {Colors.WHITE};
                border: 1px solid {Colors.PRIMARY};
                border-bottom: none;
            }}
        """)

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
        mode_layout.addStretch()

        layout.addWidget(mode_group)

        # Create stacked widget for encode/decode
        self.image_stack = QStackedWidget()

        # Create encode widget
        encode_widget = QWidget()
        encode_layout = QVBoxLayout(encode_widget)

        # File selection
        file_frame = QFrame()
        file_layout = QHBoxLayout(file_frame)

        file_label = QLabel("Select Image:")
        self.image_file_path = ModernLineEdit("No file selected")
        self.image_file_path.setReadOnly(True)
        browse_button = ModernButton("Browse")

        file_layout.addWidget(file_label)
        file_layout.addWidget(self.image_file_path, 1)
        file_layout.addWidget(browse_button)

        # Message input
        message_label = QLabel("Message to Hide:")
        self.image_message = ModernTextEdit("Enter your message here")

        # Password input (optional)
        password_label = QLabel("Password (optional):")
        self.image_password = ModernLineEdit("Enter password for additional security")
        self.image_password.setEchoMode(QLineEdit.Password)

        # Process button
        self.image_process_button = ModernButton("Encrypt")

        # Add widgets to encode layout
        encode_layout.addWidget(file_frame)
        encode_layout.addWidget(message_label)
        encode_layout.addWidget(self.image_message)
        encode_layout.addWidget(password_label)
        encode_layout.addWidget(self.image_password)
        encode_layout.addWidget(self.image_process_button)

        # Create decode widget
        decode_widget = QWidget()
        decode_layout = QVBoxLayout(decode_widget)

        # File selection for decode
        decode_file_frame = QFrame()
        decode_file_layout = QHBoxLayout(decode_file_frame)

        decode_file_label = QLabel("Select Image with Hidden Message:")
        self.decode_image_file_path = ModernLineEdit("No file selected")
        self.decode_image_file_path.setReadOnly(True)
        decode_browse_button = ModernButton("Browse")

        decode_file_layout.addWidget(decode_file_label)
        decode_file_layout.addWidget(self.decode_image_file_path, 1)
        decode_file_layout.addWidget(decode_browse_button)

        # Password input for decode
        decode_password_label = QLabel("Password (if required):")
        self.decode_image_password = ModernLineEdit("Enter password if message was encrypted with one")
        self.decode_image_password.setEchoMode(QLineEdit.Password)

        # Decoded message
        decoded_label = QLabel("Decoded Message:")
        self.decoded_image_message = ModernTextEdit()
        self.decoded_image_message.setReadOnly(True)

        # Process button for decode
        self.decode_image_button = ModernButton("Decrypt")

        # Add widgets to decode layout
        decode_layout.addWidget(decode_file_frame)
        decode_layout.addWidget(decode_password_label)
        decode_layout.addWidget(self.decode_image_password)
        decode_layout.addWidget(decoded_label)
        decode_layout.addWidget(self.decoded_image_message)
        decode_layout.addWidget(self.decode_image_button)

        # Add widgets to stack
        self.image_stack.addWidget(encode_widget)
        self.image_stack.addWidget(decode_widget)

        # Connect radio buttons to stack
        self.image_encode_radio.toggled.connect(lambda: self.image_stack.setCurrentIndex(0))
        self.image_decode_radio.toggled.connect(lambda: self.image_stack.setCurrentIndex(1))

        layout.addWidget(self.image_stack)

        return tab

    def create_text_tab(self):
        """Create the text steganography tab."""
        tab = QWidget()
        layout = QVBoxLayout(tab)

        # Create mode selection
        mode_group = QGroupBox("Mode")
        mode_layout = QHBoxLayout(mode_group)

        self.text_encode_radio = QRadioButton("Encrypt")
        self.text_encode_radio.setChecked(True)
        self.text_decode_radio = QRadioButton("Decrypt")

        mode_layout.addWidget(self.text_encode_radio)
        mode_layout.addWidget(self.text_decode_radio)
        mode_layout.addStretch()

        layout.addWidget(mode_group)

        # Create stacked widget for encode/decode
        self.text_stack = QStackedWidget()

        # Create encode widget
        encode_widget = QWidget()
        encode_layout = QVBoxLayout(encode_widget)

        # Text content
        content_label = QLabel("Text Content:")
        self.text_content = ModernTextEdit("Enter or paste the text that will contain the hidden message")

        # Message input
        message_label = QLabel("Message to Hide:")
        self.text_message = ModernTextEdit("Enter your message here")

        # Password input (optional)
        password_label = QLabel("Password (optional):")
        self.text_password = ModernLineEdit("Enter password for additional security")
        self.text_password.setEchoMode(QLineEdit.Password)

        # Process button
        self.text_process_button = ModernButton("Encrypt")

        # Add widgets to encode layout
        encode_layout.addWidget(content_label)
        encode_layout.addWidget(self.text_content)
        encode_layout.addWidget(message_label)
        encode_layout.addWidget(self.text_message)
        encode_layout.addWidget(password_label)
        encode_layout.addWidget(self.text_password)
        encode_layout.addWidget(self.text_process_button)

        # Create decode widget
        decode_widget = QWidget()
        decode_layout = QVBoxLayout(decode_widget)

        # Text with hidden message
        hidden_label = QLabel("Text with Hidden Message:")
        self.hidden_text = ModernTextEdit("Enter or paste the text containing the hidden message")

        # Password input for decode
        decode_password_label = QLabel("Password (if required):")
        self.decode_text_password = ModernLineEdit("Enter password if message was encrypted with one")
        self.decode_text_password.setEchoMode(QLineEdit.Password)

        # Decoded message
        decoded_label = QLabel("Decoded Message:")
        self.decoded_text_message = ModernTextEdit()
        self.decoded_text_message.setReadOnly(True)

        # Process button for decode
        self.decode_text_button = ModernButton("Decrypt")

        # Add widgets to decode layout
        decode_layout.addWidget(hidden_label)
        decode_layout.addWidget(self.hidden_text)
        decode_layout.addWidget(decode_password_label)
        decode_layout.addWidget(self.decode_text_password)
        decode_layout.addWidget(decoded_label)
        decode_layout.addWidget(self.decoded_text_message)
        decode_layout.addWidget(self.decode_text_button)

        # Add widgets to stack
        self.text_stack.addWidget(encode_widget)
        self.text_stack.addWidget(decode_widget)

        # Connect radio buttons to stack
        self.text_encode_radio.toggled.connect(lambda: self.text_stack.setCurrentIndex(0))
        self.text_decode_radio.toggled.connect(lambda: self.text_stack.setCurrentIndex(1))

        layout.addWidget(self.text_stack)

        return tab

    def create_audio_tab(self):
        """Create the audio steganography tab."""
        tab = QWidget()
        layout = QVBoxLayout(tab)

        # Create mode selection
        mode_group = QGroupBox("Mode")
        mode_layout = QHBoxLayout(mode_group)

        self.audio_encode_radio = QRadioButton("Encrypt")
        self.audio_encode_radio.setChecked(True)
        self.audio_decode_radio = QRadioButton("Decrypt")

        mode_layout.addWidget(self.audio_encode_radio)
        mode_layout.addWidget(self.audio_decode_radio)
        mode_layout.addStretch()

        layout.addWidget(mode_group)

        # Create stacked widget for encode/decode
        self.audio_stack = QStackedWidget()

        # Create encode widget
        encode_widget = QWidget()
        encode_layout = QVBoxLayout(encode_widget)

        # File selection
        file_frame = QFrame()
        file_layout = QHBoxLayout(file_frame)

        file_label = QLabel("Select Audio File:")
        self.audio_file_path = ModernLineEdit("No file selected")
        self.audio_file_path.setReadOnly(True)
        browse_button = ModernButton("Browse")

        file_layout.addWidget(file_label)
        file_layout.addWidget(self.audio_file_path, 1)
        file_layout.addWidget(browse_button)

        # Message input
        message_label = QLabel("Message to Hide:")
        self.audio_message = ModernTextEdit("Enter your message here")

        # Password input (optional)
        password_label = QLabel("Password (optional):")
        self.audio_password = ModernLineEdit("Enter password for additional security")
        self.audio_password.setEchoMode(QLineEdit.Password)

        # Process button
        self.audio_process_button = ModernButton("Encrypt")

        # Add widgets to encode layout
        encode_layout.addWidget(file_frame)
        encode_layout.addWidget(message_label)
        encode_layout.addWidget(self.audio_message)
        encode_layout.addWidget(password_label)
        encode_layout.addWidget(self.audio_password)
        encode_layout.addWidget(self.audio_process_button)

        # Create decode widget
        decode_widget = QWidget()
        decode_layout = QVBoxLayout(decode_widget)

        # File selection for decode
        decode_file_frame = QFrame()
        decode_file_layout = QHBoxLayout(decode_file_frame)

        decode_file_label = QLabel("Select Audio File with Hidden Message:")
        self.decode_audio_file_path = ModernLineEdit("No file selected")
        self.decode_audio_file_path.setReadOnly(True)
        decode_browse_button = ModernButton("Browse")

        decode_file_layout.addWidget(decode_file_label)
        decode_file_layout.addWidget(self.decode_audio_file_path, 1)
        decode_file_layout.addWidget(decode_browse_button)

        # Password input for decode
        decode_password_label = QLabel("Password (if required):")
        self.decode_audio_password = ModernLineEdit("Enter password if message was encrypted with one")
        self.decode_audio_password.setEchoMode(QLineEdit.Password)

        # Decoded message
        decoded_label = QLabel("Decoded Message:")
        self.decoded_audio_message = ModernTextEdit()
        self.decoded_audio_message.setReadOnly(True)

        # Process button for decode
        self.decode_audio_button = ModernButton("Decrypt")

        # Add widgets to decode layout
        decode_layout.addWidget(decode_file_frame)
        decode_layout.addWidget(decode_password_label)
        decode_layout.addWidget(self.decode_audio_password)
        decode_layout.addWidget(decoded_label)
        decode_layout.addWidget(self.decoded_audio_message)
        decode_layout.addWidget(self.decode_audio_button)

        # Add widgets to stack
        self.audio_stack.addWidget(encode_widget)
        self.audio_stack.addWidget(decode_widget)

        # Connect radio buttons to stack
        self.audio_encode_radio.toggled.connect(lambda: self.audio_stack.setCurrentIndex(0))
        self.audio_decode_radio.toggled.connect(lambda: self.audio_stack.setCurrentIndex(1))

        layout.addWidget(self.audio_stack)

        return tab

    def show_login(self):
        """Show the login dialog."""
        login_dialog = LoginDialog(self)
        if login_dialog.exec_() == QDialog.Accepted:
            # Get username from dialog
            username = login_dialog.username_input.text()
            self.login_success(username)

    def show_register(self):
        """Show the registration dialog."""
        register_dialog = RegisterDialog(self)
        if register_dialog.exec_() == QDialog.Accepted:
            self.show_login()

    def login_success(self, username):
        """Handle successful login."""
        self.username = username
        self.user_info.setText(f"Welcome, {username}!")
        self.user_info.show()
        self.logout_button.show()
        self.content.setCurrentIndex(1)  # Show main page
        self.show_notification(f"Welcome back, {username}!", "success")

    def logout(self):
        """Log out the current user."""
        self.username = None
        self.user_info.hide()
        self.logout_button.hide()
        self.content.setCurrentIndex(0)  # Show login page
        self.show_notification("You have been logged out", "info")

    def show_notification(self, message, message_type="info"):
        """Show a notification message."""
        # Clear any existing notifications
        for i in reversed(range(self.notification_area.count())):
            self.notification_area.itemAt(i).widget().deleteLater()

        # Add new notification
        notification = NotificationBanner(message, message_type)
        self.notification_area.addWidget(notification)


# Register Dialog
class RegisterDialog(QDialog):
    """Registration dialog window."""
    def __init__(self, parent=None):
        super().__init__(parent)
        self.setWindowTitle("Register")
        self.setMinimumWidth(400)
        self.setStyleSheet(f"""
            QDialog {{
                background-color: {Colors.WHITE};
            }}
        """)

        # Create layout
        layout = QVBoxLayout(self)
        layout.setContentsMargins(20, 20, 20, 20)
        layout.setSpacing(15)

        # Add header
        header_layout = QVBoxLayout()
        header_layout.setSpacing(5)

        title = QLabel("Register")
        title.setStyleSheet(f"color: {Colors.TEXT_DARK}; font-size: 24px; font-weight: bold;")
        header_layout.addWidget(title)

        subtitle = QLabel("Create a new account")
        subtitle.setStyleSheet(f"color: {Colors.TEXT_DARK}; font-size: 14px;")
        header_layout.addWidget(subtitle)

        layout.addLayout(header_layout)

        # Add form
        form_layout = QFormLayout()
        form_layout.setSpacing(10)

        # Username field
        self.username_input = ModernLineEdit("Choose a username")
        form_layout.addRow("Username:", self.username_input)

        # Password field
        self.password_input = ModernLineEdit("Choose a password")
        self.password_input.setEchoMode(QLineEdit.Password)
        self.password_input.textChanged.connect(self.update_password_strength)
        form_layout.addRow("Password:", self.password_input)

        # Password strength indicator
        self.password_strength_frame = QFrame()
        self.password_strength_frame.setFixedHeight(30)
        password_strength_layout = QVBoxLayout(self.password_strength_frame)
        password_strength_layout.setContentsMargins(0, 0, 0, 0)

        strength_label_layout = QHBoxLayout()
        self.strength_label = QLabel("Password strength")
        self.strength_label.setStyleSheet(f"color: {Colors.TEXT_DARK}; font-size: 12px;")
        strength_label_layout.addWidget(self.strength_label)
        strength_label_layout.addStretch()
        password_strength_layout.addLayout(strength_label_layout)

        self.strength_meter = QFrame()
        self.strength_meter.setFixedHeight(5)
        self.strength_meter.setStyleSheet(f"background-color: {Colors.BORDER}; border-radius: 2px;")
        password_strength_layout.addWidget(self.strength_meter)

        form_layout.addRow("", self.password_strength_frame)

        # Confirm password field
        self.confirm_password_input = ModernLineEdit("Confirm your password")
        self.confirm_password_input.setEchoMode(QLineEdit.Password)
        self.confirm_password_input.textChanged.connect(self.check_passwords_match)
        form_layout.addRow("Confirm Password:", self.confirm_password_input)

        layout.addLayout(form_layout)

        # Add notification area
        self.notification_area = QVBoxLayout()
        layout.addLayout(self.notification_area)

        # Add buttons
        button_layout = QHBoxLayout()

        login_button = ModernButton("Login", primary=False)
        login_button.clicked.connect(self.open_login_dialog)
        button_layout.addWidget(login_button)

        button_layout.addStretch()

        register_button = ModernButton("Register")
        register_button.clicked.connect(self.register)
        button_layout.addWidget(register_button)

        layout.addLayout(button_layout)

    def update_password_strength(self):
        """Update the password strength indicator."""
        password = self.password_input.text()
        strength = 0

        # Calculate strength
        if len(password) >= 8:
            strength += 1
        if any(c.isupper() for c in password):
            strength += 1
        if any(c.isdigit() for c in password):
            strength += 1
        if any(not c.isalnum() for c in password):
            strength += 1

        # Update UI
        if strength == 0:
            color = Colors.BORDER
            text = "Password strength"
        elif strength == 1:
            color = Colors.ERROR
            text = "Weak password"
        elif strength == 2:
            color = Colors.ACCENT
            text = "Medium password"
        elif strength == 3:
            color = Colors.PRIMARY
            text = "Good password"
        else:
            color = Colors.SUCCESS
            text = "Strong password"

        self.strength_meter.setStyleSheet(f"""
            background-color: {color};
            border-radius: 2px;
            width: {25 * strength}%;
        """)
        self.strength_label.setText(text)

    def check_passwords_match(self):
        """Check if passwords match and update UI accordingly."""
        password = self.password_input.text()
        confirm = self.confirm_password_input.text()

        if confirm and password != confirm:
            self.confirm_password_input.setStyleSheet(f"""
                background-color: {Colors.WHITE};
                color: {Colors.TEXT_DARK};
                border: 1px solid {Colors.ERROR};
                border-radius: 4px;
                padding: 10px;
                font-size: 14px;
            """)
        else:
            self.confirm_password_input.setStyleSheet(f"""
                background-color: {Colors.WHITE};
                color: {Colors.TEXT_DARK};
                border: 1px solid {Colors.BORDER};
                border-radius: 4px;
                padding: 10px;
                font-size: 14px;
            """)
            if confirm:
                self.confirm_password_input.setStyleSheet(f"""
                    background-color: {Colors.WHITE};
                    color: {Colors.TEXT_DARK};
                    border: 1px solid {Colors.SUCCESS};
                    border-radius: 4px;
                    padding: 10px;
                    font-size: 14px;
                """)

    def register(self):
        """Register a new user."""
        username = self.username_input.text()
        password = self.password_input.text()
        confirm_password = self.confirm_password_input.text()

        # Validate input
        if not username or not password or not confirm_password:
            self.show_notification("Please fill in all fields", "error")
            return

        if password != confirm_password:
            self.show_notification("Passwords do not match", "error")
            return

        # Check if username exists
        users = get_users()
        if username in users:
            self.show_notification("Username already exists", "error")
            return

        # Add new user
        users[username] = {
            "password": hash_password(password),
            "files": []
        }
        save_users(users)

        self.show_notification("Registration successful! Please log in.", "success")
        QTimer.singleShot(1500, self.accept)  # Close dialog after delay

    def open_login_dialog(self):
        """Open the login dialog."""
        self.reject()  # Close register dialog
        login_dialog = LoginDialog(self.parent())
        if login_dialog.exec_() == QDialog.Accepted:
            self.accept()

    def show_notification(self, message, message_type="info"):
        """Show a notification message."""
        # Clear any existing notifications
        for i in reversed(range(self.notification_area.count())):
            self.notification_area.itemAt(i).widget().deleteLater()

        # Add new notification
        notification = NotificationBanner(message, message_type)
        self.notification_area.addWidget(notification)


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
