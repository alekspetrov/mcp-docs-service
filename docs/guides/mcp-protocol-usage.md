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
  params: {}
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
    name: "mcp_docs_manager_read_document",
    arguments: {
      path: "docs/example.md"
    }
  }
};
```

Note the structure of the `params` object:
- `name`: The full name of the tool to call (always starts with `mcp_docs_manager_`)
- `arguments`: An object containing the arguments for the tool

## Tool Naming Convention

All tools in the MCP Docs Manager service follow the naming convention `mcp_docs_manager_*`. For example:

- `mcp_docs_manager_read_document`
- `mcp_docs_manager_write_document`
- `mcp_docs_manager_edit_document`
- `mcp_docs_manager_list_documents`
- `mcp_docs_manager_search_documents`
- `mcp_docs_manager_generate_navigation`
- `mcp_docs_manager_check_documentation_health`

Always use the full tool name when calling a tool.

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
import WebSocket from 'ws';

// Connect to the MCP service
const socket = new WebSocket('ws://localhost:3000');

socket.on('open', () => {
  console.log('Connected to MCP service');
  
  // First, list available tools
  const listToolsRequest = {
    jsonrpc: "2.0",
    id: 1,
    method: "tools/list",
    params: {}
  };
  
  console.log('Sending tools/list request');
  socket.send(JSON.stringify(listToolsRequest));
});

socket.on('message', (data) => {
  const response = JSON.parse(data.toString());
  console.log('Received response:', JSON.stringify(response, null, 2));
  
  // If we got a successful tools/list response, call a tool
  if (response.id === 1 && response.result) {
    const callToolRequest = {
      jsonrpc: "2.0",
      id: 2,
      method: "tools/call",
      params: {
        name: "mcp_docs_manager_check_documentation_health",
        arguments: {
          basePath: "docs"
        }
      }
    };
    
    console.log('Sending tools/call request');
    socket.send(JSON.stringify(callToolRequest));
  }
});

socket.on('error', (error) => {
  console.error('WebSocket error:', error);
});

socket.on('close', () => {
  console.log('Connection closed');
});
```

## Common Mistakes to Avoid

1. **Using incorrect method names**: Always use `tools/list` and `tools/call`, not `listTools` or `callTool`.

2. **Using incorrect tool names**: Always use the full tool name with the `mcp_docs_manager_` prefix.

3. **Incorrect parameter structure**: Make sure to put the tool arguments in the `arguments` field within the `params` object.

4. **Missing required parameters**: Check the tool's input schema to ensure you're providing all required parameters.

5. **Incorrect response handling**: Remember that the response follows the JSON-RPC 2.0 specification, with the actual result in the `result` field.

By following these guidelines, you can ensure successful integration with the MCP Docs Manager service.