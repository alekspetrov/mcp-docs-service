#!/usr/bin/env node

/**
 * MCP Documentation Service Client Test
 *
 * This script tests connecting to the MCP Docs Service as a client
 */

import { spawn } from "child_process";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

// Get __dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Setup test directory
const TEST_DIR = path.join(__dirname, "test-docs");
if (!fs.existsSync(TEST_DIR)) {
  fs.mkdirSync(TEST_DIR, { recursive: true });
}

// Create test document if it doesn't exist
const TEST_FILE = path.join(TEST_DIR, "test-document.md");
if (!fs.existsSync(TEST_FILE)) {
  fs.writeFileSync(
    TEST_FILE,
    `---
title: Test Document
description: A test document
---

# Test Document

This is a test document for MCP client.
`
  );
}

// Start the MCP server
console.log("Starting MCP server...");
const server = spawn("node", ["dist/index.js", "--docs-dir", TEST_DIR], {
  stdio: ["pipe", "pipe", "inherit"],
});

let buffer = "";
let requestCount = 0;
let resolved = false;

// Process stdout data
server.stdout.on("data", (data) => {
  const text = data.toString();

  // Print server startup messages
  if (!text.trim().startsWith("{")) {
    console.log("Server:", text);
  }

  // Accumulate buffer
  buffer += text;

  // Try to parse lines as JSON
  const lines = buffer.split("\n");
  // Keep the last incomplete line in the buffer
  buffer = lines.pop();

  for (const line of lines) {
    if (!line.trim()) continue;

    try {
      // Skip non-JSON lines (like logs)
      if (!line.trim().startsWith("{")) {
        continue;
      }

      const response = JSON.parse(line);
      console.log("Received response:", JSON.stringify(response, null, 2));

      // Execute next request based on the current response
      handleResponse(response);
    } catch (error) {
      console.log("Not valid JSON:", line);
    }
  }
});

// Function to send a request to the server
function sendRequest(request) {
  console.log("Sending request:", JSON.stringify(request, null, 2));
  server.stdin.write(JSON.stringify(request) + "\n");
}

// Handle server response and execute next step
function handleResponse(response) {
  // If we've already resolved the test, ignore further responses
  if (resolved) return;

  if (response.id === "1") {
    // After listing tools, try to read a document
    sendRequest({
      jsonrpc: "2.0",
      id: "2",
      method: "tool",
      params: {
        name: "read_document",
        params: {
          path: "test-document.md",
        },
      },
    });
  } else if (response.id === "2") {
    // We've successfully read a document, test completed
    console.log("MCP client test completed successfully!");
    resolved = true;

    // Give some time for the message to be printed before exiting
    setTimeout(() => {
      console.log("Shutting down server...");
      server.kill();
      process.exit(0);
    }, 1000);
  }
}

// Wait for server to start, then send the first request
setTimeout(() => {
  console.log("Sending initial list_tools request...");
  sendRequest({
    jsonrpc: "2.0",
    id: "1",
    method: "list_tools",
    params: {},
  });
}, 2000);

// Handle process termination
process.on("SIGINT", () => {
  console.log("Stopping server...");
  server.kill();
  process.exit();
});
