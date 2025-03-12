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

// Parse arguments
for (let i = 0; i < args.length; i++) {
  if (args[i] === "--docs-dir" && i + 1 < args.length) {
    docsDir = path.resolve(args[i + 1]);
    i++; // Skip the next argument
  } else if (args[i] === "--create-dir") {
    createDir = true;
  }
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

// Import the main service
import "../index.js";

// The main service will handle the CLI arguments and execution
// No additional code needed here as the main index.ts already has CLI functionality
