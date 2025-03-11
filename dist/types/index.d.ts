/**
 * Types for the MCP Documentation Management Service
 */
export interface DocMetadata {
    title: string;
    description?: string;
    tags?: string[];
    lastUpdated?: string;
    status?: "draft" | "review" | "published";
    globs?: string[];
    alwaysApply?: boolean;
}
export interface DocContent {
    metadata: DocMetadata;
    content: string;
    path: string;
}
export interface SearchOptions {
    query: string;
    tags?: string[];
    status?: "draft" | "review" | "published";
    directory?: string;
}
export interface DocUpdateParams {
    path: string;
    content?: string;
    metadata?: Partial<DocMetadata>;
}
export interface DocCreateParams {
    path: string;
    content: string;
    metadata: DocMetadata;
}
export interface MCPQueryResult {
    success: boolean;
    data?: any;
    error?: string;
}
export interface DocSummary {
    title: string;
    description?: string;
    path: string;
    lastUpdated?: string;
    tags?: string[];
    status?: "draft" | "review" | "published";
}
export interface DocAnalysisResult {
    documentCount: number;
    byStatus?: Record<string, number>;
    byDirectory?: Record<string, number>;
    recentlyUpdated?: DocSummary[];
    missingDescriptions?: DocSummary[];
}
