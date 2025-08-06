#!/bin/bash

# This script fixes the GitHub compatibility issue with [...nextauth] folder
# Run this script before committing to GitHub

echo "Fixing GitHub compatibility..."

# Check if the problematic folder exists
if [ -d "src/app/api/auth/[...nextauth]" ]; then
    echo "Found [...nextauth] folder, renaming for GitHub compatibility..."
    mv "src/app/api/auth/[...nextauth]" "src/app/api/auth/nextauth-route"
    echo "Renamed to: src/app/api/auth/nextauth-route"
    echo "✅ GitHub compatibility fix applied!"
else
    echo "⚠️  [...nextauth] folder not found. Already fixed or doesn't exist."
fi

echo ""
echo "Before running your app locally, run: ./local-fix.sh"