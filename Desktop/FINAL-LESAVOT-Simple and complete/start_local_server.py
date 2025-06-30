#!/usr/bin/env python3
"""
Simple HTTP server for the LESAVOT Multimodal Steganography web application.
This script starts a local web server to serve the application files.
"""

import http.server
import socketserver
import webbrowser
import os
import sys
import time
from threading import Thread

# Configuration
PORT = 8000
DIRECTORY = os.path.dirname(os.path.abspath(__file__))
INDEX_FILE = "run_web_app.html"

def open_browser():
    """Open the web browser after a short delay"""
    time.sleep(1)  # Give the server a moment to start
    url = f"http://localhost:{PORT}/{INDEX_FILE}"
    print(f"\nOpening {url} in your default web browser...")
    webbrowser.open(url)

def start_server():
    """Start the HTTP server"""
    # Change to the script's directory
    os.chdir(DIRECTORY)
    
    # Create the server
    Handler = http.server.SimpleHTTPRequestHandler
    httpd = socketserver.TCPServer(("", PORT), Handler)
    
    print(f"\n{'='*60}")
    print(f"LESAVOT Multimodal Steganography Web Server")
    print(f"{'='*60}")
    print(f"\nServing files from: {DIRECTORY}")
    print(f"Server running at: http://localhost:{PORT}")
    print(f"\nPress Ctrl+C to stop the server")
    print(f"{'='*60}\n")
    
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nServer stopped.")
        httpd.server_close()

if __name__ == "__main__":
    # Check if the required files exist
    if not os.path.exists(INDEX_FILE):
        print(f"Error: {INDEX_FILE} not found in {DIRECTORY}")
        sys.exit(1)
    
    if not os.path.exists("web_version"):
        print(f"Error: web_version directory not found in {DIRECTORY}")
        sys.exit(1)
    
    # Start the browser in a separate thread
    browser_thread = Thread(target=open_browser)
    browser_thread.daemon = True
    browser_thread.start()
    
    # Start the server
    start_server()
