#!/bin/bash

# Run the build script
echo "Building the project..."
./scripts/build.sh

# Publish to npm
echo "Publishing to npm..."
npm publish --access public

echo "Package published successfully!"