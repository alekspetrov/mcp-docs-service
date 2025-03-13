#!/usr/bin/env node

/**
 * MCP Inspector Wrapper
 *
 * This script is a wrapper for the MCP Docs Service that handles the MCP Inspector's argument format.
 * It extracts the docs directory from the arguments and passes it to the MCP Docs Service.
 */

import path from "path";
import { spawn } from "child_process";
import fs from "fs";
import { fileURLToPath } from "url";

// Get the current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Redirect logs to stderr instead of stdout to avoid interfering with JSON communication
const log = (...args) => {
  console.error(...args);
};

// Get all arguments
const args = process.argv.slice(2);
log("MCP Inspector Wrapper - Arguments:", args);

// Find the docs directory in the arguments
let docsDir = path.join(process.cwd(), "docs");
let foundDocsDir = false;

// Look for a path ending with /docs
for (const arg of args) {
  if (arg.endsWith("/docs") || arg.includes("/docs ")) {
    const potentialPath = arg.split(" ")[0];
    log("Found potential docs path:", potentialPath);
    if (fs.existsSync(potentialPath)) {
      docsDir = potentialPath;
      foundDocsDir = true;
      log("Using docs directory:", docsDir);
      break;
    }
  }
}

if (!foundDocsDir) {
  log("No docs directory found in arguments, using default:", docsDir);
}

// Spawn the MCP Docs Service with the docs directory
const binPath = path.join(__dirname, "dist", "cli", "bin.js");
log("Spawning MCP Docs Service:", binPath, "--docs-dir", docsDir);

// Set environment variable to indicate we're running under MCP Inspector
const env = { ...process.env, MCP_INSPECTOR: "true" };

// Spawn the process with stdio inheritance
// This ensures that the JSON communication between the MCP Inspector and the service
// is not interrupted by our logs
const child = spawn("node", [binPath, "--docs-dir", docsDir], {
  stdio: "inherit",
  env,
});

// Forward exit code
child.on("exit", (code) => {
  process.exit(code);
});
