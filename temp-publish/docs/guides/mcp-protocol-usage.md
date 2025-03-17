---
title: MCP Protocol Usage
description: Guide for using the correct MCP protocol methods with the MCP Docs Manager
author: Claude
date: 2024-03-14
tags:
  - guide
  - integration
  - mcp
  - protocol
status: published
order: 3
---

# MCP Protocol Usage Guide

This guide explains how to use the correct MCP protocol methods with the MCP Docs Manager service.

## MCP Protocol Methods

The Model Context Protocol (MCP) defines specific methods for interacting with tools. When using the MCP Docs Manager, you need to use these methods correctly:

### 1. `tools/list` Method

Use this method to list all available tools in the MCP Docs Manager service:

```javascript
const listToolsRequest = {
  jsonrpc: "2.0",
  id: 1,
  method: "tools/list",
  params: {},
};
```

This will return a list of all available tools, their descriptions, and their input schemas.

### 2. `tools/call` Method

Use this method to call a specific tool in the MCP Docs Manager service:

```javascript
const callToolRequest = {
  jsonrpc: "2.0",
  id: 2,
  method: "tools/call",
  params: {
    name: "read_document",
    arguments: {
      path: "docs/example.md",
    },
  },
};
```

Note the structure of the `params` object:

- `name`: The name of the tool to call
- `arguments`: An object containing the arguments for the tool

## Tool Naming Convention

The MCP Docs Manager service provides the following tools:

### Basic Document Operations

- `read_document`: Read a markdown document
- `write_document`: Create or update a markdown document
- `edit_document`: Make line-based edits to a document
- `list_documents`: List all markdown documents
- `search_documents`: Search for documents by content or metadata

### Navigation and Structure

- `generate_documentation_navigation`: Generate navigation structure
- `check_documentation_health`: Check documentation health and quality

### Enhanced Structure Management

- `create_documentation_folder`: Create new documentation folders
- `move_document`: Move documents between locations
- `rename_document`: Rename documents while preserving references
- `update_documentation_navigation_order`: Change document order in navigation
- `create_documentation_section`: Create new navigation sections

### Documentation Validation

- `validate_documentation_links`: Check for broken internal links
- `validate_documentation_metadata`: Ensure documents have required metadata

Always use the correct tool name when calling a tool.

## Response Format

Responses from the MCP Docs Manager service follow the JSON-RPC 2.0 specification:

```javascript
{
  "result": {
    "content": [
      {
        "type": "text",
        "text": "Operation message"
      }
    ],
    "metadata": {
      // Tool-specific metadata
    }
  },
  "jsonrpc": "2.0",
  "id": 1
}
```

The `result` object contains:

- `content`: An array of content objects, each with a `type` and `text`
- `metadata`: Tool-specific metadata (optional)
- `isError`: A boolean indicating whether an error occurred (optional)

## Example: Complete Interaction

Here's a complete example of interacting with the MCP Docs Manager service:

```javascript
import WebSocket from "ws";

// Connect to the MCP service
const socket = new WebSocket("ws://localhost:3000");

socket.on("open", () => {
  console.log("Connected to MCP service");

  // First, list available tools
  const listToolsRequest = {
    jsonrpc: "2.0",
    id: 1,
    method: "tools/list",
    params: {},
  };

  console.log("Sending tools/list request");
  socket.send(JSON.stringify(listToolsRequest));
});

socket.on("message", (data) => {
  const response = JSON.parse(data.toString());
  console.log("Received response:", JSON.stringify(response, null, 2));

  // If we got a successful tools/list response, call a tool
  if (response.id === 1 && response.result) {
    const callToolRequest = {
      jsonrpc: "2.0",
      id: 2,
      method: "tools/call",
      params: {
        name: "check_documentation_health",
        arguments: {
          basePath: "docs",
        },
      },
    };

    console.log("Sending tools/call request");
    socket.send(JSON.stringify(callToolRequest));
  }
});

socket.on("error", (error) => {
  console.error("WebSocket error:", error);
});

socket.on("close", () => {
  console.log("Connection closed");
});
```

## Common Mistakes to Avoid

1. **Using incorrect method names**: Always use `tools/list` and `tools/call`, not `listTools` or `callTool`.

2. **Using incorrect tool names**: Make sure to use the exact tool name as returned by the `tools/list` method.

3. **Incorrect parameter structure**: Make sure to put the tool arguments in the `arguments` field within the `params` object.

4. **Missing required parameters**: Check the tool's input schema to ensure you're providing all required parameters.

5. **Incorrect response handling**: Remember that the response follows the JSON-RPC 2.0 specification, with the actual result in the `result` field.

By following these guidelines, you can ensure successful integration with the MCP Docs Manager service.
