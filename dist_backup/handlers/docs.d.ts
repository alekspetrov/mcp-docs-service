import { ToolResponse } from "../types/tools.js";
/**
 * Reads a markdown document and extracts its content and metadata
 */
export declare function readDocument(docPath: string, allowedDirectories: string[]): Promise<ToolResponse>;
/**
 * Lists all markdown documents in a directory
 */
export declare function listDocuments(basePath: string, allowedDirectories: string[]): Promise<ToolResponse>;
/**
 * Gets the structure of the documentation directory
 */
export declare function getStructure(basePath: string, allowedDirectories: string[]): Promise<ToolResponse>;
/**
 * Gets the navigation structure for the documentation
 */
export declare function getNavigation(basePath: string, allowedDirectories: string[]): Promise<ToolResponse>;
/**
 * Checks the health of documentation
 */
export declare function checkDocumentationHealth(basePath: string, options: {
    checkLinks?: boolean;
    checkMetadata?: boolean;
    checkOrphans?: boolean;
    requiredMetadataFields?: string[];
}, allowedDirectories: string[]): Promise<ToolResponse>;
