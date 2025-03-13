import { ToolResponse } from "../types/tools.js";
/**
 * Reads a file and returns its content
 */
export declare function readFile(filePath: string, allowedDirectories: string[]): Promise<ToolResponse>;
/**
 * Writes content to a file
 */
export declare function writeFile(filePath: string, content: string, allowedDirectories: string[]): Promise<ToolResponse>;
/**
 * Lists files in a directory
 */
export declare function listFiles(dirPath: string, allowedDirectories: string[]): Promise<ToolResponse>;
/**
 * Gets information about a file
 */
export declare function getFileInfo(filePath: string, allowedDirectories: string[]): Promise<ToolResponse>;
/**
 * Searches for files matching a pattern
 */
export declare function searchForFiles(rootPath: string, pattern: string, excludePatterns: string[] | undefined, allowedDirectories: string[]): Promise<ToolResponse>;
/**
 * Applies edits to a file
 */
export declare function editFile(filePath: string, edits: Array<{
    oldText: string;
    newText: string;
}>, allowedDirectories: string[]): Promise<ToolResponse>;
/**
 * Gets the directory structure as a tree
 */
export declare function getDirectoryTree(dirPath: string, allowedDirectories: string[]): Promise<ToolResponse>;
