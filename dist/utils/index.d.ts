/**
 * Utility functions for the MCP Documentation Service
 */
/**
 * Check if a path is valid
 * @param path - Path to check
 * @returns True if the path is valid, false otherwise
 */
export declare function isValidPath(path: string): boolean;
/**
 * Normalize a path
 * @param path - Path to normalize
 * @returns Normalized path
 */
export declare function normalizePath(path: string): string;
/**
 * Get file extension
 * @param path - Path to get extension from
 * @returns File extension
 */
export declare function getFileExtension(path: string): string;
/**
 * Get file name
 * @param path - Path to get name from
 * @returns File name
 */
export declare function getFileName(path: string): string;
/**
 * Get directory name
 * @param path - Path to get directory name from
 * @returns Directory name
 */
export declare function getDirectoryName(path: string): string;
/**
 * Join paths
 * @param paths - Paths to join
 * @returns Joined path
 */
export declare function joinPaths(...paths: string[]): string;
/**
 * Escape regex special characters
 * @param str - String to escape
 * @returns Escaped string
 */
export declare function escapeRegex(str: string): string;
/**
 * Calculate relevance score
 * @param text - Text to search in
 * @param query - Query to search for
 * @returns Relevance score (0-1)
 */
export declare function calculateRelevance(text: string, query: string): number;
/**
 * Generate excerpt
 * @param text - Text to generate excerpt from
 * @param query - Query to highlight
 * @param length - Excerpt length
 * @returns Excerpt
 */
export declare function generateExcerpt(text: string, query: string, length?: number): string;
