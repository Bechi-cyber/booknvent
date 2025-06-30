#!/usr/bin/env python3
"""
Script to update the LESAVOT package and automatically run the application in a web browser.
This script will:
1. Create or update the package
2. Open the application in the default web browser
"""

import os
import sys
import subprocess
import webbrowser
import time
import platform

def create_package():
    """Create the package using the existing script"""
    print("Creating/updating package...")
    try:
        # Run the package creation script
        subprocess.run(["python", "create_full_package.py"], check=True)
        print("Package created successfully!")
        return True
    except subprocess.CalledProcessError as e:
        print(f"Error creating package: {e}")
        return False

def open_application():
    """Open the application in the default web browser"""
    print("Opening application in web browser...")

    # Use the text steganography page directly
    app_path = os.path.abspath("web_version/text_stego.html")

    # Convert to URL format
    if platform.system() == 'Windows':
        app_url = f"file:///{app_path.replace(os.sep, '/')}"
    else:
        app_url = f"file://{app_path}"

    # Open in browser
    try:
        webbrowser.open(app_url)
        print(f"Application opened at: {app_url}")
        return True
    except Exception as e:
        print(f"Error opening application: {e}")
        return False

def start_local_server():
    """Start a local server for the application"""
    print("Starting local server...")
    try:
        # Start the server in a new process
        if platform.system() == 'Windows':
            server_process = subprocess.Popen(["python", "start_local_server.py"],
                                             creationflags=subprocess.CREATE_NEW_CONSOLE)
        else:
            server_process = subprocess.Popen(["python", "start_local_server.py"])

        # Give the server time to start
        time.sleep(2)

        # Open the application through the local server
        webbrowser.open("http://localhost:8000/run_web_app.html")
        print("Application opened through local server at: http://localhost:8000/run_web_app.html")

        return server_process
    except Exception as e:
        print(f"Error starting local server: {e}")
        return None

def main():
    """Main function to update and run the application"""
    print("=== LESAVOT Multimodal Steganography ===")
    print("Updating and running application...")

    # Create/update the package
    if not create_package():
        print("Failed to create package. Exiting.")
        return 1

    # Determine how to run the application
    if len(sys.argv) > 1 and sys.argv[1] == "--server":
        # Run with local server
        server_process = start_local_server()
        if server_process:
            print("\nLocal server is running. Press Ctrl+C to stop.")
            try:
                # Keep the script running while the server is active
                server_process.wait()
            except KeyboardInterrupt:
                print("\nStopping server...")
                server_process.terminate()
                print("Server stopped.")
        else:
            print("Failed to start local server. Exiting.")
            return 1
    else:
        # Open directly in browser
        if not open_application():
            print("Failed to open application. Exiting.")
            return 1

    print("\nApplication update and launch complete!")
    return 0

if __name__ == "__main__":
    sys.exit(main())
