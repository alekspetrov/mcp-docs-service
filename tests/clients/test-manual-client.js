#!/usr/bin/env node

/**
 * MCP Documentation Service - Manual Client Test
 *
 * This script creates a client that doesn't use the SDK directly
 * but implements the MCP client interface against our running server
 */

import { spawn } from "child_process";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { Buffer } from "buffer";

// Get __dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Setup test directory
const TEST_DIR = path.join(__dirname, "test-docs-manual");
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

// For debugging - save all server output to a file
const DEBUG = true;
const debugLog = fs.createWriteStream("server-output.log");

/**
 * Basic MCP Client implementation
 */
class McpClient {
  constructor(stdin, stdout) {
    this.stdin = stdin;
    this.stdout = stdout;
    this.nextId = 1;
    this.responseHandlers = new Map();
    this.dataBuffer = "";
    this.initialized = false;

    // Set up message parsing
    this.stdout.on("data", (chunk) => {
      const data = chunk.toString();
      if (DEBUG) {
        debugLog.write(data);
      }
      this.dataBuffer += data;
      this.processBuffer();
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
      if (!line.startsWith("{")) {
        console.log("Server output:", line);
        continue;
      }

      try {
        const message = JSON.parse(line);
        console.log("Received message:", JSON.stringify(message, null, 2));

        if (message.id && this.responseHandlers.has(message.id)) {
          const handler = this.responseHandlers.get(message.id);
          this.responseHandlers.delete(message.id);
          handler(message);
        }
      } catch (error) {
        console.error("Error parsing message:", error, "Line:", line);
      }
    }
  }

  async sendRequest(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = String(this.nextId++);
      const request = {
        jsonrpc: "2.0",
        id,
        method,
        params,
      };

      console.log("Sending request:", JSON.stringify(request, null, 2));

      this.responseHandlers.set(id, (response) => {
        if (response.error) {
          reject(new Error(response.error.message || "Unknown error"));
        } else {
          resolve(response.result);
        }
      });

      this.stdin.write(JSON.stringify(request) + "\n");
    });
  }

  async initialize() {
    try {
      const result = await this.sendRequest("initialize", {
        protocolVersion: "2.0.0",
        capabilities: {},
        clientInfo: {
          name: "MCP Manual Client",
          version: "1.0.0",
        },
      });

      // Send the initialized notification
      const notification = {
        jsonrpc: "2.0",
        method: "notifications/initialized",
      };

      console.log(
        "Sending notification:",
        JSON.stringify(notification, null, 2)
      );
      this.stdin.write(JSON.stringify(notification) + "\n");

      this.initialized = true;
      return result;
    } catch (error) {
      console.error("Initialization failed:", error);
      throw error;
    }
  }

  async listTools() {
    if (!this.initialized) {
      throw new Error("Client not initialized");
    }
    return this.sendRequest("list_tools");
  }

  async invokeTool(name, params) {
    if (!this.initialized) {
      throw new Error("Client not initialized");
    }
    return this.sendRequest("tool", {
      name,
      params,
    });
  }
}

// Start the MCP server
console.log("Starting MCP server...");
const server = spawn("node", ["dist/index.js", "--docs-dir", TEST_DIR], {
  stdio: ["pipe", "pipe", "inherit"],
});

// Wait for server to initialize before connecting client
setTimeout(async () => {
  console.log("Initializing MCP client...");

  try {
    // Create MCP client
    const client = new McpClient(server.stdin, server.stdout);

    // Initialize the client
    const initResult = await client.initialize();
    console.log(
      "Client initialized:",
      initResult?.serverInfo?.name || "Unknown server"
    );

    // List available tools
    const toolsResult = await client.listTools();
    if (toolsResult?.tools) {
      console.log(
        "Available tools:",
        toolsResult.tools.map((tool) => tool.name)
      );
    } else {
      console.log("No tools available or unexpected response format");
    }

    // Try to use the read_document tool
    console.log("Reading test document...");
    const result = await client.invokeTool("read_document", {
      path: "test-document.md",
    });

    if (result?.content) {
      console.log(
        "Document content:",
        result.content[0]?.text || "No text content"
      );
    } else {
      console.log("No content returned or unexpected response format");
    }

    console.log("Test completed successfully!");
  } catch (error) {
    console.error("Error:", error);
  } finally {
    // Clean up
    console.log("Shutting down server...");
    server.kill();

    if (DEBUG) {
      debugLog.end();
    }

    process.exit(0);
  }
}, 2000);

// Handle process termination
process.on("SIGINT", () => {
  console.log("Stopping server...");
  server.kill();

  if (DEBUG) {
    debugLog.end();
  }

  process.exit();
});
