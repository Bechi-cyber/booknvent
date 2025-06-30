#!/usr/bin/env python3
"""
Script to create a ZIP file of the web application
"""

import os
import shutil
import zipfile

def create_web_app_zip():
    """Create a ZIP file of the web application"""
    # Configuration
    web_app_folder = "web_version"
    zip_file_name = "multimodal_steganography_web_app.zip"
    temp_dir = "temp_web_app"
    
    # Check if the web app folder exists
    if not os.path.exists(web_app_folder):
        print(f"Error: Web application folder not found: {web_app_folder}")
        return False
    
    # Create a temporary directory for the web app
    if os.path.exists(temp_dir):
        shutil.rmtree(temp_dir)
    os.makedirs(temp_dir)
    
    # Copy web app files to the temporary directory
    print("Copying web application files...")
    for item in os.listdir(web_app_folder):
        src = os.path.join(web_app_folder, item)
        dst = os.path.join(temp_dir, item)
        if os.path.isfile(src):
            shutil.copy2(src, dst)
        else:
            shutil.copytree(src, dst)
    
    # Copy the launcher file
    if os.path.exists("run_web_app.html"):
        shutil.copy2("run_web_app.html", temp_dir)
    
    # Create ZIP file
    print(f"Creating ZIP file: {zip_file_name}")
    with zipfile.ZipFile(zip_file_name, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for root, _, files in os.walk(temp_dir):
            for file in files:
                file_path = os.path.join(root, file)
                arcname = os.path.relpath(file_path, temp_dir)
                zipf.write(file_path, arcname)
    
    # Clean up
    print("Cleaning up...")
    shutil.rmtree(temp_dir)
    
    print(f"ZIP file created successfully: {zip_file_name}")
    print("You can now upload this ZIP file to any web hosting service.")
    return True

if __name__ == "__main__":
    create_web_app_zip()
