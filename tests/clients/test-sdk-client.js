#!/usr/bin/env node

/**
 * MCP Documentation Service - MCP SDK Client Test
 *
 * This script tests connecting to the MCP Docs Service using the official MCP SDK client
 */

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { spawn } from "child_process";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

// Get __dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Setup test directory
const TEST_DIR = path.join(__dirname, "test-docs-sdk");
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

// Custom transport for connecting to our server
class CustomTransport {
  constructor(server) {
    this.server = server;
    this.dataBuffer = "";
    this.responseHandlers = [];

    // Callback handlers
    this.onmessage = null;
    this.onerror = null;
    this.onclose = null;

    // Set up message parsing
    this.server.stdout.on("data", (chunk) => {
      this.dataBuffer += chunk.toString();
      this.processBuffer();
    });

    // Handle server errors
    this.server.stderr.on("data", (data) => {
      console.error("Server error:", data.toString());
      if (this.onerror) {
        this.onerror(new Error(data.toString()));
      }
    });

    // Handle server close
    this.server.on("close", (code) => {
      console.log(`Server process exited with code ${code}`);
      if (this.onclose) {
        this.onclose();
      }
    });
  }

  processBuffer() {
    // Process the buffer line by line
    let newlineIndex;
    while ((newlineIndex = this.dataBuffer.indexOf("\n")) !== -1) {
      const line = this.dataBuffer.substring(0, newlineIndex);
      this.dataBuffer = this.dataBuffer.substring(newlineIndex + 1);

      if (line.trim() === "") continue;

      // Skip non-JSON lines (usually log output)
      if (!line.trim().startsWith("{")) {
        console.log("Server output:", line);
        continue;
      }

      try {
        const message = JSON.parse(line);
        if (this.onmessage) {
          this.onmessage(message);
        }
      } catch (error) {
        console.error("Error parsing message:", error);
        if (this.onerror) {
          this.onerror(error);
        }
      }
    }
  }

  async start() {
    // Transport is already started with the server
    console.log("Transport started");
    return Promise.resolve();
  }

  async close() {
    this.server.kill();
  }

  async send(message) {
    return new Promise((resolve, reject) => {
      const json = JSON.stringify(message) + "\n";
      if (this.server.stdin.write(json)) {
        resolve();
      } else {
        this.server.stdin.once("drain", resolve);
      }
    });
  }
}

// Start the MCP server
console.log("Starting MCP server...");
const server = spawn("node", ["dist/index.js", "--docs-dir", TEST_DIR], {
  stdio: ["pipe", "pipe", "pipe"],
});

// Wait for server to initialize before connecting client
setTimeout(async () => {
  console.log("Initializing MCP client...");

  try {
    // Create custom transport
    const transport = new CustomTransport(server);

    // Initialize client
    const client = new Client({
      transport,
      capabilities: {
        tools: true,
      },
    });

    // Connect to the server
    await client.connect();
    console.log("Client connected. Fetching tools...");

    // List available tools
    const tools = await client.listTools();
    console.log(
      "Available tools:",
      tools.map((tool) => tool.name)
    );

    // Try to use the read_document tool
    console.log("Reading test document...");
    const result = await client.invokeTool("read_document", {
      path: "test-document.md",
    });

    console.log(
      "Document content:",
      result.content[0]?.text || "No content returned"
    );
    console.log("Test completed successfully!");
  } catch (error) {
    console.error("Error:", error);
  } finally {
    // Clean up
    console.log("Shutting down server...");
    server.kill();
    process.exit(0);
  }
}, 2000);

// Handle process termination
process.on("SIGINT", () => {
  console.log("Stopping server...");
  server.kill();
  process.exit();
});
