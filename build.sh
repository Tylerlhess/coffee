#!/bin/bash

# Coffee Extension Build Script

echo "Building Coffee Chrome Extension..."

# Create build directory
mkdir -p build

# Copy all necessary files to build directory
cp manifest.json build/
cp content.js build/
cp background.js build/
cp popup.html build/
cp popup.js build/
cp README.md build/
cp package.json build/
cp test-extension.js build/

# Copy icon (using SVG as PNG since we don't have actual PNGs)
cp icon128.svg build/icon128.png
cp icon128.svg build/icon48.png
cp icon128.svg build/icon16.png

echo "Build complete! Extension files in build/ directory"
echo "To create .zip package, run: cd build && zip -r coffee-extension.zip *"