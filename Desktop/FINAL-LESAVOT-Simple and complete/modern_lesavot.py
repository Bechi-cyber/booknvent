#!/usr/bin/env python3
"""
LESAVOT - Modern Multimodal Steganography Application
A secure desktop application for hiding messages in images, text, and audio files.
"""

import sys
import os
import base64
import io
from PIL import Image
import numpy as np
import uuid
import scipy.io.wavfile as wavfile
from PyQt5.QtWidgets import (QApplication, QMainWindow, QWidget, QStackedWidget,
                            QVBoxLayout, QHBoxLayout, QLabel, QPushButton,
                            QLineEdit, QTextEdit, QFileDialog, QMessageBox,
                            QFrame, QProgressBar, QSplitter, QScrollArea,
                            QComboBox, QCheckBox, QRadioButton, QGroupBox,
                            QToolButton, QSizePolicy)
from PyQt5.QtGui import QPixmap, QFont, QIcon, QColor, QPalette, QImage, QFontDatabase
from PyQt5.QtCore import Qt, QSize, QTimer, QThread, pyqtSignal, QPropertyAnimation, QEasingCurve

# Steganography functions
def hide_message_in_image(image, message):
    """Hide a message in an image using LSB steganography."""
    # Convert image to numpy array
    img_array = np.array(image)

    # Convert message to binary
    binary_message = ''.join(format(ord(char), '08b') for char in message)
    binary_message += '00000000'  # Add null terminator

    # Check if the image is large enough to hold the message
    if img_array.size < len(binary_message):
        raise ValueError("Image is too small to hide this message")

    # Flatten the array to make it easier to iterate
    flat_array = img_array.flatten()

    # Modify the LSB of each pixel to hide the message
    for i in range(len(binary_message)):
        flat_array[i] = (flat_array[i] & ~1) | int(binary_message[i])

    # Reshape back to original image dimensions
    stego_array = flat_array.reshape(img_array.shape)

    # Convert back to PIL Image
    stego_image = Image.fromarray(stego_array)

    return stego_image

def extract_message_from_image(image):
    """Extract a hidden message from an image."""
    # Convert image to numpy array
    img_array = np.array(image)

    # Flatten the array
    flat_array = img_array.flatten()

    # Extract LSB from each pixel
    binary_message = ''.join(str(pixel & 1) for pixel in flat_array)

    # Convert binary to ASCII
    message = ""
    for i in range(0, len(binary_message), 8):
        if i + 8 <= len(binary_message):
            byte = binary_message[i:i+8]
            if byte == '00000000':  # Null terminator
                break
            message += chr(int(byte, 2))

    return message

def hide_message_in_text(text_content, message):
    """Hide a message in a text file using whitespace steganography."""
    # Convert message to binary
    binary_message = ''.join(format(ord(char), '08b') for char in message)

    # Use spaces and tabs to encode binary (space = 0, tab = 1)
    stego_text = ""
    for i, char in enumerate(text_content):
        stego_text += char
        if i < len(binary_message):
            if binary_message[i] == '0':
                stego_text += ' '  # Add space for 0
            else:
                stego_text += '\t'  # Add tab for 1

    return stego_text

def extract_message_from_text(stego_text):
    """Extract a hidden message from a text file."""
    # Extract binary message from whitespace
    binary_message = ""
    for i in range(len(stego_text) - 1):
        if stego_text[i+1] == ' ':
            binary_message += '0'
        elif stego_text[i+1] == '\t':
            binary_message += '1'

    # Convert binary to ASCII
    message = ""
    for i in range(0, len(binary_message), 8):
        if i + 8 <= len(binary_message):
            byte = binary_message[i:i+8]
            message += chr(int(byte, 2))

    return message

def hide_message_in_audio(audio_data, sample_rate, message):
    """Hide a message in an audio file using phase encoding."""
    # Convert message to binary
    binary_message = ''.join(format(ord(char), '08b') for char in message)

    # Ensure audio data is in the right format
    if len(audio_data.shape) > 1:
        audio_data = audio_data[:, 0]  # Use first channel if stereo

    # Check if audio is long enough
    if len(audio_data) < len(binary_message) * 100:
        raise ValueError("Audio file is too short to hide this message")

    # Embed each bit in the phase of the audio
    for i in range(len(binary_message)):
        bit = int(binary_message[i])
        position = i * 100

        # Modify a small segment of audio
        if bit == 1:
            audio_data[position:position+100] = audio_data[position:position+100] * 1.001
        else:
            audio_data[position:position+100] = audio_data[position:position+100] * 0.999

    return audio_data

def extract_message_from_audio(audio_data):
    """Extract a hidden message from an audio file."""
    # Ensure audio data is in the right format
    if len(audio_data.shape) > 1:
        audio_data = audio_data[:, 0]  # Use first channel if stereo

    # Extract binary message
    binary_message = ""
    for i in range(0, len(audio_data) // 100):
        position = i * 100
        segment = audio_data[position:position+100]

        # Check amplitude to determine bit
        if np.mean(np.abs(segment)) > np.mean(np.abs(audio_data)):
            binary_message += '1'
        else:
            binary_message += '0'

        # Stop at null terminator
        if len(binary_message) % 8 == 0:
            byte = binary_message[-8:]
            if byte == '00000000':
                break

    # Convert binary to ASCII
    message = ""
    for i in range(0, len(binary_message), 8):
        if i + 8 <= len(binary_message):
            byte = binary_message[i:i+8]
            if byte == '00000000':  # Null terminator
                break
            message += chr(int(byte, 2))

    return message

# Custom widgets
class SidebarButton(QPushButton):
    """Custom sidebar button with icon and text."""
    def __init__(self, icon_path, text, parent=None):
        super().__init__(parent)
        self.setText(text)
        if icon_path:
            self.setIcon(QIcon(icon_path))
        self.setIconSize(QSize(24, 24))
        self.setCheckable(True)
        self.setFixedHeight(50)
        self.setCursor(Qt.PointingHandCursor)
        self.setStyleSheet("""
            QPushButton {
                border: none;
                border-radius: 0;
                text-align: left;
                padding: 10px 15px;
                font-size: 14px;
                font-weight: 500;
                color: #e0e0e0;
                background-color: transparent;
            }
            QPushButton:hover {
                background-color: rgba(255, 255, 255, 0.1);
            }
            QPushButton:checked {
                background-color: rgba(255, 255, 255, 0.15);
                border-left: 3px solid #00b4d8;
            }
        """)

class ModernButton(QPushButton):
    """Modern styled button."""
    def __init__(self, text, parent=None, primary=True):
        super().__init__(text, parent)
        self.setCursor(Qt.PointingHandCursor)
        if primary:
            self.setStyleSheet("""
                QPushButton {
                    background-color: #00b4d8;
                    color: #ffffff;
                    border: none;
                    border-radius: 4px;
                    padding: 10px 20px;
                    font-weight: 500;
                }
                QPushButton:hover {
                    background-color: #0096c7;
                }
                QPushButton:pressed {
                    background-color: #0077b6;
                }
                QPushButton:disabled {
                    background-color: #607d8b;
                    color: #90a4ae;
                }
            """)
        else:
            self.setStyleSheet("""
                QPushButton {
                    background-color: rgba(255, 255, 255, 0.1);
                    color: #e0e0e0;
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    border-radius: 4px;
                    padding: 10px 20px;
                    font-weight: 500;
                }
                QPushButton:hover {
                    background-color: rgba(255, 255, 255, 0.15);
                }
                QPushButton:pressed {
                    background-color: rgba(255, 255, 255, 0.2);
                }
                QPushButton:disabled {
                    background-color: rgba(255, 255, 255, 0.05);
                    color: #607d8b;
                }
            """)

class FileDropArea(QLabel):
    """Custom widget for file drop area."""
    fileDropped = pyqtSignal(str)

    def __init__(self, text, parent=None):
        super().__init__(parent)
        self.setText(text)
        self.setAlignment(Qt.AlignCenter)
        self.setMinimumHeight(200)
        self.setAcceptDrops(True)
        self.setStyleSheet("""
            QLabel {
                border: 2px dashed rgba(255, 255, 255, 0.2);
                border-radius: 8px;
                background-color: rgba(255, 255, 255, 0.05);
                color: #90a4ae;
                padding: 20px;
            }
            QLabel:hover {
                border-color: rgba(0, 180, 216, 0.5);
                background-color: rgba(0, 180, 216, 0.05);
            }
        """)

    def dragEnterEvent(self, event):
        if event.mimeData().hasUrls():
            event.acceptProposedAction()
            self.setStyleSheet("""
                QLabel {
                    border: 2px dashed rgba(0, 180, 216, 0.8);
                    border-radius: 8px;
                    background-color: rgba(0, 180, 216, 0.1);
                    color: #e0e0e0;
                    padding: 20px;
                }
            """)

    def dragLeaveEvent(self, event):
        self.setStyleSheet("""
            QLabel {
                border: 2px dashed rgba(255, 255, 255, 0.2);
                border-radius: 8px;
                background-color: rgba(255, 255, 255, 0.05);
                color: #90a4ae;
                padding: 20px;
            }
            QLabel:hover {
                border-color: rgba(0, 180, 216, 0.5);
                background-color: rgba(0, 180, 216, 0.05);
            }
        """)

    def dropEvent(self, event):
        if event.mimeData().hasUrls():
            url = event.mimeData().urls()[0]
            file_path = url.toLocalFile()
            self.fileDropped.emit(file_path)
            self.setStyleSheet("""
                QLabel {
                    border: 2px dashed rgba(255, 255, 255, 0.2);
                    border-radius: 8px;
                    background-color: rgba(255, 255, 255, 0.05);
                    color: #90a4ae;
                    padding: 20px;
                }
                QLabel:hover {
                    border-color: rgba(0, 180, 216, 0.5);
                    background-color: rgba(0, 180, 216, 0.05);
                }
            """)

# Main application window
class LesavotApp(QMainWindow):
    def __init__(self):
        super().__init__()
        self.initUI()

    def initUI(self):
        # Set window properties
        self.setWindowTitle('LESAVOT - Secure Steganography')
        self.setMinimumSize(1200, 800)

        # Set dark theme
        self.setStyleSheet("""
            QMainWindow, QWidget {
                background-color: #1a1a2e;
                color: #e0e0e0;
                font-family: 'Segoe UI', Arial, sans-serif;
            }
            QScrollArea, QScrollBar {
                border: none;
                background-color: transparent;
            }
            QScrollBar:vertical {
                width: 10px;
                background-color: rgba(255, 255, 255, 0.05);
                border-radius: 5px;
            }
            QScrollBar::handle:vertical {
                background-color: rgba(255, 255, 255, 0.2);
                border-radius: 5px;
            }
            QScrollBar::handle:vertical:hover {
                background-color: rgba(255, 255, 255, 0.3);
            }
            QScrollBar::add-line:vertical, QScrollBar::sub-line:vertical {
                height: 0px;
            }
            QLineEdit, QTextEdit {
                background-color: rgba(255, 255, 255, 0.05);
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 4px;
                padding: 10px;
                color: #e0e0e0;
                selection-background-color: rgba(0, 180, 216, 0.3);
            }
            QLineEdit:focus, QTextEdit:focus {
                border: 1px solid rgba(0, 180, 216, 0.5);
            }
            QLabel {
                color: #e0e0e0;
            }
            QProgressBar {
                border: none;
                border-radius: 4px;
                background-color: rgba(255, 255, 255, 0.1);
                text-align: center;
                color: #e0e0e0;
            }
            QProgressBar::chunk {
                background-color: #00b4d8;
                border-radius: 4px;
            }
            QComboBox {
                background-color: rgba(255, 255, 255, 0.05);
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 4px;
                padding: 8px;
                color: #e0e0e0;
            }
            QComboBox::drop-down {
                border: none;
                width: 20px;
            }
            QComboBox QAbstractItemView {
                background-color: #1a1a2e;
                border: 1px solid rgba(255, 255, 255, 0.1);
                selection-background-color: rgba(0, 180, 216, 0.3);
            }
            QRadioButton, QCheckBox {
                color: #e0e0e0;
                spacing: 8px;
            }
            QRadioButton::indicator, QCheckBox::indicator {
                width: 18px;
                height: 18px;
            }
            QRadioButton::indicator:checked, QCheckBox::indicator:checked {
                background-color: #00b4d8;
            }
        """)

        # Create central widget
        central_widget = QWidget()
        self.setCentralWidget(central_widget)

        # Create main layout
        main_layout = QHBoxLayout(central_widget)
        main_layout.setContentsMargins(0, 0, 0, 0)
        main_layout.setSpacing(0)

        # Create sidebar
        sidebar = QWidget()
        sidebar.setFixedWidth(250)
        sidebar.setStyleSheet("background-color: #16213e;")
        sidebar_layout = QVBoxLayout(sidebar)
        sidebar_layout.setContentsMargins(0, 0, 0, 0)
        sidebar_layout.setSpacing(0)

        # Add logo to sidebar
        logo_container = QWidget()
        logo_container.setFixedHeight(80)
        logo_container.setStyleSheet("background-color: #0f3460;")
        logo_layout = QHBoxLayout(logo_container)
        logo_label = QLabel("🔐 LESAVOT")
        logo_label.setStyleSheet("font-size: 20px; font-weight: bold; color: #e0e0e0;")
        logo_layout.addWidget(logo_label)
        sidebar_layout.addWidget(logo_container)

        # Add navigation buttons to sidebar
        self.home_btn = SidebarButton("", "Dashboard", self)
        self.image_btn = SidebarButton("", "Image Steganography", self)
        self.text_btn = SidebarButton("", "Text Steganography", self)
        self.audio_btn = SidebarButton("", "Audio Steganography", self)
        self.settings_btn = SidebarButton("", "Settings", self)

        # Set first button as checked
        self.home_btn.setChecked(True)

        # Add buttons to sidebar
        sidebar_layout.addWidget(self.home_btn)
        sidebar_layout.addWidget(self.image_btn)
        sidebar_layout.addWidget(self.text_btn)
        sidebar_layout.addWidget(self.audio_btn)
        sidebar_layout.addWidget(self.settings_btn)
        sidebar_layout.addStretch()

        # Create stacked widget for different pages
        self.pages = QStackedWidget()

        # Create pages
        self.dashboard_page = self.create_dashboard_page()
        self.image_page = self.create_image_page()
        self.text_page = self.create_text_page()
        self.audio_page = self.create_audio_page()
        self.settings_page = self.create_settings_page()

        # Add pages to stacked widget
        self.pages.addWidget(self.dashboard_page)
        self.pages.addWidget(self.image_page)
        self.pages.addWidget(self.text_page)
        self.pages.addWidget(self.audio_page)
        self.pages.addWidget(self.settings_page)

        # Connect buttons to change page
        self.home_btn.clicked.connect(lambda: self.change_page(0))
        self.image_btn.clicked.connect(lambda: self.change_page(1))
        self.text_btn.clicked.connect(lambda: self.change_page(2))
        self.audio_btn.clicked.connect(lambda: self.change_page(3))
        self.settings_btn.clicked.connect(lambda: self.change_page(4))

        # Add widgets to main layout
        main_layout.addWidget(sidebar)
        main_layout.addWidget(self.pages)

        # Show the window
        self.show()

    def change_page(self, index):
        """Change the current page."""
        self.pages.setCurrentIndex(index)

        # Update button states
        self.home_btn.setChecked(index == 0)
        self.image_btn.setChecked(index == 1)
        self.text_btn.setChecked(index == 2)
        self.audio_btn.setChecked(index == 3)
        self.settings_btn.setChecked(index == 4)

    def create_dashboard_page(self):
        """Create the dashboard page."""
        page = QWidget()
        layout = QVBoxLayout(page)
        layout.setContentsMargins(30, 30, 30, 30)
        layout.setSpacing(20)

        # Add header
        header = QLabel("Welcome to LESAVOT")
        header.setStyleSheet("font-size: 28px; font-weight: bold; color: #e0e0e0;")
        layout.addWidget(header)

        # Add description
        description = QLabel("Secure Multimodal Steganography Platform")
        description.setStyleSheet("font-size: 16px; color: #90a4ae; margin-bottom: 20px;")
        layout.addWidget(description)

        # Add cards container
        cards_container = QWidget()
        cards_layout = QHBoxLayout(cards_container)
        cards_layout.setSpacing(20)

        # Create cards for each steganography method
        image_card = self.create_method_card("Image Steganography", "Hide messages in images using LSB technique", 1)
        text_card = self.create_method_card("Text Steganography", "Hide messages in text using whitespace encoding", 2)
        audio_card = self.create_method_card("Audio Steganography", "Hide messages in audio using phase encoding", 3)

        # Add cards to layout
        cards_layout.addWidget(image_card)
        cards_layout.addWidget(text_card)
        cards_layout.addWidget(audio_card)

        # Add cards container to layout
        layout.addWidget(cards_container)

        # Add security info
        security_frame = QFrame()
        security_frame.setStyleSheet("""
            QFrame {
                background-color: rgba(255, 255, 255, 0.05);
                border-radius: 8px;
                padding: 20px;
            }
        """)
        security_layout = QVBoxLayout(security_frame)

        security_header = QLabel("Security Information")
        security_header.setStyleSheet("font-size: 18px; font-weight: bold; color: #e0e0e0;")
        security_layout.addWidget(security_header)

        security_info = QLabel(
            "LESAVOT uses advanced steganography techniques to hide your messages securely. "
            "All operations are performed locally on your device, ensuring your data never leaves your computer. "
            "For maximum security, consider encrypting your messages before hiding them."
        )
        security_info.setWordWrap(True)
        security_info.setStyleSheet("color: #90a4ae;")
        security_layout.addWidget(security_info)

        layout.addWidget(security_frame)
        layout.addStretch()

        return page

    def create_method_card(self, title, description, page_index):
        """Create a card for a steganography method."""
        card = QFrame()
        card.setCursor(Qt.PointingHandCursor)
        card.setStyleSheet("""
            QFrame {
                background-color: rgba(255, 255, 255, 0.05);
                border-radius: 8px;
                padding: 20px;
            }
            QFrame:hover {
                background-color: rgba(255, 255, 255, 0.1);
            }
        """)
        card_layout = QVBoxLayout(card)

        # Add title
        title_label = QLabel(title)
        title_label.setStyleSheet("font-size: 18px; font-weight: bold; color: #e0e0e0;")
        card_layout.addWidget(title_label)

        # Add description
        desc_label = QLabel(description)
        desc_label.setWordWrap(True)
        desc_label.setStyleSheet("color: #90a4ae; margin-bottom: 15px;")
        card_layout.addWidget(desc_label)

        # Add button
        button = ModernButton("Open", primary=True)
        button.clicked.connect(lambda: self.change_page(page_index))
        card_layout.addWidget(button)

        return card

    def create_image_page(self):
        """Create the image steganography page."""
        page = QWidget()
        layout = QVBoxLayout(page)
        layout.setContentsMargins(30, 30, 30, 30)
        layout.setSpacing(20)

        # Add header
        header = QLabel("Image Steganography")
        header.setStyleSheet("font-size: 24px; font-weight: bold; color: #e0e0e0;")
        layout.addWidget(header)

        # Add description
        description = QLabel("Hide messages in images using the Least Significant Bit (LSB) technique")
        description.setStyleSheet("font-size: 14px; color: #90a4ae; margin-bottom: 20px;")
        layout.addWidget(description)

        # Create tabs for encode/decode
        tabs = QWidget()
        tabs_layout = QHBoxLayout(tabs)
        tabs_layout.setContentsMargins(0, 0, 0, 0)
        tabs_layout.setSpacing(0)

        # Create tab buttons
        self.encode_image_btn = QPushButton("Hide Message")
        self.decode_image_btn = QPushButton("Extract Message")

        # Style tab buttons
        tab_button_style = """
            QPushButton {
                background-color: transparent;
                border: none;
                border-bottom: 2px solid rgba(255, 255, 255, 0.1);
                color: #90a4ae;
                padding: 10px 20px;
                font-size: 14px;
            }
            QPushButton:hover {
                color: #e0e0e0;
            }
            QPushButton:checked {
                color: #00b4d8;
                border-bottom: 2px solid #00b4d8;
            }
        """
        self.encode_image_btn.setStyleSheet(tab_button_style)
        self.decode_image_btn.setStyleSheet(tab_button_style)

        # Make buttons checkable
        self.encode_image_btn.setCheckable(True)
        self.decode_image_btn.setCheckable(True)
        self.encode_image_btn.setChecked(True)

        # Add buttons to tabs layout
        tabs_layout.addWidget(self.encode_image_btn)
        tabs_layout.addWidget(self.decode_image_btn)
        tabs_layout.addStretch()

        # Add tabs to layout
        layout.addWidget(tabs)

        # Create stacked widget for encode/decode
        self.image_stack = QStackedWidget()

        # Create encode widget
        encode_widget = QWidget()
        encode_layout = QVBoxLayout(encode_widget)
        encode_layout.setContentsMargins(0, 20, 0, 0)

        # Create file drop area
        self.image_drop_area = FileDropArea("Drag and drop an image here or click to browse")
        self.image_drop_area.fileDropped.connect(self.load_image)
        self.image_drop_area.mousePressEvent = lambda e: self.browse_image()
        encode_layout.addWidget(self.image_drop_area)

        # Create image preview
        self.image_preview = QLabel("No image selected")
        self.image_preview.setAlignment(Qt.AlignCenter)
        self.image_preview.setMinimumHeight(200)
        self.image_preview.setStyleSheet("background-color: rgba(255, 255, 255, 0.05); border-radius: 8px;")
        self.image_preview.setVisible(False)
        encode_layout.addWidget(self.image_preview)

        # Create message input
        message_label = QLabel("Message to Hide:")
        message_label.setStyleSheet("font-size: 14px; font-weight: bold; margin-top: 20px;")
        encode_layout.addWidget(message_label)

        self.image_message = QTextEdit()
        self.image_message.setPlaceholderText("Enter your secret message here...")
        self.image_message.setMinimumHeight(100)
        encode_layout.addWidget(self.image_message)

        # Create button
        self.hide_button = ModernButton("Hide Message")
        self.hide_button.clicked.connect(self.hide_in_image)
        encode_layout.addWidget(self.hide_button, alignment=Qt.AlignRight)

        # Create decode widget
        decode_widget = QWidget()
        decode_layout = QVBoxLayout(decode_widget)
        decode_layout.setContentsMargins(0, 20, 0, 0)

        # Create file drop area for decode
        self.decode_image_drop_area = FileDropArea("Drag and drop an image with hidden message here or click to browse")
        self.decode_image_drop_area.fileDropped.connect(self.load_decode_image)
        self.decode_image_drop_area.mousePressEvent = lambda e: self.browse_decode_image()
        decode_layout.addWidget(self.decode_image_drop_area)

        # Create decode image preview
        self.decode_image_preview = QLabel("No image selected")
        self.decode_image_preview.setAlignment(Qt.AlignCenter)
        self.decode_image_preview.setMinimumHeight(200)
        self.decode_image_preview.setStyleSheet("background-color: rgba(255, 255, 255, 0.05); border-radius: 8px;")
        self.decode_image_preview.setVisible(False)
        decode_layout.addWidget(self.decode_image_preview)

        # Create extracted message display
        extracted_label = QLabel("Extracted Message:")
        extracted_label.setStyleSheet("font-size: 14px; font-weight: bold; margin-top: 20px;")
        decode_layout.addWidget(extracted_label)

        self.extracted_message = QTextEdit()
        self.extracted_message.setReadOnly(True)
        self.extracted_message.setPlaceholderText("Extracted message will appear here...")
        self.extracted_message.setMinimumHeight(100)
        decode_layout.addWidget(self.extracted_message)

        # Create button
        self.extract_button = ModernButton("Extract Message")
        self.extract_button.clicked.connect(self.extract_from_image)
        decode_layout.addWidget(self.extract_button, alignment=Qt.AlignRight)

        # Add widgets to stack
        self.image_stack.addWidget(encode_widget)
        self.image_stack.addWidget(decode_widget)

        # Connect tab buttons
        self.encode_image_btn.clicked.connect(lambda: self.switch_image_tab(0))
        self.decode_image_btn.clicked.connect(lambda: self.switch_image_tab(1))

        # Add stack to layout
        layout.addWidget(self.image_stack)

        # Initialize variables
        self.current_image = None
        self.current_decode_image = None

        return page

    def switch_image_tab(self, index):
        """Switch between encode and decode tabs for image steganography."""
        self.image_stack.setCurrentIndex(index)
        self.encode_image_btn.setChecked(index == 0)
        self.decode_image_btn.setChecked(index == 1)

    def browse_image(self):
        """Open file dialog to select an image."""
        file_path, _ = QFileDialog.getOpenFileName(self, "Select Image", "", "Image Files (*.png *.jpg *.jpeg *.bmp)")
        if file_path:
            self.load_image(file_path)

    def load_image(self, file_path):
        """Load an image for encoding."""
        try:
            self.current_image = Image.open(file_path)
            pixmap = QPixmap(file_path)
            if not pixmap.isNull():
                pixmap = pixmap.scaled(400, 300, Qt.KeepAspectRatio, Qt.SmoothTransformation)
                self.image_preview.setPixmap(pixmap)
                self.image_preview.setVisible(True)
                self.image_drop_area.setText(f"Selected: {os.path.basename(file_path)}")
            else:
                self.image_preview.setText("Failed to load image")
        except Exception as e:
            QMessageBox.critical(self, "Error", f"Failed to load image: {str(e)}")

    def browse_decode_image(self):
        """Open file dialog to select an image for decoding."""
        file_path, _ = QFileDialog.getOpenFileName(self, "Select Image with Hidden Message", "", "Image Files (*.png *.jpg *.jpeg *.bmp)")
        if file_path:
            self.load_decode_image(file_path)

    def load_decode_image(self, file_path):
        """Load an image for decoding."""
        try:
            self.current_decode_image = Image.open(file_path)
            pixmap = QPixmap(file_path)
            if not pixmap.isNull():
                pixmap = pixmap.scaled(400, 300, Qt.KeepAspectRatio, Qt.SmoothTransformation)
                self.decode_image_preview.setPixmap(pixmap)
                self.decode_image_preview.setVisible(True)
                self.decode_image_drop_area.setText(f"Selected: {os.path.basename(file_path)}")
            else:
                self.decode_image_preview.setText("Failed to load image")
        except Exception as e:
            QMessageBox.critical(self, "Error", f"Failed to load image: {str(e)}")

    def hide_in_image(self):
        """Hide a message in an image."""
        if not self.current_image:
            QMessageBox.warning(self, "Warning", "Please select an image first.")
            return

        message = self.image_message.toPlainText()
        if not message:
            QMessageBox.warning(self, "Warning", "Please enter a message to hide.")
            return

        try:
            # Hide the message
            stego_image = hide_message_in_image(self.current_image, message)

            # Save the stego image
            save_path, _ = QFileDialog.getSaveFileName(self, "Save Stego Image", "", "PNG Files (*.png)")
            if save_path:
                stego_image.save(save_path)
                QMessageBox.information(self, "Success", "Message hidden successfully!")
        except Exception as e:
            QMessageBox.critical(self, "Error", f"Failed to hide message: {str(e)}")

    def extract_from_image(self):
        """Extract a hidden message from an image."""
        if not self.current_decode_image:
            QMessageBox.warning(self, "Warning", "Please select an image first.")
            return

        try:
            # Extract the message
            message = extract_message_from_image(self.current_decode_image)

            # Display the message
            self.extracted_message.setText(message)
        except Exception as e:
            QMessageBox.critical(self, "Error", f"Failed to extract message: {str(e)}")

    def create_text_page(self):
        """Create the text steganography page."""
        page = QWidget()
        layout = QVBoxLayout(page)
        layout.setContentsMargins(30, 30, 30, 30)
        layout.setSpacing(20)

        # Add header
        header = QLabel("Text Steganography")
        header.setStyleSheet("font-size: 24px; font-weight: bold; color: #e0e0e0;")
        layout.addWidget(header)

        # Add description
        description = QLabel("Hide messages in text files using whitespace encoding")
        description.setStyleSheet("font-size: 14px; color: #90a4ae; margin-bottom: 20px;")
        layout.addWidget(description)

        # Create placeholder content
        content = QLabel("Text steganography functionality will be implemented here.")
        content.setAlignment(Qt.AlignCenter)
        content.setStyleSheet("font-size: 16px; color: #90a4ae;")
        layout.addWidget(content)

        return page

    def create_audio_page(self):
        """Create the audio steganography page."""
        page = QWidget()
        layout = QVBoxLayout(page)
        layout.setContentsMargins(30, 30, 30, 30)
        layout.setSpacing(20)

        # Add header
        header = QLabel("Audio Steganography")
        header.setStyleSheet("font-size: 24px; font-weight: bold; color: #e0e0e0;")
        layout.addWidget(header)

        # Add description
        description = QLabel("Hide messages in audio files using phase encoding")
        description.setStyleSheet("font-size: 14px; color: #90a4ae; margin-bottom: 20px;")
        layout.addWidget(description)

        # Create placeholder content
        content = QLabel("Audio steganography functionality will be implemented here.")
        content.setAlignment(Qt.AlignCenter)
        content.setStyleSheet("font-size: 16px; color: #90a4ae;")
        layout.addWidget(content)

        return page

    def create_settings_page(self):
        """Create the settings page."""
        page = QWidget()
        layout = QVBoxLayout(page)
        layout.setContentsMargins(30, 30, 30, 30)
        layout.setSpacing(20)

        # Add header
        header = QLabel("Settings")
        header.setStyleSheet("font-size: 24px; font-weight: bold; color: #e0e0e0;")
        layout.addWidget(header)

        # Add description
        description = QLabel("Configure application settings")
        description.setStyleSheet("font-size: 14px; color: #90a4ae; margin-bottom: 20px;")
        layout.addWidget(description)

        # Create placeholder content
        content = QLabel("Settings functionality will be implemented here.")
        content.setAlignment(Qt.AlignCenter)
        content.setStyleSheet("font-size: 16px; color: #90a4ae;")
        layout.addWidget(content)

        return page

# Main function
def main():
    app = QApplication(sys.argv)
    window = LesavotApp()
    sys.exit(app.exec_())

# Run the application if this script is executed directly
if __name__ == "__main__":
    main()