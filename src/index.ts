/**
 * MCP Documentation Management Service
 * Main entry point for the package
 */

// Export core functionality
export * from "./core/docManager.js";
export * from "./core/docProcessor.js";
export * from "./core/docAnalyzer.js";
export * from "./core/mcpDocsServer.js";

// Export types
export * from "./types/index.js";

// Export utility functions
export * from "./utils/index.js";

// Import core components
import { MCPDocsServer } from "./core/mcpDocsServer.js";

/**
 * MCP Query function that can be registered with Cursor's MCP system
 * @param sql - The SQL-like query to execute
 * @param options - Options for the MCP server
 * @returns The query result
 */
export async function query(
  sql: string,
  options: {
    docsDir?: string;
    createIfNotExists?: boolean;
    fileExtensions?: string[];
  } = {}
) {
  // Create a server instance with the specified options
  const server = new MCPDocsServer(options.docsDir || "./docs", {
    createIfNotExists: options.createIfNotExists,
    fileExtensions: options.fileExtensions,
  });

  // Execute the query
  return await server.executeQuery(sql);
}

// Create and export singleton instance with default options
const mcpDocsServer = new MCPDocsServer("./docs", { createIfNotExists: true });
export default mcpDocsServer;
