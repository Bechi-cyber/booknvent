#!/usr/bin/env python3
"""
Script to create a complete package of the LESAVOT Multimodal Steganography web application
"""

import os
import shutil
import zipfile

def create_full_package():
    """Create a ZIP file with all the necessary files"""
    # Configuration
    zip_file_name = "LESAVOT_Multimodal_Steganography.zip"
    files_to_include = [
        "index.html",
        "run_web_app.html",
        "open_app.html",
        "open_lesavot_app.bat",
        "open_lesavot_app.sh",
        "update_and_run.py",
        "update_and_run.bat",
        "update_and_run.sh",
        "UPDATE_README.md",
        "start_local_server.py",
        "start_application.bat",
        "start_application.sh",
        "LESAVOT_WEB_README.md",
        "web_version"
    ]

    print(f"Creating package: {zip_file_name}")

    # Create ZIP file
    with zipfile.ZipFile(zip_file_name, 'w', zipfile.ZIP_DEFLATED) as zipf:
        # Add individual files
        for item in files_to_include:
            if os.path.isfile(item):
                print(f"Adding file: {item}")
                zipf.write(item)
            elif os.path.isdir(item):
                print(f"Adding directory: {item}")
                # Add all files in the directory
                for root, _, files in os.walk(item):
                    for file in files:
                        file_path = os.path.join(root, file)
                        print(f"  - {file_path}")
                        zipf.write(file_path)

    print(f"\nPackage created successfully: {zip_file_name}")
    print(f"Size: {os.path.getsize(zip_file_name) / 1024:.2f} KB")
    print("\nThe package contains everything needed to run the application locally.")
    print("Users can simply extract the ZIP file and run one of the starter scripts.")

if __name__ == "__main__":
    create_full_package()
