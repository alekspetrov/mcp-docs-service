#!/usr/bin/env node

/**
 * MCP Documentation Service Client
 *
 * A simple client that connects to the MCP Documentation Service
 * and demonstrates how to use it.
 */

import { spawn } from "child_process";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

// Get __dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Setup test directory
const TEST_DIR = path.join(__dirname, "test-client-docs");
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
description: A test document for the MCP client
---

# Test Document

This is a sample document created by the MCP client.
`
  );
}

/**
 * MCP Documentation Service Client
 */
class McpDocsClient {
  constructor(serverProcess) {
    this.serverProcess = serverProcess;
    this.nextId = 1;
    this.responseHandlers = new Map();
    this.dataBuffer = "";

    // Set up message parsing
    this.serverProcess.stdout.on("data", (chunk) => {
      this.dataBuffer += chunk.toString();
      this.processBuffer();
    });
  }

  /**
   * Process the buffer for complete messages
   */
  processBuffer() {
    // Process the buffer line by line
    let newlineIndex;
    while ((newlineIndex = this.dataBuffer.indexOf("\n")) !== -1) {
      const line = this.dataBuffer.substring(0, newlineIndex);
      this.dataBuffer = this.dataBuffer.substring(newlineIndex + 1);

      if (line.trim() === "") continue;

      // Skip non-JSON lines (usually log output)
      if (!line.trim().startsWith("{")) {
        //console.log('Server log:', line);
        continue;
      }

      try {
        const message = JSON.parse(line);
        if (message.id && this.responseHandlers.has(message.id)) {
          const handler = this.responseHandlers.get(message.id);
          this.responseHandlers.delete(message.id);
          handler(message);
        }
      } catch (error) {
        console.error("Error parsing message:", error);
      }
    }
  }

  /**
   * Send a JSON-RPC request to the server
   */
  async sendRequest(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = String(this.nextId++);
      const request = {
        jsonrpc: "2.0",
        id,
        method,
        params,
      };

      this.responseHandlers.set(id, (response) => {
        if (response.error) {
          reject(new Error(response.error.message));
        } else {
          resolve(response.result);
        }
      });

      this.serverProcess.stdin.write(JSON.stringify(request) + "\n");
    });
  }

  /**
   * List all available tools
   */
  async listTools() {
    return this.sendRequest("list_tools");
  }

  /**
   * Read a document from the docs directory
   */
  async readDocument(path) {
    return this.sendRequest("tool", {
      name: "read_document",
      params: { path },
    });
  }

  /**
   * Write a document to the docs directory
   */
  async writeDocument(path, content, createDirectories = true) {
    return this.sendRequest("tool", {
      name: "write_document",
      params: { path, content, createDirectories },
    });
  }

  /**
   * List all documents in the docs directory
   */
  async listDocuments(basePath = "", recursive = true) {
    return this.sendRequest("tool", {
      name: "list_documents",
      params: { basePath, recursive },
    });
  }

  /**
   * Search for documents containing specific text
   */
  async searchDocuments(query, basePath = "") {
    return this.sendRequest("tool", {
      name: "search_documents",
      params: { query, basePath },
    });
  }

  /**
   * Generate documentation navigation structure
   */
  async generateNavigation(basePath = "") {
    return this.sendRequest("tool", {
      name: "generate_documentation_navigation",
      params: { basePath },
    });
  }

  /**
   * Check documentation health
   */
  async checkHealth(basePath = "", toleranceMode = false) {
    return this.sendRequest("tool", {
      name: "check_documentation_health",
      params: { basePath, toleranceMode },
    });
  }
}

/**
 * Start the MCP server and return a client connected to it
 */
function startServerAndGetClient(docsDir) {
  console.log(`Starting MCP server with docs directory: ${docsDir}`);

  const server = spawn("node", ["dist/index.js", "--docs-dir", docsDir], {
    stdio: ["pipe", "pipe", "inherit"],
  });

  return new McpDocsClient(server);
}

/**
 * Main demo function
 */
async function main() {
  const client = startServerAndGetClient(TEST_DIR);

  // Wait for server to initialize
  await new Promise((resolve) => setTimeout(resolve, 1000));

  try {
    // List available tools
    console.log("Listing available tools...");
    const toolsResult = await client.listTools();
    console.log(
      "Available tools:",
      toolsResult.tools.map((tool) => tool.name)
    );

    // Read the test document
    console.log("\nReading test document...");
    const docResult = await client.readDocument("test-document.md");
    console.log("Document content:", docResult.content[0].text);

    // Create a new document
    console.log("\nCreating a new document...");
    await client.writeDocument(
      "new-doc.md",
      `---
title: New Document
description: A document created by the client
---

# New Document

This document was created by the MCP client.
`
    );

    // List all documents
    console.log("\nListing all documents...");
    const listResult = await client.listDocuments();
    console.log(
      "Documents:",
      listResult.documents?.map((doc) => doc.path) || []
    );

    // Generate navigation
    console.log("\nGenerating navigation...");
    const navResult = await client.generateNavigation();
    console.log(
      "Navigation:",
      JSON.stringify(navResult.navigation || {}, null, 2)
    );

    // Check documentation health
    console.log("\nChecking documentation health...");
    const healthResult = await client.checkHealth();
    console.log("Health score:", healthResult.score || "N/A");
    console.log("Issues:", healthResult.issues?.length || 0);
    if (healthResult.issues && healthResult.issues.length > 0) {
      console.log("First issue:", healthResult.issues[0]);
    }

    console.log("\nClient test completed successfully!");
  } catch (error) {
    console.error("Error:", error);
  } finally {
    // Clean up
    console.log("\nShutting down server...");
    client.serverProcess.kill();
  }
}

// Run the demo
main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
