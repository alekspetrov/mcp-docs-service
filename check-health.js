#!/usr/bin/env node

/**
 * Documentation Health Check Script
 *
 * This script runs a health check on the documentation and displays the results.
 * It uses the MCP Docs Manager service to perform the check.
 *
 * Usage: node check-health.js
 */

import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

// Get the current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define the docs directory
const docsDir = path.join(__dirname, "docs");

// Start the MCP service with the docs directory as an allowed directory
const mcpProcess = spawn("node", [
  path.join(__dirname, "dist/index.js"),
  docsDir,
]);

// Set up pipes for communication
mcpProcess.stdout.on("data", (data) => {
  try {
    const response = JSON.parse(data.toString());

    // Extract the health check results
    if (response.result && response.result.metadata) {
      const metadata = response.result.metadata;

      console.log("\n=== DOCUMENTATION HEALTH CHECK RESULTS ===\n");
      console.log(`Overall Health Score: ${metadata.score}%`);
      console.log(`Total Documents: ${metadata.totalDocuments}`);
      console.log(`Metadata Completeness: ${metadata.metadataCompleteness}%`);
      console.log(`Broken Links: ${metadata.brokenLinks}`);
      console.log(`Orphaned Documents: ${metadata.orphanedDocuments}`);

      // Display issues if any
      if (metadata.issues && metadata.issues.length > 0) {
        console.log(`\nIssues Found (${metadata.issues.length}):`);

        // Group issues by type
        const issuesByType = {};
        metadata.issues.forEach((issue) => {
          if (!issuesByType[issue.type]) {
            issuesByType[issue.type] = [];
          }
          issuesByType[issue.type].push(issue);
        });

        // Display issues by type
        for (const [type, issues] of Object.entries(issuesByType)) {
          console.log(`\n${type.toUpperCase()} (${issues.length}):`);
          issues.forEach((issue) => {
            console.log(`- ${issue.path}: ${issue.message}`);
          });
        }
      } else {
        console.log("\nNo issues found in the documentation.");
      }

      // Display document distribution
      console.log("\nDocument Distribution:");

      console.log("\nBy Status:");
      for (const [status, count] of Object.entries(
        metadata.documentsByStatus || {}
      )) {
        console.log(`- ${status}: ${count}`);
      }

      console.log("\nBy Tag:");
      const sortedTags = Object.entries(metadata.documentsByTag || {}).sort(
        (a, b) => b[1] - a[1]
      ); // Sort by count in descending order

      for (const [tag, count] of sortedTags) {
        console.log(`- ${tag}: ${count}`);
      }

      console.log("\n=== END OF HEALTH CHECK ===\n");
    } else {
      console.log("Response:", JSON.stringify(response, null, 2));
    }

    // Exit after receiving the response
    mcpProcess.kill();
    process.exit(0);
  } catch (error) {
    // If it's not JSON, just log the output
    const output = data.toString().trim();
    if (
      output &&
      !output.includes("Loaded navigation") &&
      !output.includes("Orphaned documents")
    ) {
      console.log(output);
    }
  }
});

mcpProcess.stderr.on("data", (data) => {
  console.error(`Error: ${data}`);
});

// Wait for the service to start
setTimeout(() => {
  // Send a request to check documentation health
  const request = {
    jsonrpc: "2.0",
    method: "tools/call",
    params: {
      name: "check_documentation_health",
      arguments: {
        basePath: "docs",
        checkLinks: true,
        checkMetadata: true,
        checkOrphans: true,
      },
    },
    id: Date.now(),
  };

  console.log("Running documentation health check...");
  mcpProcess.stdin.write(JSON.stringify(request) + "\n");
}, 1000); // Give the service 1 second to start

// Handle process termination
process.on("SIGINT", () => {
  mcpProcess.kill();
  process.exit(0);
});
