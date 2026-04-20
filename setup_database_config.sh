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

# Get JWT secret from user
echo ""
echo "Please enter your JWT secret (leave empty for random generation):"
read -s -p "JWT Secret: " jwt_secret
echo

# Generate random JWT secret if empty
if [ -z "$jwt_secret" ]; then
    jwt_secret=$(openssl rand -base64 32 2>/dev/null || date +%s | sha256sum | base64 | head -c 32)
    echo "Generated random JWT secret: $jwt_secret"
fi

# Ensure JWT secret is not empty
if [ -z "$jwt_secret" ]; then
    jwt_secret="sanctus-default-secret-change-me"
    echo "Using default JWT secret (PLEASE CHANGE THIS IN PRODUCTION)"
fi

# Write configuration file
cat > ~/.config/sanctus/database.conf << EOF
DATABASE_URL=$db_url
JWT_SECRET=$jwt_secret
EOF

echo ""
echo "Database configuration saved to ~/.config/sanctus/database.conf"
echo "Database URL: $db_url"
echo "JWT Secret: $jwt_secret"
echo ""
echo "You can now run Sanctus from the desktop icon without environment variables."
