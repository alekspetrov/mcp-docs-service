#!/bin/bash

# Create the build directory if it doesn't exist
mkdir -p dist

# Run TypeScript compiler
echo "Compiling TypeScript..."
npx tsc

# Make the CLI executable
echo "Making the CLI executable..."
chmod +x dist/cli/bin.js

echo "Build completed successfully!"