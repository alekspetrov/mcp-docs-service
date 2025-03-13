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
console.log("CLI Arguments:", JSON.stringify(args));
let docsDir = path.join(process.cwd(), "docs");
let createDir = false;
let healthCheck = false;
let showHelp = false;

// MCP Inspector specific handling
// When run through MCP Inspector, it might pass arguments in a different format
// Let's try to detect if we're running under MCP Inspector
const isMCPInspector =
  process.env.MCP_INSPECTOR === "true" ||
  process.argv.some((arg) => arg.includes("modelcontextprotocol/inspector"));

if (isMCPInspector) {
  console.log("Detected MCP Inspector environment");

  // Try to find a valid docs directory in all arguments
  // This is a more aggressive approach but should work with various argument formats
  for (const arg of process.argv) {
    if (arg.endsWith("/docs") || arg.includes("/docs ")) {
      const potentialPath = arg.split(" ")[0];
      console.log(
        "Found potential docs path in MCP Inspector args:",
        potentialPath
      );
      if (fs.existsSync(potentialPath)) {
        docsDir = path.resolve(potentialPath);
        console.log("Using docs directory from MCP Inspector:", docsDir);
        break;
      }
    }
  }

  // If we couldn't find a valid docs directory, use the default
  console.log("Using docs directory:", docsDir);
} else {
  // Standard argument parsing
  for (let i = 0; i < args.length; i++) {
    console.log(`Processing arg[${i}]:`, args[i]);
    if (args[i] === "--docs-dir" && i + 1 < args.length) {
      docsDir = path.resolve(args[i + 1]);
      console.log("Setting docs dir from --docs-dir flag:", docsDir);
      i++; // Skip the next argument
    } else if (args[i] === "--create-dir") {
      createDir = true;
    } else if (args[i] === "--health-check") {
      healthCheck = true;
    } else if (args[i] === "--help" || args[i] === "-h") {
      showHelp = true;
    } else if (!args[i].startsWith("--")) {
      // Handle positional argument as docs directory
      const potentialPath = path.resolve(args[i]);
      console.log("Potential positional path:", potentialPath);
      console.log("Path exists?", fs.existsSync(potentialPath));

      if (fs.existsSync(potentialPath)) {
        docsDir = potentialPath;
        console.log("Setting docs dir from positional argument:", docsDir);
      } else {
        console.log(
          "Path doesn't exist, not using as docs dir:",
          potentialPath
        );
      }
    }
  }
}

console.log("Final docs dir:", docsDir);

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
