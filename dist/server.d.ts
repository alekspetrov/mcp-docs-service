/**
 * Main MCP Documentation Server class
 */
export declare class MCPDocsServer {
    private options;
    private server;
    private docsDir;
    private fileExtensions;
    /**
     * Create a new MCP Documentation Server
     *
     * @param docsDir - The directory to store documentation in
     * @param options - Configuration options
     */
    constructor(docsDir?: string, options?: {
        createIfNotExists?: boolean;
        fileExtensions?: string[];
    });
    /**
     * Set up the request handlers for the server
     */
    private setupHandlers;
    /**
     * Execute a handler for the specified tool
     *
     * @param name - The tool name
     * @param args - The tool arguments
     * @returns The result of the tool execution
     */
    executeHandler(name: string, args: any): Promise<string>;
    /**
     * Ensure the docs directory exists
     */
    private ensureDocsDir;
    /**
     * Get the absolute path to a file or directory
     *
     * @param relativePath - The path relative to the docs directory
     * @returns The absolute path
     */
    private getAbsolutePath;
    /**
     * Parse a document with frontmatter
     *
     * @param content - The document content
     * @returns The parsed document with metadata
     */
    private parseDocument;
    /**
     * Serialize a document with metadata to a string
     *
     * @param content - The document content
     * @param metadata - The document metadata
     * @returns The serialized document with frontmatter
     */
    private serializeDocument;
    /**
     * Get all files in a directory recursively
     *
     * @param dir - The directory to search
     * @param basePath - The base path to use for relative paths
     * @returns A list of files
     */
    private getAllFiles;
    /**
     * Get all directories in a directory
     *
     * @param dir - The directory to search
     * @param basePath - The base path to use for relative paths
     * @returns A list of directories
     */
    private getAllDirectories;
    /**
     * Read a document and its metadata
     *
     * @param docPath - The path to the document
     * @returns The document with metadata
     */
    private readDocument;
    /**
     * Get all documents in a directory
     *
     * @param directory - The directory to search
     * @returns A list of documents with metadata
     */
    private getAllDocuments;
    /**
     * Handle the list_files tool
     *
     * @param args - The tool arguments
     * @returns A list of files
     */
    private handleListFiles;
    /**
     * Handle the list_directories tool
     *
     * @param args - The tool arguments
     * @returns A list of directories
     */
    private handleListDirectories;
    /**
     * Handle the get_document tool
     *
     * @param args - The tool arguments
     * @returns The document content and metadata
     */
    private handleGetDocument;
    /**
     * Handle the create_document tool
     *
     * @param args - The tool arguments
     * @returns A success message
     */
    private handleCreateDocument;
    /**
     * Handle the update_document tool
     *
     * @param args - The tool arguments
     * @returns A success message
     */
    private handleUpdateDocument;
    /**
     * Handle the delete_document tool
     *
     * @param args - The tool arguments
     * @returns A success message
     */
    private handleDeleteDocument;
    /**
     * Handle the search_documents tool
     *
     * @param args - The tool arguments
     * @returns Documents matching the search criteria
     */
    private handleSearchDocuments;
    /**
     * Handle the analyze_docs tool
     *
     * @param args - The tool arguments
     * @returns Analysis of documentation health
     */
    private handleAnalyzeDocs;
    /**
     * Handle the get_health_score tool
     *
     * @param args - The tool arguments
     * @returns Documentation health score
     */
    private handleGetHealthScore;
    /**
     * Handle the get_suggestions tool
     *
     * @param args - The tool arguments
     * @returns Suggestions for improving documentation
     */
    private handleGetSuggestions;
    /**
     * Connect the server to a transport
     *
     * @param transport - The transport to connect to
     */
    connect(transport: any): Promise<void>;
}
