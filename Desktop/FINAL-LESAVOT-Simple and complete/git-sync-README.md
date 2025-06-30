# LESAVOT Git Sync Automation

This folder contains scripts to automate Git pull and push operations for the LESAVOT project.

## Files Included

1. `git-sync.ps1` - PowerShell script that performs the Git operations
2. `git-sync.bat` - Batch file to easily run the PowerShell script
3. `setup-scheduled-sync.ps1` - PowerShell script to set up automated scheduled syncing
4. `setup-scheduled-sync.bat` - Batch file to easily set up the scheduled task

## How to Use

### Manual Synchronization

To manually synchronize your repository (pull and push changes):

1. Double-click on `git-sync.bat`
2. Enter a commit message when prompted (or leave blank for an automatic timestamp message)
3. The script will:
   - Pull the latest changes from the remote repository
   - Add all your local changes
   - Commit the changes with your message
   - Push the changes to the remote repository

### Automated Synchronization

To set up automated synchronization at regular intervals:

1. Double-click on `setup-scheduled-sync.bat`
2. Choose a synchronization frequency:
   - Hourly
   - Daily
   - Weekly
   - Custom (allows you to specify a custom schedule)
3. The script will create a Windows scheduled task that will run the git-sync script according to your chosen schedule

## Requirements

- Git must be installed and in your PATH
- PowerShell 3.0 or higher
- Administrator privileges (for setting up scheduled tasks)

## Troubleshooting

If you encounter issues:

1. Make sure Git is properly installed and configured
2. Check that you have the necessary permissions for the repository
3. Verify that your Git credentials are properly set up
4. For scheduled tasks, ensure you have administrator privileges

## Manual Git Commands

If you prefer to use Git commands directly, here are the equivalent commands:

```bash
# Pull latest changes
git pull

# Add all changes
git add .

# Commit changes
git commit -m "Your commit message"

# Push changes
git push
```

## Customization

You can modify the PowerShell scripts to customize the behavior:

- Change the commit message format
- Add specific files instead of all changes
- Configure different Git branches
- Add error handling for specific scenarios

For any questions or issues, please contact the repository maintainer.
