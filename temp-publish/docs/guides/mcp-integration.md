---
title: MCP Integration Guide
description: Guide for integrating with the Model Context Protocol (MCP)
author: Claude
date: "2023-03-14T00:00:00.000Z"
tags:
  - guide
  - integration
  - mcp
status: published
order: 2
---

# MCP Integration Guide

This guide explains how to integrate the MCP Docs Manager with the Model Context Protocol (MCP) client.

## Understanding the MCP Response Format

When working with the MCP SDK, it's important to understand how responses are formatted. The MCP SDK follows the JSON-RPC 2.0 specification for request and response formatting.

### Response Structure

The MCP response has the following structure:

```json
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
  "id": 123456789
}
```

### Handling Responses in Your Client

When implementing an MCP client, you can extract the result directly from the response:

```javascript
// Extract the result from the response
if (response.result) {
  console.log("Result:", JSON.stringify(response.result, null, 2));
} else if (response.error) {
  console.error("Error:", JSON.stringify(response.error, null, 2));
} else {
  console.log("Response:", JSON.stringify(response, null, 2));
}
```

## Server Implementation

When implementing an MCP server, ensure your tool handlers return responses in the correct format:

```typescript
// Tool handler example in the CallToolRequestSchema handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    const { name, arguments: args } = request.params;
    
    // Validate arguments using zod schema
    const parsed = ToolSchema.safeParse(args);
    if (!parsed.success) {
      throw new Error(`Invalid arguments: ${parsed.error}`);
    }
    
    // Tool implementation
    
    return {
      content: [
        {
          type: "text",
          text: "Operation completed successfully"
        }
      ],
      metadata: {
        // Tool-specific metadata
      }
    };
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `Error: ${error.message}`
        }
      ],
      isError: true
    };
  }
});
```

## Testing Your Integration

You can test your MCP integration using a simple client script with WebSocket:

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
        name: "mcp_docs_manager_read_document",
        arguments: {
          path: "docs/roadmap.md"
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

Alternatively, you can use stdio for communication:

```javascript
import { spawn } from 'child_process';
import readline from 'readline';

// Start the MCP service
const service = spawn('node', ['dist/index.js', '--docs-dir', 'docs']);

// Create readline interface for reading service output
const rl = readline.createInterface({
  input: service.stdout,
  terminal: false
});

// Handle service output
rl.on('line', (line) => {
  try {
    const response = JSON.parse(line);
    console.log('Received response:', JSON.stringify(response, null, 2));
    
    // If we got a successful response, process it
    if (response.result) {
      console.log('Operation successful');
    } else if (response.error) {
      console.error('Error:', response.error);
    }
  } catch (error) {
    console.log('Service message:', line);
  }
});

// Send a request
const request = {
  jsonrpc: "2.0",
  id: 1,
  method: "tools/call",
  params: {
    name: "mcp_docs_manager_read_document",
    arguments: {
      path: "docs/roadmap.md"
    }
  }
};

service.stdin.write(JSON.stringify(request) + '\n');
```

## Common Issues and Solutions

1. **Method names**: The MCP protocol uses specific method names: `tools/list` for listing available tools and `tools/call` for calling a specific tool. Make sure to use these exact method names.

2. **Tool names**: Tool names follow the format `mcp_docs_manager_*` (e.g., `mcp_docs_manager_read_document`). Make sure to use the correct tool names as returned by the `tools/list` method.

3. **Parameter structure**: When calling a tool, the `arguments` field must be inside the `params` object. For example: `params: { name: "tool_name", arguments: { /* tool arguments */ } }`.

4. **Content format**: The `content` field in the response is always an array of objects with `type` and `text` properties.

5. **Error handling**: Check for the `isError` flag in the response to identify errors, and look for error messages in the `content` field.

6. **Transport options**: The MCP SDK supports both stdio and WebSocket transports. Choose the appropriate transport for your use case.

7. **JSON-RPC format**: All requests and responses follow the JSON-RPC 2.0 specification, including the `jsonrpc`, `id`, `method`, and `params`/`result`/`error` fields.

By following these guidelines, you can ensure that your MCP integration works correctly and efficiently.
