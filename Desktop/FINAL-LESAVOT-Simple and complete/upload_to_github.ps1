# Script to upload web application files to GitHub
# This script assumes git is installed and configured

# Configuration
$repoUrl = "https://github.com/Bechi-cyber/FINAL-LESAVOT.git"
$webAppFolder = "web_version"
$commitMessage = "Add web-based steganography application"

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

# Initialize git repository
Write-Host "Initializing git repository..."
Set-Location $tempDir
git init

# Add files to git
Write-Host "Adding files to git..."
git add .

# Commit changes
Write-Host "Committing changes..."
git commit -m $commitMessage

# Add remote repository
Write-Host "Adding remote repository..."
git remote add origin $repoUrl

# Push to GitHub
Write-Host "Pushing to GitHub..."
git push -u origin master --force

# Clean up
Write-Host "Cleaning up..."
Set-Location ..
Remove-Item -Recurse -Force $tempDir

Write-Host "Upload complete! Your web application is now available on GitHub."
Write-Host "Repository URL: $repoUrl"
