#!/usr/bin/env node

// Simple MCP client script
import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import readline from "readline";

// Get the current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define the docs directory
const docsDir = path.join(__dirname, "docs");

// Parse command line arguments
const args = process.argv.slice(2);
const toolName = args[0];
const toolMethod = args[1];
const toolArgs = {};

// Parse tool arguments (--key value format)
for (let i = 2; i < args.length; i += 2) {
  if (args[i].startsWith("--")) {
    const key = args[i].slice(2);
    const value = args[i + 1];

    // Try to parse JSON values
    if (key === "metadata") {
      try {
        toolArgs[key] = JSON.parse(value);
      } catch (error) {
        toolArgs[key] = value;
      }
    } else {
      toolArgs[key] = value;
    }
  }
}

// Start the MCP service with the docs directory as an allowed directory
const mcpProcess = spawn("node", [
  path.join(__dirname, "dist/index.js"),
  docsDir,
]);

// Set up pipes for communication
mcpProcess.stdout.on("data", (data) => {
  try {
    const response = JSON.parse(data.toString());

    // Extract the actual result from the double-wrapped response
    if (response.result && response.result.result) {
      console.log("Result:", JSON.stringify(response.result.result, null, 2));
    } else {
      console.log("Response:", JSON.stringify(response, null, 2));
    }

    // Exit after receiving response when running in command mode
    if (toolName && toolMethod) {
      mcpProcess.kill();
      process.exit(0);
    }
  } catch (error) {
    console.log(`MCP stdout: ${data}`);
  }
});

mcpProcess.stderr.on("data", (data) => {
  console.error(`MCP stderr: ${data}`);
});

// If tool name and method are provided, send the request immediately
if (toolName && toolMethod) {
  // Wait for the service to start
  setTimeout(() => {
    const request = {
      jsonrpc: "2.0",
      method: "tools/call",
      params: {
        name: toolMethod,
        arguments: toolArgs,
      },
      id: Date.now(),
    };

    console.log(`Calling tool: ${toolName} ${toolMethod} with args:`, toolArgs);
    mcpProcess.stdin.write(JSON.stringify(request) + "\n");
  }, 1000); // Give the service 1 second to start
} else {
  // Interactive mode
  // Create readline interface for user input
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  console.log("MCP client started. Available commands:");
  console.log("- list_documents: List all documents");
  console.log("- read_document <path>: Read a document");
  console.log("- get_structure: Get the structure of the documentation");
  console.log("- get_navigation: Get the navigation structure");
  console.log("- get_knowledge_base: Get the comprehensive knowledge base");
  console.log("- exit: Exit the client");
  console.log("");

  // Process user input
  rl.on("line", (line) => {
    const args = line.trim().split(" ");
    const command = args[0];

    if (command === "exit") {
      mcpProcess.kill();
      rl.close();
      process.exit(0);
    } else if (command === "list_documents") {
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
      mcpProcess.stdin.write(JSON.stringify(request) + "\n");
    } else if (command === "read_document" && args[1]) {
      const docPath = path.join(docsDir, args[1]);
      const request = {
        jsonrpc: "2.0",
        method: "tools/call",
        params: {
          name: "read_document",
          arguments: {
            path: docPath,
          },
        },
        id: Date.now(),
      };
      mcpProcess.stdin.write(JSON.stringify(request) + "\n");
    } else if (command === "get_structure") {
      const request = {
        jsonrpc: "2.0",
        method: "tools/call",
        params: {
          name: "get_structure",
          arguments: {
            basePath: docsDir,
          },
        },
        id: Date.now(),
      };
      mcpProcess.stdin.write(JSON.stringify(request) + "\n");
    } else if (command === "get_navigation") {
      const request = {
        jsonrpc: "2.0",
        method: "tools/call",
        params: {
          name: "get_navigation",
          arguments: {
            basePath: docsDir,
          },
        },
        id: Date.now(),
      };
      mcpProcess.stdin.write(JSON.stringify(request) + "\n");
    } else if (command === "get_knowledge_base") {
      const request = {
        jsonrpc: "2.0",
        method: "tools/call",
        params: {
          name: "get_docs_knowledge_base",
          arguments: {
            basePath: docsDir,
            includeSummaries: true,
            maxSummaryLength: 300,
          },
        },
        id: Date.now(),
      };
      mcpProcess.stdin.write(JSON.stringify(request) + "\n");
    } else {
      console.log("Unknown command. Available commands:");
      console.log("- list_documents: List all documents");
      console.log("- read_document <path>: Read a document");
      console.log("- get_structure: Get the structure of the documentation");
      console.log("- get_navigation: Get the navigation structure");
      console.log("- get_knowledge_base: Get the comprehensive knowledge base");
      console.log("- exit: Exit the client");
    }
  });

  // Handle process termination
  process.on("SIGINT", () => {
    mcpProcess.kill();
    rl.close();
    process.exit(0);
  });
}
