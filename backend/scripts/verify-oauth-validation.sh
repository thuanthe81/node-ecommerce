#!/bin/bash

# Script to verify OAuth validation prevents application startup
# This script temporarily removes OAuth credentials and attempts to start the app

echo "OAuth Configuration Validation Test"
echo "===================================="
echo ""

# Backup current .env
echo "1. Backing up current .env file..."
cp backend/.env backend/.env.backup

# Remove OAuth credentials
echo "2. Removing OAuth credentials from .env..."
sed -i.tmp 's/^GOOGLE_CLIENT_ID=.*/GOOGLE_CLIENT_ID=/' backend/.env
sed -i.tmp 's/^GOOGLE_CLIENT_SECRET=.*/GOOGLE_CLIENT_SECRET=/' backend/.env
sed -i.tmp 's/^GOOGLE_CALLBACK_URL=.*/GOOGLE_CALLBACK_URL=/' backend/.env
sed -i.tmp 's/^FACEBOOK_APP_ID=.*/FACEBOOK_APP_ID=/' backend/.env
sed -i.tmp 's/^FACEBOOK_APP_SECRET=.*/FACEBOOK_APP_SECRET=/' backend/.env
sed -i.tmp 's/^FACEBOOK_CALLBACK_URL=.*/FACEBOOK_CALLBACK_URL=/' backend/.env
rm backend/.env.tmp

echo "3. Attempting to start application (should fail)..."
echo ""
cd backend && npm run start:dev &
APP_PID=$!

# Wait a few seconds for startup
sleep 5

# Check if process is still running
if ps -p $APP_PID > /dev/null; then
    echo "❌ FAIL: Application started despite missing credentials"
    kill $APP_PID
else
    echo "✅ PASS: Application correctly prevented startup"
fi

# Restore .env
echo ""
echo "4. Restoring original .env file..."
mv backend/.env.backup backend/.env

echo ""
echo "Test complete!"
