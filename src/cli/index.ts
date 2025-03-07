/**
 * CLI interface for the MCP Documentation Management Service
 *
 * This script is meant to be run from the command line to start the MCP server.
 * It reads queries from stdin, processes them, and writes results to stdout.
 *
 * Usage:
 *   deno run --allow-read --allow-write --allow-env src/cli/index.ts
 */

import { query } from "../index.ts";

/**
 * Main function to process stdin commands
 */
async function main() {
  console.error("MCP Documentation Management Service started.");
  console.error("Reading from stdin, writing results to stdout...");

  // Create a buffer for reading lines from stdin
  const buffer = new Uint8Array(1024);

  // Read and process input
  let input = "";

  while (true) {
    // Read a chunk from stdin
    const bytesRead = await Deno.stdin.read(buffer);

    // Exit if no more input (EOF)
    if (bytesRead === null) {
      break;
    }

    // Convert the bytes to a string and append to input
    input += new TextDecoder().decode(buffer.subarray(0, bytesRead));

    // Process complete lines
    while (input.includes("\n")) {
      const newlineIndex = input.indexOf("\n");
      const line = input.slice(0, newlineIndex).trim();
      input = input.slice(newlineIndex + 1);

      if (line) {
        try {
          // Process the command and write the result to stdout
          const result = await query(line);
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
    }
  }
}

// Start the main processing loop
main().catch((error) => {
  console.error("Fatal error:", error);
  Deno.exit(1);
});
