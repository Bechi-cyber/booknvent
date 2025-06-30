#!/bin/bash

echo "Starting LESAVOT Multimodal Steganography Web Application..."
echo

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "Python 3 is not installed or not in your PATH."
    echo "Please install Python from https://www.python.org/downloads/"
    echo
    echo "Alternatively, you can open the application directly:"
    echo "1. Open the 'run_web_app.html' file in your web browser"
    echo
    read -p "Press Enter to continue..."
    exit 1
fi

# Make the script executable
chmod +x start_local_server.py

# Run the Python server script
python3 start_local_server.py

read -p "Press Enter to continue..."
