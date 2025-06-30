# Setup Scheduled Task for Git Sync
# This script creates a scheduled task to run the git-sync.ps1 script at regular intervals

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

# Get the current directory
$currentDir = Get-Location
$scriptPath = Join-Path -Path $currentDir -ChildPath "git-sync.ps1"

# Check if the script exists
if (-not (Test-Path $scriptPath)) {
    Write-ColoredOutput "Error: git-sync.ps1 not found in the current directory." "Red"
    exit 1
}

# Ask for schedule frequency
Write-ColoredOutput "How often would you like to sync the repository?" "Yellow"
Write-ColoredOutput "1. Hourly" "Cyan"
Write-ColoredOutput "2. Daily" "Cyan"
Write-ColoredOutput "3. Weekly" "Cyan"
Write-ColoredOutput "4. Custom" "Cyan"
$frequency = Read-Host "Enter your choice (1-4)"

# Set up trigger based on frequency
switch ($frequency) {
    "1" {
        $trigger = New-ScheduledTaskTrigger -Once -At (Get-Date) -RepetitionInterval (New-TimeSpan -Hours 1)
        $triggerDesc = "Hourly"
    }
    "2" {
        $trigger = New-ScheduledTaskTrigger -Daily -At "12:00 PM"
        $triggerDesc = "Daily at 12:00 PM"
    }
    "3" {
        $trigger = New-ScheduledTaskTrigger -Weekly -DaysOfWeek Monday -At "9:00 AM"
        $triggerDesc = "Weekly on Monday at 9:00 AM"
    }
    "4" {
        Write-ColoredOutput "Enter a custom schedule using SCHTASKS syntax (e.g., /SC DAILY /ST 12:00)" "Yellow"
        $customSchedule = Read-Host
        $triggerDesc = "Custom: $customSchedule"
        # For custom schedules, we'll use SCHTASKS command directly later
    }
    default {
        Write-ColoredOutput "Invalid choice. Using daily schedule." "Red"
        $trigger = New-ScheduledTaskTrigger -Daily -At "12:00 PM"
        $triggerDesc = "Daily at 12:00 PM"
    }
}

# Create the action to run the PowerShell script
$action = New-ScheduledTaskAction -Execute "PowerShell.exe" -Argument "-ExecutionPolicy Bypass -File `"$scriptPath`""

# Task name
$taskName = "LESAVOT_Git_Sync"

# Try to create the scheduled task
try {
    if ($frequency -eq "4") {
        # Use SCHTASKS for custom schedule
        $command = "SCHTASKS /CREATE /TN $taskName /TR `"PowerShell.exe -ExecutionPolicy Bypass -File '$scriptPath'`" $customSchedule /F"
        Invoke-Expression $command
    } else {
        # Use PowerShell's scheduled task cmdlets
        Register-ScheduledTask -TaskName $taskName -Trigger $trigger -Action $action -Description "Automatically sync LESAVOT Git repository" -Force
    }
    
    Write-ColoredOutput "Scheduled task '$taskName' created successfully with $triggerDesc schedule." "Green"
} catch {
    Write-ColoredOutput "Error creating scheduled task: $_" "Red"
    exit 1
}

Write-ColoredOutput "`nThe repository will be automatically synchronized according to the schedule." "Yellow"
Write-ColoredOutput "You can also run the sync manually by executing git-sync.bat" "Yellow"

# Keep the window open
Write-ColoredOutput "`nPress any key to exit..." "Gray"
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
