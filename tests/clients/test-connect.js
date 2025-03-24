#!/usr/bin/env node

/**
 * Test connecting to a running MCP service
 */

import { spawn } from "child_process";
import { createInterface } from "readline";

// Function to send a request to the MCP service
function sendRequest(process, request) {
  return new Promise((resolve) => {
    const responsePromise = new Promise((resolveResponse) => {
      const onData = (data) => {
        const text = data.toString();
        try {
          const json = JSON.parse(text);
          if (json.id === request.id) {
            process.stdout.removeListener("data", onData);
            resolveResponse(json);
          }
        } catch (e) {
          // Not JSON or not our response
          console.log("Non-JSON response:", text);
        }
      };

      process.stdout.on("data", onData);
    });

    process.stdin.write(JSON.stringify(request) + "\n");
    resolve(responsePromise);
  });
}

async function main() {
  // Spawn the MCP process
  console.log("Running MCP service...");
  const mcpProcess = spawn(
    "node",
    [
      "/Users/aleks.petrov/Projects/others/mcp/mcp-docs-service/dist/index.js",
      "--single-doc",
      "/Users/aleks.petrov/Projects/others/mcp/mcp-docs-service/consolidated-docs.md",
      "--server",
    ],
    {
      stdio: ["pipe", "pipe", "inherit"],
    }
  );

  // Wait for startup
  await new Promise((resolve) => setTimeout(resolve, 1000));

  try {
    // Send initialize request
    console.log("Sending initialize request...");
    const initResponse = await sendRequest(mcpProcess, {
      jsonrpc: "2.0",
      id: "1",
      method: "initialize",
      params: {
        protocolVersion: "2.0.0",
        capabilities: { tools: true },
        clientInfo: { name: "Test Connector", version: "1.0.0" },
      },
    });

    console.log("Initialize response:", JSON.stringify(initResponse, null, 2));

    // Send tools list request
    console.log("Sending tools list request...");
    const toolsResponse = await sendRequest(mcpProcess, {
      jsonrpc: "2.0",
      id: "2",
      method: "list_tools",
      params: {},
    });

    console.log("Tools response:", JSON.stringify(toolsResponse, null, 2));

    // Test a tool call
    console.log("Testing tool call...");
    const toolResponse = await sendRequest(mcpProcess, {
      jsonrpc: "2.0",
      id: "3",
      method: "tool",
      params: {
        name: "read_document",
        params: {},
      },
    });

    console.log("Tool response:", JSON.stringify(toolResponse, null, 2));

    console.log("All tests completed successfully!");
  } catch (error) {
    console.error("Error during tests:", error);
  } finally {
    // Clean up
    mcpProcess.kill();
  }
}

main().catch(console.error);
