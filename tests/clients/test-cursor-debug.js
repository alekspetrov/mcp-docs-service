#!/usr/bin/env node

/**
 * Test Cursor MCP Connection with Debug Mode
 *
 * This script tests if Cursor can establish a connection to the MCP server
 * with debugging enabled in the .cursor/mcp.json configuration.
 */

import { spawn } from "child_process";
import fs from "fs";
import path from "path";

// Store logs for inspection
const logFile = "cursor-mcp-debug.log";
const logStream = fs.createWriteStream(logFile, { flags: "w" });

// Launch MCP server with the same environment variables as in .cursor/mcp.json
const envVars = {
  ...process.env,
  DEBUG: "*",
  MCP_DEBUG: "1",
  NODE_DEBUG: "mcp,net,http",
};

console.log("Starting MCP server with debug environment...");
logStream.write("=== Starting MCP server with debug environment ===\n");

const server = spawn("node", ["dist/index.js", "--single-doc", "docs"], {
  stdio: ["pipe", "pipe", "pipe"],
  env: envVars,
});

// Buffer for collecting output
let buffer = "";

// Collect stdout
server.stdout.on("data", (data) => {
  const output = data.toString();
  buffer += output;

  // Process complete lines
  let lines = buffer.split("\n");
  buffer = lines.pop() || ""; // Keep the last incomplete line

  for (const line of lines) {
    if (!line.trim()) continue;

    // Try to parse as JSON
    if (line.trim().startsWith("{")) {
      try {
        const json = JSON.parse(line);
        console.log(`[SERVER RESPONSE] ${JSON.stringify(json, null, 2)}`);
        logStream.write(`[JSON RESPONSE] ${JSON.stringify(json, null, 2)}\n`);
      } catch (error) {
        // Not valid JSON, log as regular output
        console.log(`[SERVER STDOUT] ${line}`);
        logStream.write(`[STDOUT] ${line}\n`);
      }
    } else {
      console.log(`[SERVER STDOUT] ${line}`);
      logStream.write(`[STDOUT] ${line}\n`);
    }
  }
});

// Collect stderr
server.stderr.on("data", (data) => {
  const output = data.toString();
  console.log(`[SERVER STDERR] ${output.trim()}`);
  logStream.write(`[STDERR] ${output.trim()}\n`);
});

// Function to send requests and log them
function sendRequest(request) {
  const requestStr = JSON.stringify(request);
  console.log(`[SENDING REQUEST] ${requestStr}`);
  logStream.write(`[REQUEST SENT] ${requestStr}\n`);
  server.stdin.write(requestStr + "\n");
}

// Wait for server to start
setTimeout(() => {
  console.log("Sending initialize request...");
  logStream.write("=== Sending initialize request ===\n");

  // Send initialize request as per MCP protocol
  sendRequest({
    jsonrpc: "2.0",
    id: "1",
    method: "initialize",
    params: {
      protocolVersion: "2.0.0",
      capabilities: { tools: true },
      clientInfo: { name: "Test Cursor Client", version: "1.0.0" },
    },
  });

  // Send initialized notification
  setTimeout(() => {
    console.log("Sending initialized notification...");
    logStream.write("=== Sending initialized notification ===\n");

    sendRequest({
      jsonrpc: "2.0",
      method: "initialized",
    });

    // List tools
    setTimeout(() => {
      console.log("Requesting tools list...");
      logStream.write("=== Requesting tools list ===\n");

      sendRequest({
        jsonrpc: "2.0",
        id: "2",
        method: "list_tools",
      });

      // Attempt to read a document (tool invocation)
      setTimeout(() => {
        console.log("Testing tool invocation...");
        logStream.write("=== Testing tool invocation ===\n");

        sendRequest({
          jsonrpc: "2.0",
          id: "3",
          method: "tool",
          params: {
            name: "read_document",
            params: {
              path: "test-document.md",
            },
          },
        });

        // Clean up after 5 seconds to give time for responses
        setTimeout(() => {
          console.log("Test complete, shutting down server");
          logStream.write("=== Test complete, shutting down server ===\n");

          // Create test document if not exists (for next test)
          if (!fs.existsSync(path.join("docs", "test-document.md"))) {
            try {
              fs.writeFileSync(
                path.join("docs", "test-document.md"),
                "---\ntitle: Test Document\ndescription: Test document for MCP testing\n---\n\n# Test Document\n\nThis is a test document for MCP testing."
              );
              console.log("Created test document for future tests");
              logStream.write("Created test document for future tests\n");
            } catch (error) {
              console.error(`Error creating test document: ${error.message}`);
              logStream.write(
                `Error creating test document: ${error.message}\n`
              );
            }
          }

          logStream.end();
          server.kill();
          console.log(`Debug log written to ${logFile}`);
          process.exit(0);
        }, 5000);
      }, 1000);
    }, 1000);
  }, 1000);
}, 2000);

// Handle process termination
process.on("SIGINT", () => {
  console.log("Stopping test...");
  logStream.end();
  server.kill();
  process.exit();
});
