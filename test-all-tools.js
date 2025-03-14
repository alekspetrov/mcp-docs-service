/**
 * Comprehensive test script for MCP Docs Service
 *
 * This script tests all available tools in the MCP docs service.
 */

import { spawn } from "child_process";
import readline from "readline";

// Start the service
console.log("Starting MCP Docs Service...");
const service = spawn("node", [
  "dist/index.js",
  "--docs-dir",
  "test-docs",
  "--create-dir",
]);

// Create readline interface for reading service output
const rl = readline.createInterface({
  input: service.stdout,
  terminal: false,
});

// Handle service output
rl.on("line", (line) => {
  console.log("Service message:", line);
});

// Handle service errors
service.stderr.on("data", (data) => {
  console.error("Service error:", data.toString());
});

// Wait for service to start
setTimeout(() => {
  console.log("Service started, beginning tests...");
  runTests();
}, 1000);

// Test sequence
async function runTests() {
  try {
    // Step 1: List all tools
    const tools = await sendRequest({
      jsonrpc: "2.0",
      id: 1,
      method: "tools/list",
      params: {},
    });

    console.log(`Found ${tools.result.tools.length} tools`);

    // Step 2: Write a test document
    await sendRequest({
      jsonrpc: "2.0",
      id: 2,
      method: "tools/call",
      params: {
        name: "mcp_docs_manager_write_document",
        arguments: {
          path: "test.md",
          content: `---
title: Test Document
description: A test document for MCP Docs Service
author: Test Script
date: ${new Date().toISOString().split("T")[0]}
tags:
  - test
  - documentation
---

# Test Document

This is a test document created by the test script.

## Section 1

This is section 1 of the test document.

## Section 2

This is section 2 of the test document.

[Link to README](README.md)
`,
        },
      },
    });

    console.log("Created test document");

    // Step 3: List all documents
    const documents = await sendRequest({
      jsonrpc: "2.0",
      id: 3,
      method: "tools/call",
      params: {
        name: "mcp_docs_manager_list_documents",
        arguments: {
          recursive: true,
        },
      },
    });

    console.log(
      `Found ${documents.result.content[0].text.split("\n").length} documents`
    );

    // Step 4: Read the test document
    const readResult = await sendRequest({
      jsonrpc: "2.0",
      id: 4,
      method: "tools/call",
      params: {
        name: "mcp_docs_manager_read_document",
        arguments: {
          path: "test.md",
        },
      },
    });

    console.log("Successfully read test document");

    // Step 5: Edit the test document
    await sendRequest({
      jsonrpc: "2.0",
      id: 5,
      method: "tools/call",
      params: {
        name: "mcp_docs_manager_edit_document",
        arguments: {
          path: "test.md",
          edits: [
            {
              oldText:
                "## Section 2\n\nThis is section 2 of the test document.",
              newText:
                "## Section 2\n\nThis is section 2 of the test document, which has been edited.",
            },
          ],
        },
      },
    });

    console.log("Successfully edited test document");

    // Step 6: Search documents
    const searchResult = await sendRequest({
      jsonrpc: "2.0",
      id: 6,
      method: "tools/call",
      params: {
        name: "mcp_docs_manager_search_documents",
        arguments: {
          query: "edited",
        },
      },
    });

    console.log("Successfully searched documents");

    // Step 7: Generate navigation
    const navResult = await sendRequest({
      jsonrpc: "2.0",
      id: 7,
      method: "tools/call",
      params: {
        name: "mcp_docs_manager_generate_navigation",
        arguments: {
          basePath: "",
        },
      },
    });

    console.log("Successfully generated navigation");

    // Step 8: Check documentation health
    const healthResult = await sendRequest({
      jsonrpc: "2.0",
      id: 8,
      method: "tools/call",
      params: {
        name: "mcp_docs_manager_check_documentation_health",
        arguments: {
          basePath: "",
        },
      },
    });

    console.log("Successfully checked documentation health");
    console.log(`Health score: ${healthResult.result.metadata.score}/100`);

    console.log("\nAll tests completed successfully!");
    service.kill();
    process.exit(0);
  } catch (error) {
    console.error("Test failed:", error);
    service.kill();
    process.exit(1);
  }
}

// Helper function to send requests and wait for responses
function sendRequest(request) {
  return new Promise((resolve, reject) => {
    console.log(`Sending request: ${request.method} (ID: ${request.id})`);

    const responseHandler = (line) => {
      try {
        const response = JSON.parse(line);
        if (response.id === request.id) {
          // Remove this listener once we get the matching response
          rl.removeListener("line", responseHandler);

          if (response.error) {
            reject(
              new Error(`Error in response: ${JSON.stringify(response.error)}`)
            );
          } else {
            resolve(response);
          }
        }
      } catch (error) {
        // Not JSON or not our response, ignore
      }
    };

    // Add listener for this specific response
    rl.on("line", responseHandler);

    // Send the request
    service.stdin.write(JSON.stringify(request) + "\n");
  });
}

// Handle process termination
process.on("SIGINT", () => {
  console.log("Test interrupted");
  service.kill();
  process.exit(1);
});
