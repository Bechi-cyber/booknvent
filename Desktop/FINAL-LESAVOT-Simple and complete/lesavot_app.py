#!/usr/bin/env python3
"""
LESAVOT - Multimodal Steganography Desktop Application
A secure application for hiding messages in images, text, and audio files.
"""

import sys
import os
import base64
import io
from PIL import Image
import numpy as np
import uuid
import scipy.io.wavfile as wavfile
from PyQt5.QtWidgets import (QApplication, QMainWindow, QWidget, QTabWidget,
                            QVBoxLayout, QHBoxLayout, QLabel, QPushButton,
                            QLineEdit, QTextEdit, QFileDialog, QMessageBox,
                            QStackedWidget, QFrame, QProgressBar, QSplitter,
                            QComboBox, QCheckBox, QRadioButton, QGroupBox)
from PyQt5.QtGui import QPixmap, QFont, QIcon, QColor, QPalette, QImage
from PyQt5.QtCore import Qt, QSize, QTimer, QThread, pyqtSignal

# Steganography functions from our web app
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

# Main application window
class LesavotApp(QMainWindow):
    def __init__(self):
        super().__init__()
        self.initUI()

    def initUI(self):
        # Set window properties
        self.setWindowTitle('LESAVOT - Secure Steganography')
        self.setMinimumSize(1000, 700)

        # Set dark theme
        self.setStyleSheet("""
            QMainWindow, QWidget {
                background-color: #0a1929;
                color: #e0e0e0;
            }
            QTabWidget::pane {
                border: 1px solid rgba(0, 180, 216, 0.3);
                border-radius: 8px;
                background-color: rgba(16, 42, 67, 0.8);
            }
            QTabBar::tab {
                background-color: rgba(16, 42, 67, 0.5);
                color: #90a4ae;
                border-top-left-radius: 4px;
                border-top-right-radius: 4px;
                padding: 8px 16px;
                margin-right: 2px;
            }
            QTabBar::tab:selected {
                background-color: rgba(16, 42, 67, 0.8);
                color: #00b4d8;
                border-bottom: 2px solid #00b4d8;
            }
            QPushButton {
                background-color: #00b4d8;
                color: #0a1929;
                border: none;
                border-radius: 4px;
                padding: 8px 16px;
                font-weight: bold;
            }
            QPushButton:hover {
                background-color: #0096c7;
            }
            QPushButton:disabled {
                background-color: #607d8b;
                color: #455a64;
            }
            QLineEdit, QTextEdit {
                background-color: rgba(10, 25, 41, 0.5);
                border: 1px solid rgba(0, 180, 216, 0.3);
                border-radius: 4px;
                padding: 8px;
                color: #e0e0e0;
            }
            QLabel {
                color: #e0e0e0;
            }
            QProgressBar {
                border: 1px solid rgba(0, 180, 216, 0.3);
                border-radius: 4px;
                background-color: rgba(10, 25, 41, 0.5);
                text-align: center;
            }
            QProgressBar::chunk {
                background-color: #00b4d8;
                border-radius: 4px;
            }
        """)

        # Create central widget and main layout
        central_widget = QWidget()
        self.setCentralWidget(central_widget)
        main_layout = QVBoxLayout(central_widget)

        # Create header
        header = QWidget()
        header_layout = QHBoxLayout(header)

        logo_label = QLabel("🔐 LESAVOT")
        logo_label.setFont(QFont("Arial", 18, QFont.Bold))
        header_layout.addWidget(logo_label)

        header_layout.addStretch()

        # Create tab widget for different steganography methods
        self.tabs = QTabWidget()
        self.tabs.setTabPosition(QTabWidget.North)
        self.tabs.setMovable(True)

        # Create tabs for different steganography methods
        self.image_tab = self.create_image_tab()
        self.text_tab = self.create_text_tab()
        self.audio_tab = self.create_audio_tab()

        self.tabs.addTab(self.image_tab, "Image Steganography")
        self.tabs.addTab(self.text_tab, "Text Steganography")
        self.tabs.addTab(self.audio_tab, "Audio Steganography")

        # Add header and tabs to main layout
        main_layout.addWidget(header)
        main_layout.addWidget(self.tabs)

        # Create status bar
        self.statusBar().showMessage('Ready')

        # Show the window
        self.show()

    def create_image_tab(self):
        """Create the image steganography tab."""
        tab = QWidget()
        layout = QVBoxLayout(tab)

        # Create mode selection
        mode_group = QGroupBox("Operation Mode")
        mode_layout = QHBoxLayout(mode_group)

        self.image_encode_radio = QRadioButton("Hide Message")
        self.image_decode_radio = QRadioButton("Extract Message")
        self.image_encode_radio.setChecked(True)

        mode_layout.addWidget(self.image_encode_radio)
        mode_layout.addWidget(self.image_decode_radio)

        # Create stacked widget for different modes
        self.image_stack = QStackedWidget()

        # Create encode widget
        encode_widget = QWidget()
        encode_layout = QVBoxLayout(encode_widget)

        # File selection
        file_frame = QFrame()
        file_layout = QHBoxLayout(file_frame)

        file_label = QLabel("Select Image:")
        self.image_file_path = QLineEdit()
        self.image_file_path.setReadOnly(True)
        browse_button = QPushButton("Browse")
        browse_button.clicked.connect(self.browse_image)

        file_layout.addWidget(file_label)
        file_layout.addWidget(self.image_file_path)
        file_layout.addWidget(browse_button)

        # Message input
        message_label = QLabel("Message to Hide:")
        self.image_message = QTextEdit()

        # Image preview
        preview_frame = QFrame()
        preview_layout = QHBoxLayout(preview_frame)

        self.image_preview = QLabel("No image selected")
        self.image_preview.setAlignment(Qt.AlignCenter)
        self.image_preview.setMinimumHeight(200)
        self.image_preview.setStyleSheet("border: 1px dashed rgba(0, 180, 216, 0.3);")

        preview_layout.addWidget(self.image_preview)

        # Process button
        self.image_process_button = QPushButton("Hide Message")
        self.image_process_button.clicked.connect(self.process_image)

        # Add widgets to encode layout
        encode_layout.addWidget(file_frame)
        encode_layout.addWidget(message_label)
        encode_layout.addWidget(self.image_message)
        encode_layout.addWidget(preview_frame)
        encode_layout.addWidget(self.image_process_button)

        # Create decode widget
        decode_widget = QWidget()
        decode_layout = QVBoxLayout(decode_widget)

        # File selection for decode
        decode_file_frame = QFrame()
        decode_file_layout = QHBoxLayout(decode_file_frame)

        decode_file_label = QLabel("Select Image with Hidden Message:")
        self.decode_image_file_path = QLineEdit()
        self.decode_image_file_path.setReadOnly(True)
        decode_browse_button = QPushButton("Browse")
        decode_browse_button.clicked.connect(self.browse_decode_image)

        decode_file_layout.addWidget(decode_file_label)
        decode_file_layout.addWidget(self.decode_image_file_path)
        decode_file_layout.addWidget(decode_browse_button)

        # Decode image preview
        decode_preview_frame = QFrame()
        decode_preview_layout = QHBoxLayout(decode_preview_frame)

        self.decode_image_preview = QLabel("No image selected")
        self.decode_image_preview.setAlignment(Qt.AlignCenter)
        self.decode_image_preview.setMinimumHeight(200)
        self.decode_image_preview.setStyleSheet("border: 1px dashed rgba(0, 180, 216, 0.3);")

        decode_preview_layout.addWidget(self.decode_image_preview)

        # Extracted message
        extracted_label = QLabel("Extracted Message:")
        self.extracted_message = QTextEdit()
        self.extracted_message.setReadOnly(True)

        # Extract button
        self.extract_button = QPushButton("Extract Message")
        self.extract_button.clicked.connect(self.extract_from_image)

        # Add widgets to decode layout
        decode_layout.addWidget(decode_file_frame)
        decode_layout.addWidget(decode_preview_frame)
        decode_layout.addWidget(extracted_label)
        decode_layout.addWidget(self.extracted_message)
        decode_layout.addWidget(self.extract_button)

        # Add widgets to stack
        self.image_stack.addWidget(encode_widget)
        self.image_stack.addWidget(decode_widget)

        # Connect radio buttons to stack
        self.image_encode_radio.toggled.connect(lambda: self.image_stack.setCurrentIndex(0))
        self.image_decode_radio.toggled.connect(lambda: self.image_stack.setCurrentIndex(1))

        # Add widgets to tab layout
        layout.addWidget(mode_group)
        layout.addWidget(self.image_stack)

        return tab

    def create_text_tab(self):
        """Create the text steganography tab."""
        tab = QWidget()
        layout = QVBoxLayout(tab)

        # Create mode selection
        mode_group = QGroupBox("Operation Mode")
        mode_layout = QHBoxLayout(mode_group)

        self.text_encode_radio = QRadioButton("Hide Message")
        self.text_decode_radio = QRadioButton("Extract Message")
        self.text_encode_radio.setChecked(True)

        mode_layout.addWidget(self.text_encode_radio)
        mode_layout.addWidget(self.text_decode_radio)

        # Create stacked widget for different modes
        self.text_stack = QStackedWidget()

        # Create encode widget
        encode_widget = QWidget()
        encode_layout = QVBoxLayout(encode_widget)

        # File selection
        file_frame = QFrame()
        file_layout = QHBoxLayout(file_frame)

        file_label = QLabel("Select Text File:")
        self.text_file_path = QLineEdit()
        self.text_file_path.setReadOnly(True)
        browse_button = QPushButton("Browse")
        browse_button.clicked.connect(self.browse_text)

        file_layout.addWidget(file_label)
        file_layout.addWidget(self.text_file_path)
        file_layout.addWidget(browse_button)

        # Text content preview
        content_label = QLabel("Text Content:")
        self.text_content = QTextEdit()
        self.text_content.setReadOnly(True)

        # Message input
        message_label = QLabel("Message to Hide:")
        self.text_message = QTextEdit()

        # Process button
        self.text_process_button = QPushButton("Hide Message")
        self.text_process_button.clicked.connect(self.process_text)

        # Add widgets to encode layout
        encode_layout.addWidget(file_frame)
        encode_layout.addWidget(content_label)
        encode_layout.addWidget(self.text_content)
        encode_layout.addWidget(message_label)
        encode_layout.addWidget(self.text_message)
        encode_layout.addWidget(self.text_process_button)

        # Create decode widget
        decode_widget = QWidget()
        decode_layout = QVBoxLayout(decode_widget)

        # File selection for decode
        decode_file_frame = QFrame()
        decode_file_layout = QHBoxLayout(decode_file_frame)

        decode_file_label = QLabel("Select Text File with Hidden Message:")
        self.decode_text_file_path = QLineEdit()
        self.decode_text_file_path.setReadOnly(True)
        decode_browse_button = QPushButton("Browse")
        decode_browse_button.clicked.connect(self.browse_decode_text)

        decode_file_layout.addWidget(decode_file_label)
        decode_file_layout.addWidget(self.decode_text_file_path)
        decode_file_layout.addWidget(decode_browse_button)

        # Decode text content
        decode_content_label = QLabel("Text Content:")
        self.decode_text_content = QTextEdit()
        self.decode_text_content.setReadOnly(True)

        # Extracted message
        extracted_label = QLabel("Extracted Message:")
        self.text_extracted_message = QTextEdit()
        self.text_extracted_message.setReadOnly(True)

        # Extract button
        self.text_extract_button = QPushButton("Extract Message")
        self.text_extract_button.clicked.connect(self.extract_from_text)

        # Add widgets to decode layout
        decode_layout.addWidget(decode_file_frame)
        decode_layout.addWidget(decode_content_label)
        decode_layout.addWidget(self.decode_text_content)
        decode_layout.addWidget(extracted_label)
        decode_layout.addWidget(self.text_extracted_message)
        decode_layout.addWidget(self.text_extract_button)

        # Add widgets to stack
        self.text_stack.addWidget(encode_widget)
        self.text_stack.addWidget(decode_widget)

        # Connect radio buttons to stack
        self.text_encode_radio.toggled.connect(lambda: self.text_stack.setCurrentIndex(0))
        self.text_decode_radio.toggled.connect(lambda: self.text_stack.setCurrentIndex(1))

        # Add widgets to tab layout
        layout.addWidget(mode_group)
        layout.addWidget(self.text_stack)

        return tab

    def create_audio_tab(self):
        """Create the audio steganography tab."""
        tab = QWidget()
        layout = QVBoxLayout(tab)

        # Create mode selection
        mode_group = QGroupBox("Operation Mode")
        mode_layout = QHBoxLayout(mode_group)

        self.audio_encode_radio = QRadioButton("Hide Message")
        self.audio_decode_radio = QRadioButton("Extract Message")
        self.audio_encode_radio.setChecked(True)

        mode_layout.addWidget(self.audio_encode_radio)
        mode_layout.addWidget(self.audio_decode_radio)

        # Create stacked widget for different modes
        self.audio_stack = QStackedWidget()

        # Create encode widget
        encode_widget = QWidget()
        encode_layout = QVBoxLayout(encode_widget)

        # File selection
        file_frame = QFrame()
        file_layout = QHBoxLayout(file_frame)

        file_label = QLabel("Select WAV Audio File:")
        self.audio_file_path = QLineEdit()
        self.audio_file_path.setReadOnly(True)
        browse_button = QPushButton("Browse")
        browse_button.clicked.connect(self.browse_audio)

        file_layout.addWidget(file_label)
        file_layout.addWidget(self.audio_file_path)
        file_layout.addWidget(browse_button)

        # Audio visualization placeholder
        audio_viz_label = QLabel("Audio Visualization:")
        self.audio_viz = QLabel("No audio selected")
        self.audio_viz.setAlignment(Qt.AlignCenter)
        self.audio_viz.setMinimumHeight(100)
        self.audio_viz.setStyleSheet("border: 1px dashed rgba(0, 180, 216, 0.3);")

        # Message input
        message_label = QLabel("Message to Hide:")
        self.audio_message = QTextEdit()

        # Process button
        self.audio_process_button = QPushButton("Hide Message")
        self.audio_process_button.clicked.connect(self.process_audio)

        # Add widgets to encode layout
        encode_layout.addWidget(file_frame)
        encode_layout.addWidget(audio_viz_label)
        encode_layout.addWidget(self.audio_viz)
        encode_layout.addWidget(message_label)
        encode_layout.addWidget(self.audio_message)
        encode_layout.addWidget(self.audio_process_button)

        # Create decode widget
        decode_widget = QWidget()
        decode_layout = QVBoxLayout(decode_widget)

        # File selection for decode
        decode_file_frame = QFrame()
        decode_file_layout = QHBoxLayout(decode_file_frame)

        decode_file_label = QLabel("Select Audio File with Hidden Message:")
        self.decode_audio_file_path = QLineEdit()
        self.decode_audio_file_path.setReadOnly(True)
        decode_browse_button = QPushButton("Browse")
        decode_browse_button.clicked.connect(self.browse_decode_audio)

        decode_file_layout.addWidget(decode_file_label)
        decode_file_layout.addWidget(self.decode_audio_file_path)
        decode_file_layout.addWidget(decode_browse_button)

        # Decode audio visualization
        decode_viz_label = QLabel("Audio Visualization:")
        self.decode_audio_viz = QLabel("No audio selected")
        self.decode_audio_viz.setAlignment(Qt.AlignCenter)
        self.decode_audio_viz.setMinimumHeight(100)
        self.decode_audio_viz.setStyleSheet("border: 1px dashed rgba(0, 180, 216, 0.3);")

        # Extracted message
        extracted_label = QLabel("Extracted Message:")
        self.audio_extracted_message = QTextEdit()
        self.audio_extracted_message.setReadOnly(True)

        # Extract button
        self.audio_extract_button = QPushButton("Extract Message")
        self.audio_extract_button.clicked.connect(self.extract_from_audio)

        # Add widgets to decode layout
        decode_layout.addWidget(decode_file_frame)
        decode_layout.addWidget(decode_viz_label)
        decode_layout.addWidget(self.decode_audio_viz)
        decode_layout.addWidget(extracted_label)
        decode_layout.addWidget(self.audio_extracted_message)
        decode_layout.addWidget(self.audio_extract_button)

        # Add widgets to stack
        self.audio_stack.addWidget(encode_widget)
        self.audio_stack.addWidget(decode_widget)

        # Connect radio buttons to stack
        self.audio_encode_radio.toggled.connect(lambda: self.audio_stack.setCurrentIndex(0))
        self.audio_decode_radio.toggled.connect(lambda: self.audio_stack.setCurrentIndex(1))

        # Add widgets to tab layout
        layout.addWidget(mode_group)
        layout.addWidget(self.audio_stack)

        return tab

    # Image steganography methods
    def browse_image(self):
        """Open file dialog to select an image."""
        file_path, _ = QFileDialog.getOpenFileName(self, "Select Image", "", "Image Files (*.png *.jpg *.jpeg *.bmp)")
        if file_path:
            self.image_file_path.setText(file_path)
            self.update_image_preview(file_path)

    def update_image_preview(self, file_path):
        """Update the image preview."""
        pixmap = QPixmap(file_path)
        if not pixmap.isNull():
            pixmap = pixmap.scaled(400, 300, Qt.KeepAspectRatio, Qt.SmoothTransformation)
            self.image_preview.setPixmap(pixmap)
        else:
            self.image_preview.setText("Failed to load image")

    def browse_decode_image(self):
        """Open file dialog to select an image for decoding."""
        file_path, _ = QFileDialog.getOpenFileName(self, "Select Image with Hidden Message", "", "Image Files (*.png *.jpg *.jpeg *.bmp)")
        if file_path:
            self.decode_image_file_path.setText(file_path)
            pixmap = QPixmap(file_path)
            if not pixmap.isNull():
                pixmap = pixmap.scaled(400, 300, Qt.KeepAspectRatio, Qt.SmoothTransformation)
                self.decode_image_preview.setPixmap(pixmap)
            else:
                self.decode_image_preview.setText("Failed to load image")

    def process_image(self):
        """Process the image to hide a message."""
        file_path = self.image_file_path.text()
        message = self.image_message.toPlainText()

        if not file_path:
            QMessageBox.warning(self, "Warning", "Please select an image file.")
            return

        if not message:
            QMessageBox.warning(self, "Warning", "Please enter a message to hide.")
            return

        try:
            # Load the image
            image = Image.open(file_path)

            # Hide the message
            stego_image = hide_message_in_image(image, message)

            # Save the stego image
            save_path, _ = QFileDialog.getSaveFileName(self, "Save Stego Image", "", "PNG Files (*.png)")
            if save_path:
                stego_image.save(save_path)
                QMessageBox.information(self, "Success", "Message hidden successfully!")
                self.statusBar().showMessage(f"Message hidden in {save_path}")

        except Exception as e:
            QMessageBox.critical(self, "Error", f"Failed to hide message: {str(e)}")

    def extract_from_image(self):
        """Extract a hidden message from an image."""
        file_path = self.decode_image_file_path.text()

        if not file_path:
            QMessageBox.warning(self, "Warning", "Please select an image file.")
            return

        try:
            # Load the image
            image = Image.open(file_path)

            # Extract the message
            message = extract_message_from_image(image)

            # Display the message
            self.extracted_message.setText(message)
            self.statusBar().showMessage("Message extracted successfully")

        except Exception as e:
            QMessageBox.critical(self, "Error", f"Failed to extract message: {str(e)}")

    # Text steganography methods
    def browse_text(self):
        """Open file dialog to select a text file."""
        file_path, _ = QFileDialog.getOpenFileName(self, "Select Text File", "", "Text Files (*.txt)")
        if file_path:
            self.text_file_path.setText(file_path)
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                    self.text_content.setText(content)
            except Exception as e:
                QMessageBox.critical(self, "Error", f"Failed to read text file: {str(e)}")

    def browse_decode_text(self):
        """Open file dialog to select a text file for decoding."""
        file_path, _ = QFileDialog.getOpenFileName(self, "Select Text File with Hidden Message", "", "Text Files (*.txt)")
        if file_path:
            self.decode_text_file_path.setText(file_path)
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                    self.decode_text_content.setText(content)
            except Exception as e:
                QMessageBox.critical(self, "Error", f"Failed to read text file: {str(e)}")

    def process_text(self):
        """Process the text file to hide a message."""
        file_path = self.text_file_path.text()
        message = self.text_message.toPlainText()

        if not file_path:
            QMessageBox.warning(self, "Warning", "Please select a text file.")
            return

        if not message:
            QMessageBox.warning(self, "Warning", "Please enter a message to hide.")
            return

        try:
            # Get the text content
            text_content = self.text_content.toPlainText()

            # Hide the message
            stego_text = hide_message_in_text(text_content, message)

            # Save the stego text
            save_path, _ = QFileDialog.getSaveFileName(self, "Save Stego Text", "", "Text Files (*.txt)")
            if save_path:
                with open(save_path, 'w', encoding='utf-8') as f:
                    f.write(stego_text)
                QMessageBox.information(self, "Success", "Message hidden successfully!")
                self.statusBar().showMessage(f"Message hidden in {save_path}")

        except Exception as e:
            QMessageBox.critical(self, "Error", f"Failed to hide message: {str(e)}")

    def extract_from_text(self):
        """Extract a hidden message from a text file."""
        file_path = self.decode_text_file_path.text()

        if not file_path:
            QMessageBox.warning(self, "Warning", "Please select a text file.")
            return

        try:
            # Get the text content
            stego_text = self.decode_text_content.toPlainText()

            # Extract the message
            message = extract_message_from_text(stego_text)

            # Display the message
            self.text_extracted_message.setText(message)
            self.statusBar().showMessage("Message extracted successfully")

        except Exception as e:
            QMessageBox.critical(self, "Error", f"Failed to extract message: {str(e)}")

    # Audio steganography methods
    def browse_audio(self):
        """Open file dialog to select an audio file."""
        file_path, _ = QFileDialog.getOpenFileName(self, "Select Audio File", "", "WAV Files (*.wav)")
        if file_path:
            self.audio_file_path.setText(file_path)
            self.audio_viz.setText(f"Audio file selected: {os.path.basename(file_path)}")

    def browse_decode_audio(self):
        """Open file dialog to select an audio file for decoding."""
        file_path, _ = QFileDialog.getOpenFileName(self, "Select Audio File with Hidden Message", "", "WAV Files (*.wav)")
        if file_path:
            self.decode_audio_file_path.setText(file_path)
            self.decode_audio_viz.setText(f"Audio file selected: {os.path.basename(file_path)}")

    def process_audio(self):
        """Process the audio file to hide a message."""
        file_path = self.audio_file_path.text()
        message = self.audio_message.toPlainText()

        if not file_path:
            QMessageBox.warning(self, "Warning", "Please select an audio file.")
            return

        if not message:
            QMessageBox.warning(self, "Warning", "Please enter a message to hide.")
            return

        try:
            # Load the audio file
            sample_rate, audio_data = wavfile.read(file_path)

            # Hide the message
            stego_audio = hide_message_in_audio(audio_data, sample_rate, message)

            # Save the stego audio
            save_path, _ = QFileDialog.getSaveFileName(self, "Save Stego Audio", "", "WAV Files (*.wav)")
            if save_path:
                wavfile.write(save_path, sample_rate, stego_audio.astype(audio_data.dtype))
                QMessageBox.information(self, "Success", "Message hidden successfully!")
                self.statusBar().showMessage(f"Message hidden in {save_path}")

        except Exception as e:
            QMessageBox.critical(self, "Error", f"Failed to hide message: {str(e)}")

    def extract_from_audio(self):
        """Extract a hidden message from an audio file."""
        file_path = self.decode_audio_file_path.text()

        if not file_path:
            QMessageBox.warning(self, "Warning", "Please select an audio file.")
            return

        try:
            # Load the audio file
            sample_rate, audio_data = wavfile.read(file_path)

            # Extract the message
            message = extract_message_from_audio(audio_data)

            # Display the message
            self.audio_extracted_message.setText(message)
            self.statusBar().showMessage("Message extracted successfully")

        except Exception as e:
            QMessageBox.critical(self, "Error", f"Failed to extract message: {str(e)}")

# Main function
def main():
    app = QApplication(sys.argv)
    window = LesavotApp()
    sys.exit(app.exec_())

# Run the application if this script is executed directly
if __name__ == "__main__":
    main()
