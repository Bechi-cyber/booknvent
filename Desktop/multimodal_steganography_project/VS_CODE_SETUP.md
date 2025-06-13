# Visual Studio Code Setup for Multimodal Steganography Project

This document provides instructions for setting up and using Visual Studio Code (VS Code) with this project.

## Opening the Project

1. Double-click on the `multimodal-steganography.code-workspace` file to open the project in VS Code
2. Alternatively, open VS Code, select "File > Open Folder" and navigate to the project directory

## Running the Application

There are several ways to run the application:

### Method 1: Using the Run Configuration

1. Open VS Code
2. Press F5 or click the "Run and Debug" icon in the sidebar
3. Select "Python: Flask" from the dropdown menu
4. The application will start and open in debug mode

### Method 2: Using the Terminal

1. Open VS Code
2. Press Ctrl+` to open the integrated terminal
3. The virtual environment should activate automatically
4. Run `python app.py` to start the application

## Debugging

1. Set breakpoints by clicking in the gutter (left margin) next to line numbers
2. Run the application using the "Python: Flask" configuration
3. The application will pause at breakpoints, allowing you to inspect variables

## Useful VS Code Shortcuts

- Ctrl+P: Quick open files
- Ctrl+Shift+P: Command palette
- F5: Start debugging
- Shift+F5: Stop debugging
- F9: Toggle breakpoint
- Ctrl+Space: Trigger suggestions
- Alt+Shift+F: Format document
- Ctrl+`: Toggle terminal

## Extensions Installed

- Python (Microsoft)
- Pylance (Microsoft)
- Python Indent

## Additional Recommended Extensions

- GitLens
- Python Test Explorer
- Python Docstring Generator
- Better Comments
- indent-rainbow
