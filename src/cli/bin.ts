#!/usr/bin/env node

/**
 * MCP Docs Service CLI
 *
 * This is the entry point for the CLI version of the MCP Docs Service.
 * It simply imports and runs the main service.
 */

import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

// Get the current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Parse command line arguments
const args = process.argv.slice(2);
let docsDir = path.join(process.cwd(), "docs");
let createDir = false;
let healthCheck = false;
let showHelp = false;

// Parse arguments
for (let i = 0; i < args.length; i++) {
  if (args[i] === "--docs-dir" && i + 1 < args.length) {
    docsDir = path.resolve(args[i + 1]);
    i++; // Skip the next argument
  } else if (args[i] === "--create-dir") {
    createDir = true;
  } else if (args[i] === "--health-check") {
    healthCheck = true;
  } else if (args[i] === "--help" || args[i] === "-h") {
    showHelp = true;
  } else if (!args[i].startsWith("--") && fs.existsSync(args[i])) {
    // Handle positional argument as docs directory
    // This allows both formats:
    // - mcp-docs-service /path/to/docs
    // - mcp-docs-service --docs-dir /path/to/docs
    docsDir = path.resolve(args[i]);
  }
}

// Show help if requested
if (showHelp) {
  console.log(`
MCP Docs Service - Documentation Management Service

Usage:
  mcp-docs-service [options]
  mcp-docs-service <docs-directory> [options]

Options:
  --docs-dir <path>   Specify the docs directory (default: ./docs)
  --create-dir        Create the docs directory if it doesn't exist
  --health-check      Run a health check on the documentation
  --help, -h          Show this help message
  `);
  process.exit(0);
}

// Create docs directory if it doesn't exist and --create-dir is specified
if (createDir) {
  try {
    if (!fs.existsSync(docsDir)) {
      fs.mkdirSync(docsDir, { recursive: true });
      console.log(`Created docs directory: ${docsDir}`);
    }
  } catch (error) {
    console.error(`Error creating docs directory: ${error}`);
    process.exit(1);
  }
}

// Ensure the docs directory exists
if (!fs.existsSync(docsDir)) {
  console.error(`Error: Docs directory does not exist: ${docsDir}`);
  console.error(`Use --create-dir to create it automatically`);
  process.exit(1);
}

// Add the docs directory to process.argv so it's available to the main service
process.argv.push(docsDir);

// Add health check flag to process.argv if specified
if (healthCheck) {
  process.argv.push("--health-check");
}

// Import the main service
import "../index.js";

// The main service will handle the CLI arguments and execution
// No additional code needed here as the main index.ts already has CLI functionality
