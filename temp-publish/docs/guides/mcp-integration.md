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

When working with the MCP SDK, it's important to understand how responses are formatted. The MCP SDK automatically wraps tool responses in a `result` object, which can lead to double-wrapping if not handled correctly.

### Response Structure

The MCP response has the following structure:

```json
{
  "result": {
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
    }
  },
  "jsonrpc": "2.0",
  "id": 123456789
}
```

### Handling Responses in Your Client

When implementing an MCP client, you need to extract the actual result from the double-wrapped response:

```javascript
// Extract the actual result from the double-wrapped response
if (response.result && response.result.result) {
  const actualResult = response.result.result;
  console.log("Result:", JSON.stringify(actualResult, null, 2));
} else {
  console.log("Response:", JSON.stringify(response, null, 2));
}
```

## Server Implementation

When implementing an MCP server, ensure your tool handlers return responses in the correct format:

```typescript
// Tool handler example
{
  name: "example_tool",
  description: "Example tool description",
  schema: ToolSchemas.ExampleToolSchema,
  handler: async (args) => {
    try {
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
  }
}
```

## Testing Your Integration

You can test your MCP integration using a simple client script:

```javascript
import { spawn } from "child_process";
import path from "path";

// Start the MCP service
const mcpProcess = spawn("node", ["dist/index.js", "docs"]);

// Set up pipes for communication
mcpProcess.stdout.on("data", (data) => {
  try {
    const response = JSON.parse(data.toString());

    // Extract the actual result from the double-wrapped response
    if (response.result && response.result.result) {
      console.log("Result:", JSON.stringify(response.result.result, null, 2));
    } else {
      console.log("Response:", JSON.stringify(response, null, 2));
    }
  } catch (error) {
    console.log(`MCP stdout: ${data}`);
  }
});

// Send a request
const request = {
  jsonrpc: "2.0",
  method: "tools/call",
  params: {
    name: "read_document",
    arguments: {
      path: "docs/roadmap.md",
    },
  },
  id: Date.now(),
};

mcpProcess.stdin.write(JSON.stringify(request) + "\n");
```

## Common Issues and Solutions

1. **Double-wrapped responses**: The MCP SDK automatically wraps responses in a `result` object. Make sure your client extracts the actual result correctly.

2. **Content format**: The `content` field in the response must always be an array of objects with `type` and `text` properties.

3. **Error handling**: Use the `isError` flag to indicate errors, and include an error message in the `content` field.

4. **Transport**: The MCP SDK uses a stdio transport by default, not a TCP server. Make sure your client communicates with the service correctly.

5. **JSON parsing**: When passing JSON data as command-line arguments, make sure to parse it correctly in your client.

By following these guidelines, you can ensure that your MCP integration works correctly and efficiently.
