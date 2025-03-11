/**
 * MCP Documentation Management Server
 * This server implements the Model Context Protocol for managing documentation
 */
import { MCPQueryResult } from "../types/index.js";
export declare class MCPDocsServer {
    private docManager;
    private docAnalyzer;
    constructor(docsDir?: string, options?: {
        createIfNotExists?: boolean;
        fileExtensions?: string[];
    });
    /**
     * Execute a query using the MCP protocol
     */
    executeQuery(sql: string): Promise<MCPQueryResult>;
    /**
     * Parse a query string into command and parameters
     */
    private parseQuery;
    /**
     * List all markdown files
     */
    private listFiles;
    /**
     * List all directories
     */
    private listDirectories;
    /**
     * Get a document by path
     */
    private getDocument;
    /**
     * Search for documents
     */
    private searchDocuments;
    /**
     * Create a new document
     */
    private createDocument;
    /**
     * Update an existing document
     */
    private updateDocument;
    /**
     * Delete a document
     */
    private deleteDocument;
    /**
     * Analyze documentation
     */
    private analyzeDocumentation;
    /**
     * Get documentation health score
     */
    private getHealthScore;
    /**
     * Get suggestions for improving documentation
     */
    private getSuggestions;
}
