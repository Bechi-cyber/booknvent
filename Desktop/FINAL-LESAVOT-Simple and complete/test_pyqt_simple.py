#!/usr/bin/env python3
"""
Simple PyQt5 test script
"""

import sys
from PyQt5.QtWidgets import QApplication, QMainWindow, QLabel, QVBoxLayout, QWidget

def main():
    """Create a simple PyQt5 window."""
    print("Starting application...")
    app = QApplication(sys.argv)
    
    # Create a window
    window = QMainWindow()
    window.setWindowTitle("PyQt5 Test")
    window.setGeometry(100, 100, 300, 200)
    
    # Create central widget
    central_widget = QWidget()
    window.setCentralWidget(central_widget)
    
    # Create layout
    layout = QVBoxLayout(central_widget)
    
    # Add a label
    label = QLabel("PyQt5 is working!")
    layout.addWidget(label)
    
    # Show the window
    window.show()
    
    print("PyQt5 window created successfully!")
    print("If you can see a window with 'PyQt5 is working!' text, the installation is correct.")
    
    sys.exit(app.exec_())

if __name__ == "__main__":
    main()
