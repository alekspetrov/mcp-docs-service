/**
 * Document metadata
 */
export interface DocumentMetadata {
    title?: string;
    description?: string;
    author?: string;
    date?: string;
    tags?: string[];
    status?: "draft" | "review" | "published" | "archived";
    [key: string]: any;
}
/**
 * Document with metadata
 */
export interface Document {
    path: string;
    content: string;
    metadata: DocumentMetadata;
}
/**
 * Documentation analysis
 */
export interface DocsAnalysis {
    totalDocuments: number;
    statistics: {
        documentsWithTags: number;
        documentsWithStatus: number;
        averageLength: number;
        tagsPercentage: number;
        statusPercentage: number;
    };
    issues: {
        shortDocuments: string[];
        missingTitles: string[];
    };
}
/**
 * MCPDocsServer options
 */
export interface MCPDocsServerOptions {
    createIfNotExists?: boolean;
    fileExtensions?: string[];
}
