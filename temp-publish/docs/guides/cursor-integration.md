---
title: Cursor Integration Guide
description: Guide for integrating MCP Docs Service with Cursor
author: Claude
date: 2024-03-12T00:00:00.000Z
tags:
  - guide
  - cursor
  - integration
status: published
order: 3
---

# Cursor Integration Guide

This guide explains how to integrate the MCP Docs Service with Cursor to enable AI-powered documentation management.

## Prerequisites

- [Cursor](https://cursor.sh/) installed on your machine
- A project with documentation in markdown format

## Setting Up MCP Docs Service in Cursor

To integrate MCP Docs Service with Cursor, you need to configure it in your project's `.cursor/mcp.json` file.

1. Create a `.cursor` directory in your project root if it doesn't exist:

```bash
mkdir -p .cursor
```

2. Create or edit the `mcp.json` file in the `.cursor` directory:

```bash
touch .cursor/mcp.json
```

3. Add the following configuration to the `mcp.json` file:

```json
{
  "mcpServers": {
    "docs-manager": {
      "command": "npx",
      "args": ["-y", "mcp-docs-standalone"]
    }
  }
}
```

This configuration uses the standalone CommonJS entry point which is designed for maximum compatibility with npx. It works in any environment and automatically handles docs directory creation with a sample README.md file.

Alternatively, you can specify a docs directory:

```json
{
  "mcpServers": {
    "docs-manager": {
      "command": "npx",
      "args": ["-y", "mcp-docs-standalone", "./docs"]
    }
  }
}
```

If you prefer to use the standard entry point:

```json
{
  "mcpServers": {
    "docs-manager": {
      "command": "npx",
      "args": ["-y", "mcp-docs-service"]
    }
  }
}
```

For specialized use cases, you can try the other entry points:

```json
{
  "mcpServers": {
    "docs-manager": {
      "command": "npx",
      "args": ["-y", "mcp-docs-cursor", "./docs"]
    }
  }
}
```

The `mcp-docs-cursor` entry point is specifically designed for Cursor integration and handles argument parsing more robustly.

Alternatively, you can still use the flag-based format:

```json
{
  "mcpServers": {
    "docs-manager": {
      "command": "npx",
      "args": ["-y", "mcp-docs-service", "/path/to/your/docs"]
    }
  }
}
```

Or:

```json
{
  "mcpServers": {
    "docs-manager": {
      "command": "npx",
      "args": ["-y", "mcp-docs-service", "--docs-dir", "/path/to/your/docs"]
    }
  }
}
```

## Using with MCP Inspector

If you're using the MCP Inspector to test the service, you can use the special `mcp-docs-inspector` entry point which is designed to work better with the MCP Inspector:

```json
{
  "mcpServers": {
    "docs-manager": {
      "command": "npx",
      "args": ["-y", "mcp-docs-inspector", "/path/to/your/docs"]
    }
  }
}
```

This entry point handles the argument format used by the MCP Inspector more reliably.

## Using MCP Docs Service in Cursor

Once you've configured the MCP Docs Service, you can use it in Cursor by asking Claude to perform documentation-related tasks.

Here are some examples of what you can ask Claude to do:

- "Create a new documentation page for our API authentication"
- "Update the installation guide to include the new configuration options"
- "Find all documentation related to user authentication"
- "Generate a navigation structure for our documentation"
- "Check the health of our documentation and identify any issues"

Claude will use the MCP Docs Service to perform these tasks, making it easy to manage your documentation without leaving your IDE.

## Troubleshooting

If you encounter issues with the MCP Docs Service in Cursor, try the following:

1. **Check your configuration**: Make sure the path to your documentation directory is correct in the `mcp.json` file.

2. **Verify the docs directory exists**: The documentation directory must exist before you can use the MCP Docs Service.

3. **Check Cursor logs**: Cursor logs may contain information about any errors that occurred when trying to use the MCP Docs Service.

4. **Restart Cursor**: Sometimes, restarting Cursor can resolve issues with MCP services.

For more detailed troubleshooting, see the [Troubleshooting Guide](troubleshooting.md).
