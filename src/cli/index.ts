/**
 * CLI interface for the MCP Documentation Management Service
 *
 * This script is meant to be run from the command line to start the MCP server.
 * It reads queries from stdin, processes them, and writes results to stdout.
 *
 * Usage:
 *   npx mcp-docs-service [options]
 */

import { query as originalQuery } from "../index.js";
import * as readline from "readline";

/**
 * Main function to process stdin commands
 */
export async function main(
  options: {
    docsDir: string;
    createIfNotExists: boolean;
  } = {
    docsDir: "./docs",
    createIfNotExists: false,
  }
) {
  console.error("MCP Documentation Management Service started.");
  console.error(`Using docs directory: ${options.docsDir}`);
  if (options.createIfNotExists) {
    console.error("Will create directory if it doesn't exist");
  }
  console.error("Reading from stdin, writing results to stdout...");

  // Create a custom query function that uses the specified docs directory
  const query = (sql: string) =>
    originalQuery(sql, {
      docsDir: options.docsDir,
      createIfNotExists: options.createIfNotExists,
    });

  // Create readline interface
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false,
  });

  // Handle process termination
  process.on("SIGINT", () => {
    console.error("\nMCP Documentation Management Service terminated.");
    process.exit(0);
  });

  // Process lines from stdin
  rl.on("line", async (line) => {
    if (line.trim()) {
      try {
        // Process the command and write the result to stdout
        const result = await query(line.trim());
        console.log(JSON.stringify(result));
      } catch (error: unknown) {
        // Log errors to stderr and write error result to stdout
        console.error(
          `Error processing command: ${
            error instanceof Error ? error.message : String(error)
          }`
        );
        console.log(
          JSON.stringify({
            success: false,
            error: error instanceof Error ? error.message : String(error),
          })
        );
      }
    }
  });

  // Handle end of input
  rl.on("close", () => {
    console.error("Input stream closed. Waiting for output to flush...");
    // Add a delay before exiting to ensure all output is flushed
    setTimeout(() => {
      console.error("Exiting...");
      process.exit(0);
    }, 1000);
  });
}
