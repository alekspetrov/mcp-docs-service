/**
 * Normalizes a path consistently
 */
export declare function normalizePath(p: string): string;
/**
 * Expands the home directory in a path (e.g., ~/docs -> /home/user/docs)
 */
export declare function expandHome(p: string): string;
/**
 * Validates that a path is within allowed directories
 * @param p The path to validate
 * @param allowedDirectories Array of allowed directory paths
 * @returns The normalized path if valid
 * @throws Error if path is not within allowed directories
 */
export declare function validatePath(p: string, allowedDirectories: string[]): Promise<string>;
