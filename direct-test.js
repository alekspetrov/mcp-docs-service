#!/usr/bin/env node

/**
 * Direct test script for MCP Docs Service
 *
 * This script tests the MCP Docs Service by sending JSON-RPC requests directly to it.
 */

import { spawn } from "child_process";
import readline from "readline";

// Start the service
console.log("Starting MCP Docs Service...");
const service = spawn("node", ["dist/index.js", "--docs-dir", "docs"]);

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

    console.log(`Found ${tools.result.tools.length} tools:`);
    tools.result.tools.forEach((tool) => {
      console.log(`- ${tool.name}: ${tool.description.split(".")[0]}`);
    });

    // Step 2: Read a document (README.md)
    const readResult = await sendRequest({
      jsonrpc: "2.0",
      id: 2,
      method: "tools/call",
      params: {
        name: "read_document",
        arguments: {
          path: "README.md",
        },
      },
    });

    console.log("\nSuccessfully read README.md");
    console.log(`Title: ${readResult.result.metadata.title}`);
    console.log(`Description: ${readResult.result.metadata.description}`);

    // Step 3: Generate navigation
    const navResult = await sendRequest({
      jsonrpc: "2.0",
      id: 3,
      method: "tools/call",
      params: {
        name: "generate_documentation_navigation",
        arguments: {
          basePath: "",
        },
      },
    });

    console.log("\nGenerated Navigation Structure:");
    const navData = JSON.parse(navResult.result.content[0].text);
    console.log(`Top-level items: ${navData.length}`);

    // Step 4: Search documents
    const searchResult = await sendRequest({
      jsonrpc: "2.0",
      id: 4,
      method: "tools/call",
      params: {
        name: "search_documents",
        arguments: {
          query: "features",
        },
      },
    });

    console.log("\nSearch Results for 'features':");
    console.log(searchResult.result.content[0].text);

    // Step 5: Check documentation health
    const healthResult = await sendRequest({
      jsonrpc: "2.0",
      id: 5,
      method: "tools/call",
      params: {
        name: "check_documentation_health",
        arguments: {
          basePath: "",
        },
      },
    });

    console.log("\nDocumentation Health Check:");
    console.log(healthResult.result.content[0].text);
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
