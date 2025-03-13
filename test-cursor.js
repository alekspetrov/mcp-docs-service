#!/usr/bin/env node

/**
 * Test script for simulating Cursor's interaction with the MCP Docs Service
 */

import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

// Get the current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get the docs directory from command line arguments or use default
const docsDir = process.argv[2] || path.join(process.cwd(), "docs");

console.log(`Testing MCP Docs Service with docs directory: ${docsDir}`);

// Create a temporary mcp.json file that simulates Cursor's configuration
const tempMcpJsonPath = path.join(__dirname, "temp-mcp.json");
const mcpConfig = {
  mcpServers: {
    "docs-manager": {
      command: "npx",
      args: ["-y", "mcp-docs-service", docsDir],
    },
  },
};

fs.writeFileSync(tempMcpJsonPath, JSON.stringify(mcpConfig, null, 2));
console.log(`Created temporary mcp.json at ${tempMcpJsonPath}`);

// Parse the mcp.json file to get the command and args
const { command, args } = mcpConfig.mcpServers["docs-manager"];

console.log(`Spawning process: ${command} ${args.join(" ")}`);

// Spawn the process
const mcpProcess = spawn(command, args, {
  stdio: ["pipe", "pipe", "pipe"],
});

// Handle stdout
mcpProcess.stdout.on("data", (data) => {
  console.log(`STDOUT: ${data.toString()}`);

  try {
    // Try to parse as JSON to see if it's valid
    const json = JSON.parse(data.toString());
    console.log("Valid JSON response:", json);
  } catch (error) {
    console.log("Not valid JSON or incomplete JSON");
  }
});

// Handle stderr
mcpProcess.stderr.on("data", (data) => {
  console.error(`STDERR: ${data.toString()}`);
});

// Handle process exit
mcpProcess.on("close", (code) => {
  console.log(`Process exited with code ${code}`);

  // Clean up the temporary file
  fs.unlinkSync(tempMcpJsonPath);
  console.log(`Removed temporary mcp.json`);
});

// Send a test request after a delay
setTimeout(() => {
  const request = {
    jsonrpc: "2.0",
    method: "tools/list",
    id: Date.now(),
  };

  console.log("Sending request:", request);
  mcpProcess.stdin.write(JSON.stringify(request) + "\n");
}, 2000);

// Send another test request after a delay
setTimeout(() => {
  const request = {
    jsonrpc: "2.0",
    method: "tools/call",
    params: {
      name: "list_documents",
      arguments: {
        basePath: docsDir,
      },
    },
    id: Date.now(),
  };

  console.log("Sending request:", request);
  mcpProcess.stdin.write(JSON.stringify(request) + "\n");
}, 4000);

// Keep the process running for a while
setTimeout(() => {
  console.log("Test completed");
  mcpProcess.kill();
  process.exit(0);
}, 10000);
