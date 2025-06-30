# LESAVOT Automatic Update and Run

This feature allows you to automatically update the LESAVOT Multimodal Steganography application package and run it in a web browser with a single command.

## How to Use

### Windows Users

1. Double-click on `update_and_run.bat`
2. The script will:
   - Create/update the package
   - Open the application in your default web browser

### macOS/Linux Users

1. Make the script executable (one-time setup):
   ```
   chmod +x update_and_run.sh
   ```

2. Run the script:
   ```
   ./update_and_run.sh
   ```

3. The script will:
   - Create/update the package
   - Open the application in your default web browser

### Advanced Usage (All Platforms)

You can also run the Python script directly:

```
python update_and_run.py
```

To run the application with a local server (useful for certain features):

```
python update_and_run.py --server
```

## What This Does

Every time you run this script:

1. It creates a new package with all your latest changes
2. It automatically opens the application in your default web browser
3. You can immediately see and test your changes

## Benefits

- Saves time by automating the update and run process
- Ensures you're always testing the latest version
- Makes development and testing more efficient
- Works on Windows, macOS, and Linux

## Troubleshooting

If you encounter any issues:

1. Make sure Python is installed and in your PATH
2. Check that all required files are present
3. Try running the Python script directly for more detailed error messages

For more help, refer to the main LESAVOT documentation.
