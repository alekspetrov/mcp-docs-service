/**
 * CLI interface for the MCP Documentation Management Service
 *
 * This script is meant to be run from the command line to start the MCP server.
 * It reads queries from stdin, processes them, and writes results to stdout.
 *
 * Usage:
 *   npx mcp-docs-service [options]
 */
/**
 * Main function to process stdin commands
 */
export declare function main(options?: {
    docsDir: string;
    createIfNotExists: boolean;
    forceStart: boolean;
}): Promise<void>;
