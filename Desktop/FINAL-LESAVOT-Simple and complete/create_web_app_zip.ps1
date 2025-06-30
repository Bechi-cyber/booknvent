# Script to create a ZIP file of the web application

# Configuration
$webAppFolder = "web_version"
$zipFileName = "multimodal_steganography_web_app.zip"

# Check if the web app folder exists
if (-not (Test-Path $webAppFolder)) {
    Write-Host "Error: Web application folder not found: $webAppFolder"
    exit 1
}

# Create a temporary directory for the web app
$tempDir = "temp_web_app"
if (Test-Path $tempDir) {
    Remove-Item -Recurse -Force $tempDir
}
New-Item -ItemType Directory -Path $tempDir | Out-Null

# Copy web app files to the temporary directory
Write-Host "Copying web application files..."
Copy-Item -Path "$webAppFolder\*" -Destination $tempDir -Recurse
Copy-Item -Path "run_web_app.html" -Destination $tempDir

# Create ZIP file
Write-Host "Creating ZIP file: $zipFileName"
Compress-Archive -Path "$tempDir\*" -DestinationPath $zipFileName -Force

# Clean up
Write-Host "Cleaning up..."
Remove-Item -Recurse -Force $tempDir

Write-Host "ZIP file created successfully: $zipFileName"
Write-Host "You can now upload this ZIP file to any web hosting service."
