/**
 * MCP Documentation Management Service
 * Main entry point for the package
 */

// Export core functionality
export * from "./core/docManager.ts";
export * from "./core/docProcessor.ts";
export * from "./core/docAnalyzer.ts";
export * from "./core/mcpDocsServer.ts";

// Export types
export * from "./types/index.ts";

// Export utility functions
export * from "./utils/index.ts";

// Create and export singleton instance
import { MCPDocsServer } from "./core/mcpDocsServer.ts";
const mcpDocsServer = new MCPDocsServer("./docs");

/**
 * MCP Query function that can be registered with Cursor's MCP system
 */
export async function query(sql: string) {
  return await mcpDocsServer.executeQuery(sql);
}

export default mcpDocsServer;
