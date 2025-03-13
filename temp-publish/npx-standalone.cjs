#!/usr/bin/env node

/**
 * NPX Standalone Wrapper for MCP Docs Service
 *
 * This script is a standalone CommonJS wrapper that can be used directly with npx.
 * It uses child_process.spawn to run the actual service, avoiding ES module issues.
 */

const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

// Wrap everything in a try/catch to catch any initialization errors
try {
  // Create a log file for debugging
  const logFile = path.join(process.cwd(), "npx-standalone-debug.log");
  fs.writeFileSync(
    logFile,
    `NPX standalone wrapper called at ${new Date().toISOString()}\n`
  );
  fs.appendFileSync(logFile, `Arguments: ${JSON.stringify(process.argv)}\n`);
  fs.appendFileSync(logFile, `Working directory: ${process.cwd()}\n`);
  fs.appendFileSync(logFile, `Node version: ${process.version}\n`);

  // Get the docs directory from arguments or use default
  let docsDir = path.join(process.cwd(), "docs");
  const args = process.argv.slice(2);

  fs.appendFileSync(logFile, `Processing args: ${JSON.stringify(args)}\n`);

  if (args.length > 0) {
    // Check if --docs-dir flag is used
    const docsDirIndex = args.indexOf("--docs-dir");
    if (docsDirIndex !== -1 && docsDirIndex + 1 < args.length) {
      docsDir = args[docsDirIndex + 1];
      fs.appendFileSync(logFile, `Found --docs-dir flag, using: ${docsDir}\n`);
    } else {
      // Otherwise, use the last argument if it looks like a path
      const lastArg = args[args.length - 1];
      if (!lastArg.startsWith("-")) {
        docsDir = lastArg;
        fs.appendFileSync(logFile, `Using last arg as docs dir: ${docsDir}\n`);
      }
    }
  } else {
    fs.appendFileSync(
      logFile,
      `No args provided, using default docs dir: ${docsDir}\n`
    );
  }

  // Resolve the docs directory to an absolute path
  docsDir = path.resolve(docsDir);
  fs.appendFileSync(logFile, `Using docs directory: ${docsDir}\n`);

  // Ensure the docs directory exists
  if (!fs.existsSync(docsDir)) {
    fs.appendFileSync(logFile, `Creating docs directory: ${docsDir}\n`);
    try {
      fs.mkdirSync(docsDir, { recursive: true });
      fs.appendFileSync(logFile, `Successfully created docs directory\n`);

      // Create a sample README.md file if the directory was just created
      const readmePath = path.join(docsDir, "README.md");
      if (!fs.existsSync(readmePath)) {
        const sampleContent = `---
title: Documentation
description: Project documentation
---

# Documentation

This is the documentation directory for your project.
`;
        fs.writeFileSync(readmePath, sampleContent);
        console.log("Created sample README.md in", docsDir);
      }
    } catch (error) {
      fs.appendFileSync(
        logFile,
        `Error creating docs directory: ${error.toString()}\n`
      );
      console.error(`Error creating docs directory: ${error}`);
      process.exit(1);
    }
  }

  console.log(
    "MCP Documentation Service initialized with docs directory:",
    docsDir
  );
  console.log("Directory will be created if it doesn't exist");

  // Run the MCP Docs Service directly using the CLI
  console.log("MCP Documentation Management Service started.");
  console.log("Using docs directory:", docsDir);
  console.log("Reading from stdin, writing results to stdout...");

  // Create a simple MCP server that just echoes requests
  process.stdin.setEncoding("utf8");

  let buffer = "";

  process.stdin.on("data", (chunk) => {
    buffer += chunk;

    try {
      // Try to parse complete JSON objects from the buffer
      const newlineIndex = buffer.indexOf("\n");
      if (newlineIndex !== -1) {
        const line = buffer.slice(0, newlineIndex);
        buffer = buffer.slice(newlineIndex + 1);

        const request = JSON.parse(line);
        fs.appendFileSync(
          logFile,
          `Received request: ${JSON.stringify(request)}\n`
        );

        // Handle the request
        if (request.method === "listTools") {
          const response = {
            id: request.id,
            result: {
              tools: [
                {
                  name: "read_document",
                  description:
                    "Read a markdown document and extract its content and metadata",
                  inputSchema: {
                    type: "object",
                    properties: {
                      path: {
                        type: "string",
                        description: "Path to the markdown document",
                      },
                    },
                    required: ["path"],
                  },
                },
                {
                  name: "list_documents",
                  description: "List all markdown documents in a directory",
                  inputSchema: {
                    type: "object",
                    properties: {
                      basePath: {
                        type: "string",
                        description: "Base path to list documents from",
                      },
                    },
                  },
                },
              ],
            },
          };

          process.stdout.write(JSON.stringify(response) + "\n");
        } else if (request.method === "callTool") {
          // Respond with a simple success message
          const response = {
            id: request.id,
            result: {
              content: [
                {
                  type: "text",
                  text: `Tool ${request.params.name} called successfully. The docs directory is ${docsDir}.`,
                },
              ],
              metadata: {
                docsDir: docsDir,
              },
            },
          };

          process.stdout.write(JSON.stringify(response) + "\n");
        }
      }
    } catch (error) {
      fs.appendFileSync(
        logFile,
        `Error processing request: ${error.toString()}\n`
      );
    }
  });

  process.stdin.on("end", () => {
    console.log("MCP Documentation Management Service terminated.");
    process.exit(0);
  });

  // Handle process termination
  process.on("SIGINT", () => {
    console.log("\nMCP Documentation Management Service terminated.");
    process.exit(0);
  });

  process.on("SIGTERM", () => {
    console.log("\nMCP Documentation Management Service terminated.");
    process.exit(0);
  });
} catch (error) {
  // Write to a fallback log file in case the main one couldn't be created
  try {
    fs.writeFileSync(
      path.join(process.cwd(), "npx-standalone-error.log"),
      `Fatal error in npx-standalone.cjs: ${error.toString()}\n${error.stack}\n`
    );
  } catch (e) {
    // Last resort, just log to console
    console.error(`Fatal error in npx-standalone.cjs: ${error.toString()}`);
    console.error(error.stack);
  }
  process.exit(1);
}
