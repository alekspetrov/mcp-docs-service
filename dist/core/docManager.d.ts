/**
 * Document Manager for handling file operations
 */
import { DocContent, DocCreateParams, DocSummary, DocUpdateParams, SearchOptions } from "../types/index.js";
export declare class DocManager {
    private baseDir;
    private options;
    constructor(baseDir?: string, options?: {
        createIfNotExists?: boolean;
        fileExtensions?: string[];
    });
    /**
     * Initialize the docs directory
     */
    private initializeDirectory;
    /**
     * List all markdown files in a directory recursively
     */
    listMarkdownFiles(dir?: string): Promise<string[]>;
    /**
     * Get document content and metadata
     */
    getDocument(filePath: string): Promise<DocContent | null>;
    /**
     * List directories in the docs folder
     */
    listDirectories(dir?: string): Promise<string[]>;
    /**
     * Create a new document
     */
    createDocument(params: DocCreateParams): Promise<boolean>;
    /**
     * Update an existing document
     */
    updateDocument(params: DocUpdateParams): Promise<boolean>;
    /**
     * Delete a document
     */
    deleteDocument(filePath: string): Promise<boolean>;
    /**
     * Basic search for documents matching query
     */
    searchDocuments(options: SearchOptions): Promise<DocSummary[]>;
    /**
     * Get all documents as summaries
     */
    getAllDocumentSummaries(directory?: string): Promise<DocSummary[]>;
}
