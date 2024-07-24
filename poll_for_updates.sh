#!/bin/bash

REPO_DIR="/home/pi/yourproject"
cd $REPO_DIR

# Fetch the latest changes from GitHub
git fetch origin

# Check if there are any new commits
LOCAL=$(git rev-parse @)
REMOTE=$(git rev-parse @{u})

if [ $LOCAL != $REMOTE ]; then
    echo "New updates found. Pulling changes..."
    git pull origin main

    # Navigate to the frontend and rebuild the project
    cd frontend
    npm install
    npm run build

    # Restart the serve service
    sudo systemctl restart serve-react
else
    echo "No updates found."
fi
