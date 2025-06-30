#!/usr/bin/env python3
"""
Test script to verify PyQt5 installation
"""

import sys
from PyQt5.QtWidgets import QApplication, QLabel, QMainWindow

def main():
    """Create a simple PyQt5 window."""
    app = QApplication(sys.argv)
    
    # Create a window
    window = QMainWindow()
    window.setWindowTitle("PyQt5 Test")
    window.setGeometry(100, 100, 300, 200)
    
    # Add a label
    label = QLabel("PyQt5 is working!", window)
    label.setGeometry(50, 50, 200, 50)
    
    # Show the window
    window.show()
    
    print("PyQt5 window created successfully!")
    print("If you can see a window with 'PyQt5 is working!' text, the installation is correct.")
    
    sys.exit(app.exec_())

if __name__ == "__main__":
    main()
