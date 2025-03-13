---
title: Cursor Integration Guide
description: Guide for integrating the MCP Docs Service with Cursor
author: Claude
date: 2023-03-14T00:00:00.000Z
tags:
  - guide
  - integration
  - cursor
status: published
order: 3
---

# Cursor Integration Guide

This guide explains how to integrate the MCP Docs Service with Cursor to provide documentation management capabilities to your LLM workflows.

## Quick Start with npx

The easiest way to use the MCP Docs Service is with `npx`, which allows you to run the package without installing it globally:

```bash
npx mcp-docs-service /path/to/your/docs
```

This will start the MCP Docs Service and make it available for Cursor to connect to.

## Setting Up in Cursor

To integrate the MCP Docs Service with Cursor, you need to configure it in your Cursor workspace:

1. Create a `.cursor/mcp.json` file in your project root with the following content:

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

This configuration will use the default `docs` directory in your project root. If you want to specify a custom docs directory, use:

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

2. Make sure you have a `docs` directory in your project root, or specify a custom path as shown above.

3. Cursor will automatically connect to the MCP Docs Service when you open your project.

## Available Tools

The MCP Docs Service provides the following tools that you can use in Cursor:

```json
{
  "docs-manager": {
    "command": "npx mcp-docs-service docs",
    "tools": [
      {
        "name": "read_document",
        "description": "Read a markdown document and extract its content and metadata"
      },
      {
        "name": "list_documents",
        "description": "List all markdown documents in a directory"
      },
      {
        "name": "get_structure",
        "description": "Get the structure of the documentation directory"
      },
      {
        "name": "get_navigation",
        "description": "Get the navigation structure for the documentation"
      },
      {
        "name": "get_docs_knowledge_base",
        "description": "Create a comprehensive knowledge base of documentation for LLM context"
      },
      {
        "name": "write_document",
        "description": "Write content to a markdown document with frontmatter"
      },
      {
        "name": "edit_document",
        "description": "Apply edits to a markdown document while preserving frontmatter"
      },
      {
        "name": "delete_document",
        "description": "Delete a markdown document"
      },
      {
        "name": "search_documents",
        "description": "Search for markdown documents matching criteria"
      },
      {
        "name": "check_documentation_health",
        "description": "Check the health of documentation and identify issues"
      }
    ]
  }
}
```
