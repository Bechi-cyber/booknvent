#!/bin/bash
echo "Opening LESAVOT Multimodal Steganography Application..."

# Determine the OS and open the file accordingly
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    open open_app.html
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    xdg-open open_app.html
else
    # Other OS
    echo "Please open open_app.html manually in your web browser."
fi
