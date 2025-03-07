#!/usr/bin/env node

/**
 * MCP Documentation Management Service CLI
 * This is the entry point for the CLI when run via npx
 */

import { main } from "./index.js";

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  docsDir: "./docs",
  createIfNotExists: false,
  help: false,
};

// Process arguments
for (let i = 0; i < args.length; i++) {
  const arg = args[i];

  if (arg === "--docs-dir" && i + 1 < args.length) {
    options.docsDir = args[++i];
  } else if (arg === "--create-dir") {
    options.createIfNotExists = true;
  } else if (arg === "--help" || arg === "-h") {
    options.help = true;
  }
}

// Show help if requested
if (options.help) {
  console.log(`
MCP Documentation Service

Usage:
  npx mcp-docs-service [options]

Options:
  --docs-dir <path>  Specify the docs directory (default: ./docs)
  --create-dir       Create the docs directory if it doesn't exist
  --help, -h         Show this help message
  `);
  process.exit(0);
}

// Start the main process
main(options).catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
