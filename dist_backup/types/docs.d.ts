/**
 * Metadata for documentation files
 */
export interface DocumentMetadata {
    title?: string;
    order?: number;
    description?: string;
    author?: string;
    date?: Date;
    tags?: string[];
    status?: string;
    [key: string]: any;
}
/**
 * Entry for a documentation file
 */
export interface DocumentEntry {
    path: string;
    name: string;
    metadata: DocumentMetadata;
}
/**
 * Tree entry for documentation structure
 */
export interface TreeEntry {
    name: string;
    path: string;
    type: string;
    metadata?: DocumentMetadata;
    children: TreeEntry[];
    error?: string;
}
/**
 * Navigation item for documentation
 */
export interface NavigationItem {
    title: string;
    path: string | null;
    order: number;
    items?: NavigationItem[];
}
/**
 * Navigation section for documentation
 */
export interface NavigationSection {
    title: string;
    path: string | null;
    items: NavigationItem[];
    order: number;
}
/**
 * Health issue for documentation
 */
export interface HealthIssue {
    path: string;
    type: "missing_metadata" | "broken_link" | "orphaned" | "missing_reference";
    severity: "error" | "warning" | "info";
    message: string;
    details?: any;
}
/**
 * Health check result for documentation
 */
export interface HealthCheckResult {
    score: number;
    totalDocuments: number;
    issues: HealthIssue[];
    metadataCompleteness: number;
    brokenLinks: number;
    orphanedDocuments: number;
    missingReferences: number;
    documentsByStatus?: Record<string, number>;
    documentsByTag?: Record<string, number>;
}
