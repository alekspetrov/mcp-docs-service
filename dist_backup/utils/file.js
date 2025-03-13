import fs from "fs/promises";
import path from "path";
import { createTwoFilesPatch } from "diff";
import { minimatch } from "minimatch";
/**
 * Gets file statistics and information
 */
export async function getFileStats(filePath) {
    const stats = await fs.stat(filePath);
    // Convert file mode to permission string (e.g., "rwxr-xr-x")
    const mode = stats.mode;
    const permissions = [
        stats.mode & 0o400 ? "r" : "-",
        stats.mode & 0o200 ? "w" : "-",
        stats.mode & 0o100 ? "x" : "-",
        stats.mode & 0o040 ? "r" : "-",
        stats.mode & 0o020 ? "w" : "-",
        stats.mode & 0o010 ? "x" : "-",
        stats.mode & 0o004 ? "r" : "-",
        stats.mode & 0o002 ? "w" : "-",
        stats.mode & 0o001 ? "x" : "-",
    ].join("");
    return {
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime,
        accessed: stats.atime,
        isDirectory: stats.isDirectory(),
        isFile: stats.isFile(),
        permissions,
    };
}
/**
 * Searches for files matching a pattern
 */
export async function searchFiles(rootPath, pattern, excludePatterns = []) {
    const results = [];
    async function search(currentPath) {
        const entries = await fs.readdir(currentPath, { withFileTypes: true });
        for (const entry of entries) {
            const entryPath = path.join(currentPath, entry.name);
            const relativePath = path.relative(rootPath, entryPath);
            // Check if path should be excluded
            if (excludePatterns.some((excludePattern) => minimatch(relativePath, excludePattern))) {
                continue;
            }
            if (entry.isDirectory()) {
                await search(entryPath);
            }
            else if (minimatch(relativePath, pattern)) {
                results.push(entryPath);
            }
        }
    }
    await search(rootPath);
    return results;
}
/**
 * Normalizes line endings to LF
 */
export function normalizeLineEndings(text) {
    return text.replace(/\r\n/g, "\n");
}
/**
 * Creates a unified diff between two text contents
 */
export function createUnifiedDiff(originalContent, newContent, filepath = "file") {
    return createTwoFilesPatch(filepath, filepath, normalizeLineEndings(originalContent), normalizeLineEndings(newContent), "", "", { context: 3 });
}
/**
 * Applies edits to a file
 */
export async function applyFileEdits(filePath, edits, dryRun = false) {
    let content = await fs.readFile(filePath, "utf-8");
    content = normalizeLineEndings(content);
    // Apply all edits
    for (const edit of edits) {
        const { oldText, newText } = edit;
        const normalizedOldText = normalizeLineEndings(oldText);
        if (!content.includes(normalizedOldText)) {
            throw new Error(`Edit failed: Could not find text to replace in ${filePath}`);
        }
        content = content.replace(normalizedOldText, normalizeLineEndings(newText));
    }
    // Create a diff to show changes
    const originalContent = await fs.readFile(filePath, "utf-8");
    const diff = createUnifiedDiff(originalContent, content, filePath);
    // Write the changes if not a dry run
    if (!dryRun) {
        await fs.writeFile(filePath, content);
    }
    return diff;
}
//# sourceMappingURL=file.js.map