#!/bin/bash

# Test script to verify MCP integration for single-doc mode

# Test regular mode
echo "Testing regular mode..."
echo "{\"jsonrpc\":\"2.0\",\"id\":\"1\",\"method\":\"list_tools\",\"params\":{}}" | \
  MCP_SERVICE=true node dist/index.js --docs-dir ./docs

# Test single-doc mode
echo -e "\n\nTesting single-doc mode..."
echo "{\"jsonrpc\":\"2.0\",\"id\":\"1\",\"method\":\"list_tools\",\"params\":{}}" | \
  MCP_SERVICE=true node dist/index.js --single-doc --docs-dir ./docs

echo -e "\nTest completed!"