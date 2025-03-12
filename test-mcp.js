#!/usr/bin/env node

import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

// Get the current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define the docs directory
const docsDir = path.join(__dirname, "docs");

// Start the MCP service with the docs directory as an allowed directory
const mcpProcess = spawn("node", [
  path.join(__dirname, "dist/index.js"),
  docsDir,
]);

// Set up pipes for communication
mcpProcess.stdout.on("data", (data) => {
  try {
    const response = JSON.parse(data.toString());

    // Extract the actual result from the double-wrapped response
    if (response.result && response.result.result) {
      console.log(
        "Actual result:",
        JSON.stringify(response.result.result, null, 2)
      );
    } else {
      console.log("Response:", JSON.stringify(response, null, 2));
    }

    // Exit after receiving the response
    mcpProcess.kill();
    process.exit(0);
  } catch (error) {
    console.log(`MCP stdout: ${data}`);
  }
});

mcpProcess.stderr.on("data", (data) => {
  console.error(`MCP stderr: ${data}`);
});

// Wait for the service to start
setTimeout(() => {
  // Send a request to read a document
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

  console.log("Sending request:", JSON.stringify(request));
  mcpProcess.stdin.write(JSON.stringify(request) + "\n");
}, 1000); // Give the service 1 second to start

// Handle process termination
process.on("SIGINT", () => {
  mcpProcess.kill();
  process.exit(0);
});
