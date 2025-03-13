#!/usr/bin/env node

/**
 * Test script for debugging the NPX version of the MCP Docs Service
 */

import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

// Get the current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get the docs directory from command line arguments or use default
const docsDir = process.argv[2] || path.join(process.cwd(), "docs");

console.log(`Testing MCP Docs Service with docs directory: ${docsDir}`);

// Spawn the NPX process
const npxProcess = spawn("npx", ["-y", "mcp-docs-service", docsDir], {
  stdio: ["pipe", "pipe", "pipe"],
});

// Handle stdout
npxProcess.stdout.on("data", (data) => {
  console.log(`STDOUT: ${data}`);

  try {
    // Try to parse as JSON to see if it's valid
    const json = JSON.parse(data);
    console.log("Valid JSON response:", json);
  } catch (error) {
    console.log("Not valid JSON or incomplete JSON");
  }
});

// Handle stderr
npxProcess.stderr.on("data", (data) => {
  console.error(`STDERR: ${data}`);
});

// Handle process exit
npxProcess.on("close", (code) => {
  console.log(`Process exited with code ${code}`);
});

// Send a test request after a delay
setTimeout(() => {
  const request = {
    jsonrpc: "2.0",
    method: "tools/list",
    id: Date.now(),
  };

  console.log("Sending request:", request);
  npxProcess.stdin.write(JSON.stringify(request) + "\n");
}, 2000);

// Keep the process running for a while
setTimeout(() => {
  console.log("Test completed");
  npxProcess.kill();
  process.exit(0);
}, 10000);
