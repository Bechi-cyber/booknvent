# Git Sync Script for LESAVOT Project
# This script automates pulling and pushing changes to the repository

# Function to display colored messages
function Write-ColoredOutput {
    param (
        [Parameter(Mandatory=$true)]
        [string]$Message,
        
        [Parameter(Mandatory=$false)]
        [string]$ForegroundColor = "White"
    )
    
    Write-Host $Message -ForegroundColor $ForegroundColor
}

# Function to check if Git is installed
function Check-GitInstalled {
    try {
        $gitVersion = git --version
        Write-ColoredOutput "Git is installed: $gitVersion" "Green"
        return $true
    } catch {
        Write-ColoredOutput "Git is not installed or not in PATH. Please install Git and try again." "Red"
        return $false
    }
}

# Function to check if the current directory is a Git repository
function Check-GitRepository {
    if (Test-Path ".git") {
        Write-ColoredOutput "Current directory is a Git repository." "Green"
        return $true
    } else {
        Write-ColoredOutput "Current directory is not a Git repository." "Red"
        return $false
    }
}

# Function to pull changes from the remote repository
function Pull-Changes {
    Write-ColoredOutput "Pulling latest changes from remote repository..." "Cyan"
    try {
        $pullOutput = git pull
        Write-ColoredOutput "Pull completed: $pullOutput" "Green"
        return $true
    } catch {
        Write-ColoredOutput "Error pulling changes: $_" "Red"
        return $false
    }
}

# Function to add all changes to the staging area
function Add-Changes {
    Write-ColoredOutput "Adding all changes to staging area..." "Cyan"
    try {
        git add .
        Write-ColoredOutput "All changes added to staging area." "Green"
        return $true
    } catch {
        Write-ColoredOutput "Error adding changes: $_" "Red"
        return $false
    }
}

# Function to commit changes
function Commit-Changes {
    param (
        [Parameter(Mandatory=$false)]
        [string]$Message = ""
    )
    
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    
    if ([string]::IsNullOrEmpty($Message)) {
        $commitMessage = "Automated commit at $timestamp"
    } else {
        $commitMessage = "$Message (at $timestamp)"
    }
    
    Write-ColoredOutput "Committing changes with message: '$commitMessage'..." "Cyan"
    
    try {
        git commit -m $commitMessage
        Write-ColoredOutput "Changes committed successfully." "Green"
        return $true
    } catch {
        Write-ColoredOutput "Error committing changes: $_" "Red"
        return $false
    }
}

# Function to push changes to the remote repository
function Push-Changes {
    Write-ColoredOutput "Pushing changes to remote repository..." "Cyan"
    try {
        $pushOutput = git push
        Write-ColoredOutput "Push completed: $pushOutput" "Green"
        return $true
    } catch {
        Write-ColoredOutput "Error pushing changes: $_" "Red"
        return $false
    }
}

# Main script execution
Write-ColoredOutput "=== LESAVOT Git Sync Script ===" "Yellow"
Write-ColoredOutput "Starting synchronization process..." "Yellow"

# Check if Git is installed
if (-not (Check-GitInstalled)) {
    exit 1
}

# Check if current directory is a Git repository
if (-not (Check-GitRepository)) {
    Write-ColoredOutput "Would you like to initialize a Git repository in this directory? (y/n)" "Yellow"
    $initRepo = Read-Host
    
    if ($initRepo -eq "y") {
        git init
        Write-ColoredOutput "Git repository initialized." "Green"
    } else {
        Write-ColoredOutput "Exiting script." "Red"
        exit 1
    }
}

# Ask for commit message
Write-ColoredOutput "Enter commit message (leave blank for default message):" "Yellow"
$commitMessage = Read-Host

# Pull changes
$pullSuccess = Pull-Changes

# Add changes
$addSuccess = Add-Changes

# Commit changes
if ($addSuccess) {
    $commitSuccess = Commit-Changes -Message $commitMessage
} else {
    $commitSuccess = $false
}

# Push changes
if ($commitSuccess) {
    $pushSuccess = Push-Changes
} else {
    $pushSuccess = $false
}

# Summary
Write-ColoredOutput "`n=== Synchronization Summary ===" "Yellow"
Write-ColoredOutput "Pull: $(if ($pullSuccess) { 'Success' } else { 'Failed' })" $(if ($pullSuccess) { 'Green' } else { 'Red' })
Write-ColoredOutput "Add: $(if ($addSuccess) { 'Success' } else { 'Failed' })" $(if ($addSuccess) { 'Green' } else { 'Red' })
Write-ColoredOutput "Commit: $(if ($commitSuccess) { 'Success' } else { 'Failed' })" $(if ($commitSuccess) { 'Green' } else { 'Red' })
Write-ColoredOutput "Push: $(if ($pushSuccess) { 'Success' } else { 'Failed' })" $(if ($pushSuccess) { 'Green' } else { 'Red' })

Write-ColoredOutput "`nGit synchronization process completed." "Yellow"

# Keep the window open
Write-ColoredOutput "`nPress any key to exit..." "Gray"
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
