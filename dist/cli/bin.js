#!/usr/bin/env node
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { MCPDocsServer } from "../server.js";
import path from "path";
import fs from "fs/promises";
// Parse command line arguments
const args = process.argv.slice(2);
// Show help if requested
if (args.includes("--help") || args.includes("-h")) {
    console.error(`
MCP Documentation Service - A Model Context Protocol implementation for documentation management

Usage:
  mcp-docs-service <docs-directory> [additional-directories...]

Options:
  --help, -h          Show this help message
  `);
    process.exit(0);
}
// Ensure at least one directory is provided
if (args.length === 0) {
    console.error("Error: At least one documentation directory must be specified");
    console.error("Use --help for usage information");
    process.exit(1);
}
// Process allowed directories
const docsDirectories = args.map((dir) => path.resolve(process.cwd(), dir));
async function validateDirectories() {
    for (const dir of docsDirectories) {
        try {
            const stats = await fs.stat(dir);
            if (!stats.isDirectory()) {
                console.error(`Error: ${dir} is not a directory`);
                process.exit(1);
            }
        }
        catch (error) {
            // Create directory if it doesn't exist
            try {
                await fs.mkdir(dir, { recursive: true });
                console.error(`Created directory: ${dir}`);
            }
            catch (createError) {
                console.error(`Error accessing or creating directory ${dir}:`, createError);
                process.exit(1);
            }
        }
    }
}
async function runServer() {
    try {
        await validateDirectories();
        console.error(`MCP Documentation Service starting...`);
        console.error(`Docs directories: ${docsDirectories.join(", ")}`);
        // Use the first directory as the primary docs dir
        const server = new MCPDocsServer(docsDirectories[0], {
            // All directories are pre-validated/created
            createIfNotExists: false,
        });
        const transport = new StdioServerTransport();
        await server.connect(transport);
        console.error(`MCP Documentation Service running on stdio`);
    }
    catch (error) {
        console.error("Error starting server:", error);
        process.exit(1);
    }
}
runServer().catch((error) => {
    console.error("Fatal error running server:", error);
    process.exit(1);
});
//# sourceMappingURL=bin.js.map