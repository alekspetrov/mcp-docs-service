#!/usr/bin/env node

/**
 * Direct MCP Service Test
 *
 * This script sends requests directly to a running MCP service
 */

import * as readline from "readline";

// Create interface for reading stdin/stdout
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Function to send a request and wait for response
function sendRequest(request) {
  return new Promise((resolve) => {
    process.stdout.write(JSON.stringify(request) + "\n");

    // Listen for the response on stdin
    process.stdin.once("data", (data) => {
      try {
        const response = JSON.parse(data.toString().trim());
        resolve(response);
      } catch (error) {
        console.error("Error parsing response:", error);
        resolve(null);
      }
    });
  });
}

async function main() {
  console.log("Testing direct MCP connection...");

  // Initialize
  console.log("Sending initialize request...");
  const initResponse = await sendRequest({
    jsonrpc: "2.0",
    id: "1",
    method: "initialize",
    params: {
      protocolVersion: "2.0.0",
      capabilities: { tools: true },
      clientInfo: { name: "Direct Test Client", version: "1.0.0" },
    },
  });

  console.log("Initialize response:", JSON.stringify(initResponse, null, 2));

  // Get tools list
  console.log("Getting tools list...");
  const toolsResponse = await sendRequest({
    jsonrpc: "2.0",
    id: "2",
    method: "list_tools",
    params: {},
  });

  console.log("Tools response:", JSON.stringify(toolsResponse, null, 2));

  // Close the readline interface
  rl.close();
}

main().catch(console.error);
