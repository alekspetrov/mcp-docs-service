import { FileInfo } from "../types/file.js";
/**
 * Gets file statistics and information
 */
export declare function getFileStats(filePath: string): Promise<FileInfo>;
/**
 * Searches for files matching a pattern
 */
export declare function searchFiles(rootPath: string, pattern: string, excludePatterns?: string[]): Promise<string[]>;
/**
 * Normalizes line endings to LF
 */
export declare function normalizeLineEndings(text: string): string;
/**
 * Creates a unified diff between two text contents
 */
export declare function createUnifiedDiff(originalContent: string, newContent: string, filepath?: string): string;
/**
 * Applies edits to a file
 */
export declare function applyFileEdits(filePath: string, edits: Array<{
    oldText: string;
    newText: string;
}>, dryRun?: boolean): Promise<string>;
