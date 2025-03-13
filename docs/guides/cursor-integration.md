---
title: Cursor Integration Guide
description: How to integrate the MCP Documentation Service with Cursor
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

This guide explains how to integrate the MCP Documentation Service with Cursor IDE to enable AI-assisted documentation management.

## Setup

1. Install the MCP Documentation Service globally (optional):

   ```bash
   npm install -g mcp-docs-service
   ```

   You can skip this step if you prefer to use `npx` directly.

2. Create a `.cursor` directory in your project root if it doesn't exist:

   ```bash
   mkdir -p .cursor
   ```

3. Create or edit the `.cursor/mcp.json` file with the following configuration:

   ```json
   {
     "mcpServers": {
       "docs-manager": {
         "command": "npx",
         "args": ["-y", "mcp-docs-service", "./docs"]
       }
     }
   }
   ```

   This configuration specifies the `docs` directory in your project root. The docs directory path is provided directly as an argument, similar to how the filesystem MCP server works.

## Custom Docs Directory

To specify a custom docs directory, simply change the path in the args array:

```json
{
  "mcpServers": {
    "docs-manager": {
      "command": "npx",
      "args": ["-y", "mcp-docs-service", "./my-custom-docs"]
    }
  }
}
```

## Auto-Create Docs Directory

To automatically create the docs directory if it doesn't exist:

```json
{
  "mcpServers": {
    "docs-manager": {
      "command": "npx",
      "args": ["-y", "mcp-docs-service", "./docs", "--create-dir"]
    }
  }
}
```

You can also combine a custom path with the create-dir option:

```json
{
  "mcpServers": {
    "docs-manager": {
      "command": "npx",
      "args": ["-y", "mcp-docs-service", "./my-custom-docs", "--create-dir"]
    }
  }
}
```

## Usage with Claude in Cursor

Once configured, you can use the MCP Documentation Service with Claude in Cursor:

1. Open Cursor and start a conversation with Claude
2. Use the `@docs-manager` prefix to access the documentation tools:

```
@docs-manager read_document path=README.md
```

```
@docs-manager list_documents
```

```
@docs-manager edit_document path=README.md edits=[{"oldText":"# Documentation", "newText":"# Project Documentation"}]
```

## Available Tools

See the [Basic Usage Examples](../examples/basic-usage.md) for a complete list of available tools and how to use them.

## Troubleshooting

If you encounter issues with the MCP Docs Service in Cursor, try the following:

1. **Check your configuration**: Make sure the path to your documentation directory is correct in the `mcp.json` file.

2. **Verify the docs directory exists**: The documentation directory must exist before you can use the MCP Docs Service.

3. **Check Cursor logs**: Cursor logs may contain information about any errors that occurred when trying to use the MCP Docs Service.

4. **Restart Cursor**: Sometimes, restarting Cursor can resolve issues with MCP services.

For more detailed troubleshooting, see the [Troubleshooting Guide](troubleshooting.md).
