"use strict";
/**
 * Utility functions for the MCP Documentation Service
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateExcerpt = exports.calculateRelevance = exports.escapeRegex = exports.joinPaths = exports.getDirectoryName = exports.getFileName = exports.getFileExtension = exports.normalizePath = exports.isValidPath = void 0;
/**
 * Check if a path is valid
 * @param path - Path to check
 * @returns True if the path is valid, false otherwise
 */
function isValidPath(path) {
    // Ensure path doesn't contain invalid characters or sequences
    return !path.includes("..") && !path.includes("//") && !path.startsWith("/");
}
exports.isValidPath = isValidPath;
/**
 * Normalize a path
 * @param path - Path to normalize
 * @returns Normalized path
 */
function normalizePath(path) {
    // Replace backslashes with forward slashes
    path = path.replace(/\\/g, "/");
    // Remove leading and trailing slashes
    path = path.replace(/^\/+|\/+$/g, "");
    // Replace multiple slashes with a single slash
    path = path.replace(/\/+/g, "/");
    return path;
}
exports.normalizePath = normalizePath;
/**
 * Get file extension
 * @param path - Path to get extension from
 * @returns File extension
 */
function getFileExtension(path) {
    const match = path.match(/\.([^.]+)$/);
    return match ? `.${match[1].toLowerCase()}` : "";
}
exports.getFileExtension = getFileExtension;
/**
 * Get file name
 * @param path - Path to get name from
 * @returns File name
 */
function getFileName(path) {
    const match = path.match(/([^/]+)$/);
    return match ? match[1] : "";
}
exports.getFileName = getFileName;
/**
 * Get directory name
 * @param path - Path to get directory name from
 * @returns Directory name
 */
function getDirectoryName(path) {
    const match = path.match(/([^/]+)\/[^/]+$/);
    return match ? match[1] : "";
}
exports.getDirectoryName = getDirectoryName;
/**
 * Join paths
 * @param paths - Paths to join
 * @returns Joined path
 */
function joinPaths(...paths) {
    return normalizePath(paths.join("/"));
}
exports.joinPaths = joinPaths;
/**
 * Escape regex special characters
 * @param str - String to escape
 * @returns Escaped string
 */
function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
exports.escapeRegex = escapeRegex;
/**
 * Calculate relevance score
 * @param text - Text to search in
 * @param query - Query to search for
 * @returns Relevance score (0-1)
 */
function calculateRelevance(text, query) {
    if (!query || !text)
        return 0;
    // Convert to lowercase for case-insensitive matching
    const lowerText = text.toLowerCase();
    const lowerQuery = query.toLowerCase();
    // Check if the query is in the text
    if (!lowerText.includes(lowerQuery))
        return 0;
    // Calculate relevance based on frequency and position
    const frequency = (lowerText.match(new RegExp(escapeRegex(lowerQuery), "g")) || []).length;
    const position = lowerText.indexOf(lowerQuery);
    const textLength = text.length;
    // Higher relevance for:
    // - More occurrences of the query
    // - Earlier position of the query
    // - Shorter text (query is more significant in shorter text)
    const frequencyFactor = Math.min(frequency / 5, 1); // Cap at 1
    const positionFactor = 1 - position / textLength;
    const lengthFactor = 1 - Math.min(textLength / 1000, 0.9); // Cap at 0.9
    return frequencyFactor * 0.4 + positionFactor * 0.4 + lengthFactor * 0.2;
}
exports.calculateRelevance = calculateRelevance;
/**
 * Generate excerpt
 * @param text - Text to generate excerpt from
 * @param query - Query to highlight
 * @param length - Excerpt length
 * @returns Excerpt
 */
function generateExcerpt(text, query, length = 150) {
    if (!text)
        return "";
    if (!query)
        return text.substring(0, length);
    // Find the position of the query
    const lowerText = text.toLowerCase();
    const lowerQuery = query.toLowerCase();
    const position = lowerText.indexOf(lowerQuery);
    if (position === -1) {
        // Query not found, return the beginning of the text
        return text.substring(0, length) + (text.length > length ? "..." : "");
    }
    // Calculate start and end positions for the excerpt
    const halfLength = Math.floor(length / 2);
    let start = Math.max(0, position - halfLength);
    let end = Math.min(text.length, position + query.length + halfLength);
    // Adjust if the excerpt is shorter than the desired length
    if (end - start < length) {
        if (start === 0) {
            end = Math.min(text.length, length);
        }
        else if (end === text.length) {
            start = Math.max(0, text.length - length);
        }
    }
    // Generate the excerpt
    let excerpt = text.substring(start, end);
    // Add ellipsis if needed
    if (start > 0)
        excerpt = "..." + excerpt;
    if (end < text.length)
        excerpt = excerpt + "...";
    return excerpt;
}
exports.generateExcerpt = generateExcerpt;
//# sourceMappingURL=index.js.map