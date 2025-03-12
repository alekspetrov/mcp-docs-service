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
      }
    ]
  }
}
```

2. Make sure you have a `docs` directory in your project root (or adjust the path in the command accordingly).

3. Restart Cursor to load the new MCP configuration.

## Using the MCP Docs Service in Cursor

Once configured, you can use the MCP Docs Service in Cursor by calling the tools through the MCP interface:

```typescript
// Example: Reading a document
const result = await mcp.callTool("docs-manager", "read_document", {
  path: "docs/getting-started.md",
});

// Example: Generating a knowledge base
const knowledgeBase = await mcp.callTool(
  "docs-manager",
  "get_docs_knowledge_base",
  {
    basePath: "docs",
    includeSummaries: true,
  }
);
```

## Troubleshooting

If you encounter issues with the integration:

1. **Check the command path**: Make sure the path to your documentation directory exists.

2. **Verify npx availability**: Ensure that npx is available in your environment.

3. **Check for errors**: Look for error messages in the Cursor console or terminal where you're running the MCP service.

4. **Response format issues**: If you encounter response format issues, refer to the [MCP Integration Guide](mcp-integration.md) for details on handling responses correctly.

## Advanced Configuration

For more advanced configuration options, you can:

1. **Install globally**: Install the package globally with `npm install -g mcp-docs-service` and use it without npx.

2. **Custom configuration**: Create a custom configuration file and pass it to the service.

3. **Multiple documentation directories**: Specify multiple documentation directories as additional arguments.

```bash
npx mcp-docs-service /path/to/docs1 /path/to/docs2 /path/to/docs3
```

## Next Steps

- Explore the [API Overview](../api/overview.md) for more details on available tools.
- Check out the [Examples](../examples/) directory for code examples.
- Read the [MCP Integration Guide](mcp-integration.md) for more details on the MCP protocol integration.
