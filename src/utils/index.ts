/**
 * Utility functions for the MCP Documentation Service
 */

/**
 * Check if a path is valid
 * @param path - Path to check
 * @returns True if the path is valid, false otherwise
 */
export function isValidPath(path: string): boolean {
  // Ensure path doesn't contain invalid characters or sequences
  return !path.includes("..") && !path.includes("//") && !path.startsWith("/");
}

/**
 * Normalize a path
 * @param path - Path to normalize
 * @returns Normalized path
 */
export function normalizePath(path: string): string {
  // Replace backslashes with forward slashes
  path = path.replace(/\\/g, "/");

  // Remove leading and trailing slashes
  path = path.replace(/^\/+|\/+$/g, "");

  // Replace multiple slashes with a single slash
  path = path.replace(/\/+/g, "/");

  return path;
}

/**
 * Get file extension
 * @param path - Path to get extension from
 * @returns File extension
 */
export function getFileExtension(path: string): string {
  const match = path.match(/\.([^.]+)$/);
  return match ? `.${match[1].toLowerCase()}` : "";
}

/**
 * Get file name
 * @param path - Path to get name from
 * @returns File name
 */
export function getFileName(path: string): string {
  const match = path.match(/([^/]+)$/);
  return match ? match[1] : "";
}

/**
 * Get directory name
 * @param path - Path to get directory name from
 * @returns Directory name
 */
export function getDirectoryName(path: string): string {
  const match = path.match(/([^/]+)\/[^/]+$/);
  return match ? match[1] : "";
}

/**
 * Join paths
 * @param paths - Paths to join
 * @returns Joined path
 */
export function joinPaths(...paths: string[]): string {
  return normalizePath(paths.join("/"));
}

/**
 * Escape regex special characters
 * @param str - String to escape
 * @returns Escaped string
 */
export function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Calculate relevance score
 * @param text - Text to search in
 * @param query - Query to search for
 * @returns Relevance score (0-1)
 */
export function calculateRelevance(text: string, query: string): number {
  if (!query || !text) return 0;

  // Convert to lowercase for case-insensitive matching
  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();

  // Check if the query is in the text
  if (!lowerText.includes(lowerQuery)) return 0;

  // Calculate relevance based on frequency and position
  const frequency = (
    lowerText.match(new RegExp(escapeRegex(lowerQuery), "g")) || []
  ).length;
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

/**
 * Generate excerpt
 * @param text - Text to generate excerpt from
 * @param query - Query to highlight
 * @param length - Excerpt length
 * @returns Excerpt
 */
export function generateExcerpt(
  text: string,
  query: string,
  length: number = 150
): string {
  if (!text) return "";
  if (!query) return text.substring(0, length);

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
    } else if (end === text.length) {
      start = Math.max(0, text.length - length);
    }
  }

  // Generate the excerpt
  let excerpt = text.substring(start, end);

  // Add ellipsis if needed
  if (start > 0) excerpt = "..." + excerpt;
  if (end < text.length) excerpt = excerpt + "...";

  return excerpt;
}
