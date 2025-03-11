"use strict";
/**
 * CLI interface for the MCP Documentation Management Service
 *
 * This script is meant to be run from the command line to start the MCP server.
 * It reads queries from stdin, processes them, and writes results to stdout.
 *
 * Usage:
 *   npx mcp-docs-service [options]
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.main = void 0;
const mcpServer_js_1 = require("../core/mcpServer.js");
/**
 * Main function to process stdin commands
 */
async function main(options = {
    docsDir: "./docs",
    createIfNotExists: false,
    forceStart: false,
}) {
    console.error("MCP Documentation Management Service started.");
    console.error(`Using docs directory: ${options.docsDir}`);
    if (options.createIfNotExists) {
        console.error("Directory will be created if it doesn't exist");
    }
    if (options.forceStart) {
        console.error("Force start enabled - will kill any existing instance");
    }
    console.error("Starting MCP server...");
    // Create a new MCP server
    const server = new mcpServer_js_1.MCPServer(options.docsDir, {
        createIfNotExists: options.createIfNotExists,
    });
    // Start the server with stdio transport
    await server.start({ forceStart: options.forceStart });
}
exports.main = main;
//# sourceMappingURL=index.js.map