#!/bin/bash

# Sanctus Database Configuration Setup Script
# This script sets up the database configuration file for production use

echo "Setting up Sanctus database configuration..."

# Create config directory
mkdir -p ~/.config/sanctus

# Check if config already exists
if [ -f ~/.config/sanctus/database.conf ]; then
    echo "Database configuration already exists at ~/.config/sanctus/database.conf"
    echo "Current configuration:"
    cat ~/.config/sanctus/database.conf
    echo ""
    read -p "Do you want to overwrite it? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Keeping existing configuration."
        exit 0
    fi
fi

# Get database configuration from user
echo "Please enter your database configuration:"
echo "Default: postgresql://postgres:postgres@localhost:5432/sanctus"
read -p "Database URL: " db_url

# Use default if empty
if [ -z "$db_url" ]; then
    db_url="postgresql://postgres:postgres@localhost:5432/sanctus"
fi

# Write configuration file
echo "$db_url" > ~/.config/sanctus/database.conf

echo "Database configuration saved to ~/.config/sanctus/database.conf"
echo "Configuration: $db_url"
echo ""
echo "You can now run Sanctus from the desktop icon without environment variables."
