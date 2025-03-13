#!/bin/bash

# Test script for npx wrapper
echo "Testing npx wrapper..."

# Create a temporary directory for the test
TEST_DIR=$(mktemp -d)
echo "Created temporary directory: $TEST_DIR"

# Create a test markdown file
echo "Creating test markdown file..."
cat > "$TEST_DIR/test.md" << EOF
---
title: Test Document
description: Test document for npx wrapper
---

# Test Document

This is a test document for the npx wrapper.
EOF

echo "Running npx mcp-docs-service-npx..."
npx -y mcp-docs-service-npx "$TEST_DIR" << EOF
{"jsonrpc":"2.0","id":1,"method":"listTools","params":{}}
EOF

echo "Test completed."
echo "You can check the npx debug log at ~/.mcp-docs-service/npx-debug.log"
echo "Temporary directory: $TEST_DIR"