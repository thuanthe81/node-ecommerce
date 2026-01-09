#!/bin/bash

# Copy static assets to standalone build
echo "📁 Copying static assets to standalone build..."

# Create the static directory in standalone if it doesn't exist
mkdir -p .next/standalone/.next/static

# Copy static assets
cp -r .next/static/* .next/standalone/.next/static/

# Copy public directory
mkdir -p .next/standalone/public
cp -r public/* .next/standalone/public/

echo "✅ Static assets copied successfully!"
echo "📊 Static assets size:"
du -sh .next/standalone/.next/static
echo "📊 Public assets size:"
du -sh .next/standalone/public