import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { spawn } from "child_process";
import readline from "readline";
import fs from "fs/promises";
import path from "path";
import { createTestDocsDir, cleanupTestDocsDir } from "../test-utils";

describe("MCP Service E2E", () => {
  let testDocsDir: string;
  let service: ReturnType<typeof spawn>;
  let rl: readline.Interface;

  beforeAll(async () => {
    // Create a test docs directory
    testDocsDir = await createTestDocsDir();

    // Start the MCP service
    service = spawn("node", [
      "dist/index.js",
      "--docs-dir",
      testDocsDir,
      "--create-dir",
    ]);

    // Create readline interface for reading service output
    rl = readline.createInterface({
      input: service.stdout,
      terminal: false,
    });

    // Log service errors for debugging
    service.stderr.on("data", (data) => {
      console.error("Service error:", data.toString());
    });

    // Wait for service to start
    await new Promise((resolve) => setTimeout(resolve, 1000));
  });

  afterAll(async () => {
    // Kill the service
    service.kill();

    // Clean up the test docs directory
    await cleanupTestDocsDir(testDocsDir);
  });

  it("should handle JSON-RPC requests correctly", async () => {
    // Step 1: List tools
    const tools = await sendRequest(service, rl, {
      jsonrpc: "2.0",
      id: 1,
      method: "tools/list",
      params: {},
    });

    // Check that tools are returned
    expect(tools.result.tools).toBeInstanceOf(Array);
    expect(tools.result.tools.length).toBeGreaterThan(0);

    // Find the write_document tool
    const writeDocTool = tools.result.tools.find(
      (tool: any) => tool.name === "write_document"
    );
    expect(writeDocTool).toBeDefined();

    // Step 2: Write a document
    const writeResult = await sendRequest(service, rl, {
      jsonrpc: "2.0",
      id: 2,
      method: "tools/call",
      params: {
        name: "write_document",
        arguments: {
          path: "test.md",
          content: `---
title: Test Document
description: A test document for E2E testing
author: E2E Test
date: ${new Date().toISOString().split("T")[0]}
tags:
  - test
  - e2e
status: published
---

# Test Document

This is a test document created by the E2E test.
`,
        },
      },
    });

    // Check that the document was written
    expect(writeResult.result.content[0].text).toContain(
      "Successfully wrote to test.md"
    );

    // Step 3: Read the document
    const readResult = await sendRequest(service, rl, {
      jsonrpc: "2.0",
      id: 3,
      method: "tools/call",
      params: {
        name: "read_document",
        arguments: {
          path: "test.md",
        },
      },
    });

    // Check that the document can be read
    expect(readResult.result.content[0].text).toContain("# Test Document");
    expect(readResult.result.metadata.title).toBe("Test Document");

    // Step 4: Check documentation health
    const healthResult = await sendRequest(service, rl, {
      jsonrpc: "2.0",
      id: 4,
      method: "tools/call",
      params: {
        name: "check_documentation_health",
        arguments: {
          basePath: "",
        },
      },
    });

    // Check that health check works
    expect(healthResult.result.content[0].text).toContain("Health Score:");
    expect(healthResult.result.metadata.totalDocuments).toBeGreaterThan(0);
  });
});

/**
 * Helper function to send a JSON-RPC request to the service and wait for the response
 */
function sendRequest(
  service: ReturnType<typeof spawn>,
  rl: readline.Interface,
  request: any
): Promise<any> {
  return new Promise((resolve, reject) => {
    const responseHandler = (line: string) => {
      try {
        const response = JSON.parse(line);
        if (response.id === request.id) {
          // Remove this listener once we get the matching response
          rl.removeListener("line", responseHandler);

          if (response.error) {
            reject(
              new Error(`Error in response: ${JSON.stringify(response.error)}`)
            );
          } else {
            resolve(response);
          }
        }
      } catch (error) {
        // Not JSON or not our response, ignore
      }
    };

    // Add listener for this specific response
    rl.on("line", responseHandler);

    // Send the request
    service.stdin.write(JSON.stringify(request) + "\n");
  });
}
