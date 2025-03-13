import fs from "fs/promises";
import path from "path";
import { validatePath } from "../utils/path.js";
import { getFileStats, searchFiles, applyFileEdits } from "../utils/file.js";
/**
 * Reads a file and returns its content
 */
export async function readFile(filePath, allowedDirectories) {
    try {
        const normalizedPath = await validatePath(filePath, allowedDirectories);
        const content = await fs.readFile(normalizedPath, "utf-8");
        return {
            content: [{ type: "text", text: "File read successfully" }],
            metadata: {
                path: filePath,
                content,
            },
        };
    }
    catch (error) {
        return {
            content: [{ type: "text", text: `Error reading file: ${error.message}` }],
            isError: true,
        };
    }
}
/**
 * Writes content to a file
 */
export async function writeFile(filePath, content, allowedDirectories) {
    try {
        const normalizedPath = await validatePath(filePath, allowedDirectories);
        // Ensure the directory exists
        const dirPath = path.dirname(normalizedPath);
        await fs.mkdir(dirPath, { recursive: true });
        // Write the file
        await fs.writeFile(normalizedPath, content);
        return {
            content: [{ type: "text", text: "File written successfully" }],
            metadata: {
                path: filePath,
            },
        };
    }
    catch (error) {
        return {
            content: [{ type: "text", text: `Error writing file: ${error.message}` }],
            isError: true,
        };
    }
}
/**
 * Lists files in a directory
 */
export async function listFiles(dirPath, allowedDirectories) {
    try {
        const normalizedPath = await validatePath(dirPath, allowedDirectories);
        const entries = await fs.readdir(normalizedPath, { withFileTypes: true });
        const files = entries.map((entry) => ({
            name: entry.name,
            isDirectory: entry.isDirectory(),
            isFile: entry.isFile(),
        }));
        return {
            content: [
                { type: "text", text: `Listed ${files.length} files in ${dirPath}` },
            ],
            metadata: {
                path: dirPath,
                files,
            },
        };
    }
    catch (error) {
        return {
            content: [
                { type: "text", text: `Error listing files: ${error.message}` },
            ],
            isError: true,
        };
    }
}
/**
 * Gets information about a file
 */
export async function getFileInfo(filePath, allowedDirectories) {
    try {
        const normalizedPath = await validatePath(filePath, allowedDirectories);
        const fileInfo = await getFileStats(normalizedPath);
        return {
            content: [
                { type: "text", text: "File information retrieved successfully" },
            ],
            metadata: {
                path: filePath,
                info: fileInfo,
            },
        };
    }
    catch (error) {
        return {
            content: [
                { type: "text", text: `Error getting file info: ${error.message}` },
            ],
            isError: true,
        };
    }
}
/**
 * Searches for files matching a pattern
 */
export async function searchForFiles(rootPath, pattern, excludePatterns = [], allowedDirectories) {
    try {
        const normalizedPath = await validatePath(rootPath, allowedDirectories);
        const files = await searchFiles(normalizedPath, pattern, excludePatterns);
        return {
            content: [
                {
                    type: "text",
                    text: `Found ${files.length} files matching pattern "${pattern}"`,
                },
            ],
            metadata: {
                rootPath,
                pattern,
                excludePatterns,
                files,
            },
        };
    }
    catch (error) {
        return {
            content: [
                { type: "text", text: `Error searching files: ${error.message}` },
            ],
            isError: true,
        };
    }
}
/**
 * Applies edits to a file
 */
export async function editFile(filePath, edits, allowedDirectories) {
    try {
        const normalizedPath = await validatePath(filePath, allowedDirectories);
        const diff = await applyFileEdits(normalizedPath, edits, false);
        return {
            content: [{ type: "text", text: "File edited successfully" }],
            metadata: {
                path: filePath,
                diff,
            },
        };
    }
    catch (error) {
        return {
            content: [{ type: "text", text: `Error editing file: ${error.message}` }],
            isError: true,
        };
    }
}
/**
 * Gets the directory structure as a tree
 */
export async function getDirectoryTree(dirPath, allowedDirectories) {
    try {
        const normalizedPath = await validatePath(dirPath, allowedDirectories);
        async function buildTree(currentPath) {
            const entries = await fs.readdir(currentPath, { withFileTypes: true });
            const result = [];
            for (const entry of entries) {
                const entryPath = path.join(currentPath, entry.name);
                if (entry.isDirectory()) {
                    const children = await buildTree(entryPath);
                    result.push({
                        name: entry.name,
                        path: entryPath,
                        type: "directory",
                        children,
                    });
                }
                else {
                    result.push({
                        name: entry.name,
                        path: entryPath,
                        type: "file",
                    });
                }
            }
            // Sort entries: directories first, then files, both alphabetically
            result.sort((a, b) => {
                if (a.type !== b.type) {
                    return a.type === "directory" ? -1 : 1;
                }
                return a.name.localeCompare(b.name);
            });
            return result;
        }
        const tree = await buildTree(normalizedPath);
        return {
            content: [
                { type: "text", text: "Directory tree retrieved successfully" },
            ],
            metadata: {
                path: dirPath,
                tree,
            },
        };
    }
    catch (error) {
        return {
            content: [
                {
                    type: "text",
                    text: `Error getting directory tree: ${error.message}`,
                },
            ],
            isError: true,
        };
    }
}
//# sourceMappingURL=file.js.map