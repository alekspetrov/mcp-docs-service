/**
 * MCP Server Implementation
 * This file implements the Model Context Protocol server using the official SDK
 */
import { MCPQueryResult } from "../types/index.js";
export declare class MCPServer {
    private docManager;
    private docAnalyzer;
    private server;
    constructor(docsDir?: string, options?: {
        createIfNotExists?: boolean;
        fileExtensions?: string[];
    });
    /**
     * Register all resources with the MCP server
     */
    private registerResources;
    /**
     * Register all tools with the MCP server
     */
    private registerTools;
    /**
     * Start the server using stdio transport
     * Checks if another instance is already running
     */
    start(options?: {
        forceStart?: boolean;
    }): Promise<void>;
    /**
     * Legacy method to execute a query using the old format
     * This is kept for backward compatibility
     */
    executeQuery(sql: string): Promise<MCPQueryResult>;
    /**
     * Parse a query string into command and parameters
     * This is used for backward compatibility with the old query format
     */
    private parseQuery;
}
