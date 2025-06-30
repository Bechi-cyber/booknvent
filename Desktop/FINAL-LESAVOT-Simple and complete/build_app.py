#!/usr/bin/env python3
"""
Build script for LESAVOT Steganography Application
This script creates a standalone executable using PyInstaller
"""

import os
import sys
import subprocess
import shutil

def build_executable():
    """Build the standalone executable."""
    print("Building LESAVOT Steganography Application...")
    
    # Create build directory if it doesn't exist
    if not os.path.exists('build'):
        os.makedirs('build')
    
    # Create dist directory if it doesn't exist
    if not os.path.exists('dist'):
        os.makedirs('dist')
    
    # Build the executable
    cmd = [
        'pyinstaller',
        '--name=LESAVOT',
        '--windowed',  # No console window
        '--onefile',   # Single executable file
        '--icon=app_icon.ico',  # Application icon (create this file)
        '--add-data=README.md;.',  # Include README
        'lesavot_app.py'  # Main script
    ]
    
    # Run PyInstaller
    try:
        subprocess.run(cmd, check=True)
        print("Build completed successfully!")
        print(f"Executable created at: {os.path.abspath('dist/LESAVOT.exe')}")
    except subprocess.CalledProcessError as e:
        print(f"Error building executable: {e}")
        return False
    
    return True

if __name__ == "__main__":
    # Check if PyInstaller is installed
    try:
        import PyInstaller
    except ImportError:
        print("PyInstaller is not installed. Installing...")
        subprocess.run([sys.executable, '-m', 'pip', 'install', 'pyinstaller'], check=True)
    
    # Build the executable
    build_executable()
